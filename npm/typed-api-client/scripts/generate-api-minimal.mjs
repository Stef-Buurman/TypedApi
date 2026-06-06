import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import { generateApi } from "swagger-typescript-api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runtimePackageJsonPath = path.resolve(__dirname, "../package.json");
const runtimePackageJson = JSON.parse(
  fs.readFileSync(runtimePackageJsonPath, "utf8"),
);

const consumerPackageJsonPath = path.resolve(process.cwd(), "package.json");
const consumerPackageJson = fs.existsSync(consumerPackageJsonPath)
  ? JSON.parse(fs.readFileSync(consumerPackageJsonPath, "utf8"))
  : {};

const isRunningInsidePackage =
  path.resolve(process.cwd()) === path.resolve(__dirname, "..");

const runtimePackageName = isRunningInsidePackage
  ? "../.."
  : runtimePackageJson.name;

const cwd = process.cwd();

const config = {
  ...(runtimePackageJson.config ?? {}),
  ...(consumerPackageJson.config ?? {}),
};

const swaggerFile =
  process.env.SWAGGER_FILE ??
  process.env.npm_config_swagger_file ??
  config.swaggerFile;

const swaggerUrl =
  process.env.SWAGGER_URL ??
  process.env.npm_config_swagger_url ??
  config.swaggerUrl ??
  "https://localhost:7000/swagger/v1/swagger.json";

const swaggerInput = swaggerFile ? path.resolve(cwd, swaggerFile) : swaggerUrl;

const apiRoot = path.resolve(
  cwd,
  process.env.API_OUTPUT ??
    process.env.npm_config_api_output ??
    config.apiOutput ??
    "src/api",
);
const generatedDir = path.join(apiRoot, "generated");
const methodsDir = path.join(apiRoot, "methods");

function pascalCase(value) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toQueryName(methodName) {
  return `${pascalCase(methodName)}Query`;
}

function cleanDirectory(directory) {
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }

  fs.mkdirSync(directory, { recursive: true });
}

async function writeFormattedFile(filePath, content) {
  const formatted = await prettier.format(content, {
    parser: "typescript",
  });

  fs.writeFileSync(filePath, formatted);
}

async function generateOpenApiClient() {
  cleanDirectory(generatedDir);
  cleanDirectory(methodsDir);
  fs.mkdirSync(methodsDir, { recursive: true });

  const generateOptions = {
    name: "Api.ts",
    output: generatedDir,
    httpClientType: "fetch",
    modular: true,
    cleanOutput: true,
    generateClient: true,
    generateRouteTypes: true,
    extractRequestParams: true,
    extractRequestBody: true,
    moduleNameFirstTag: true,
  };

  if (swaggerFile) {
    generateOptions.input = swaggerInput;
  } else {
    generateOptions.url = swaggerInput;
  }

  await generateApi(generateOptions);
}

async function createTypesFile() {
  const content = `
import { HttpResponse, RequestParams } from "../generated/http-client";

export type ExtractResponse<T> =
  T extends Promise<HttpResponse<infer R, any>> ? R : never;

export type UnwrapArray<T> = T extends (infer U)[] ? U : T;

export type ExtractDataIfPaginated<T> =
  T extends { data?: (infer U)[] | null } ? U : T;

export type SortableKeys<T> = keyof UnwrapArray<ExtractDataIfPaginated<T>>;

export type WithoutRequestParams<T extends any[]> =
  T extends [infer First, ...infer Rest]
    ? First extends RequestParams
      ? Rest
      : [First, ...WithoutRequestParams<Rest>]
    : [];
`.trim();

  await writeFormattedFile(path.join(methodsDir, "Types.ts"), content);
}

function getAllTsFiles(dir) {
  let results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllTsFiles(filePath));
    } else if (filePath.endsWith(".ts")) {
      results.push(filePath);
    }
  }

  return results;
}

function convertGeneratedUploadMethods(apiDir) {
  const tsFiles = getAllTsFiles(apiDir);

  console.log(
    `Checking ${tsFiles.length} TypeScript files for upload methods...`,
  );

  for (const filePath of tsFiles) {
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;

    content = content.replace(
      /(=\s*\(\s*data\s*:\s*)\{\s*(?:file|files)\??\s*:\s*File(?:\[\])?\s*;?\s*\}(\s*,\s*params\s*:\s*RequestParams\s*=\s*\{\}\s*,?\s*\))/g,
      "$1FormData$2",
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(
        `Updated upload method: ${path.relative(process.cwd(), filePath)}`,
      );
    }
  }
}

async function createMethodFiles() {
  const generatedFiles = fs
    .readdirSync(generatedDir)
    .filter(
      (file) =>
        file.endsWith(".ts") &&
        file !== "http-client.ts" &&
        file !== "data-contracts.ts" &&
        !file.endsWith("Route.ts") &&
        !file.includes(".api"),
    );

  const methodExports = [];

  for (const file of generatedFiles) {
    const filePath = path.join(generatedDir, file);
    const source = fs.readFileSync(filePath, "utf8");

    const baseName = file.replace(".ts", "");
    const className = baseName.split("-").map(pascalCase).join("");
    const instanceName = `${className.charAt(0).toLowerCase()}${className.slice(1)}Api`;

    const methodRegex = /^\s*(\w+)\s*=\s*\(/gm;

    const paginatedMethods = [];
    const simpleQueryMethods = [];
    const nonQueryMethods = [];

    let match;

    while ((match = methodRegex.exec(source)) !== null) {
      const methodName = match[1];

      const signatureRegex = new RegExp(
        `${methodName}\\s*=\\s*\\(([^)]*)\\)\\s*=>`,
        "m",
      );

      const signatureMatch = source.match(signatureRegex);

      if (!signatureMatch) {
        continue;
      }

      const params = signatureMatch[1].trim();

      const returnTypeRegex = new RegExp(
        `${methodName}[\\s\\S]*?this\\.request<([^,>]+)`,
        "m",
      );

      const returnMatch = source.match(returnTypeRegex);
      const returnType = returnMatch?.[1] ?? "";

      const isPaginated =
        returnType.includes("ApiPaginationResponse") ||
        returnType.trim().endsWith("[]");

      if (params.startsWith("query")) {
        if (isPaginated) {
          paginatedMethods.push(methodName);
        } else {
          simpleQueryMethods.push(methodName);
        }
      } else {
        nonQueryMethods.push(methodName);
      }
    }

    const queryTypes = [...paginatedMethods, ...simpleQueryMethods]
      .map((methodName) =>
        `
export type ${toQueryName(methodName)} =
  NonNullable<Parameters<${className}["${methodName}"]>[0]>;
`.trim(),
      )
      .join("\n\n");

    const paginatedMethodWrappers = paginatedMethods
      .map((methodName) =>
        `
export async function ${methodName}(
  filters: FilterFormValues<${toQueryName(methodName)}>[] = [],
  page = 1,
  pageSize = 100,
  sortBy: SortableKeys<
    ExtractResponse<ReturnType<${className}["${methodName}"]>>
  > | null = null,
  sortDirection?: SortDirection,
  toastOptions?: ToastOptions
): Promise<ApiResult<ExtractResponse<ReturnType<${className}["${methodName}"]>>>> {
  return handleApiResponse(
    () =>
      ${instanceName}.${methodName}(
        buildQuery<
          ${toQueryName(methodName)},
          UnwrapArray<
            ExtractDataIfPaginated<
              ExtractResponse<ReturnType<${className}["${methodName}"]>>
            >
          >
        >(filters, page, pageSize, sortBy, sortDirection)
      ),
    toastOptions
  );
}
`.trim(),
      )
      .join("\n\n");

    const simpleQueryMethodWrappers = simpleQueryMethods
      .map((methodName) =>
        `
export async function ${methodName}(
  query?: ${toQueryName(methodName)},
  toastOptions?: ToastOptions
): Promise<ApiResult<ExtractResponse<ReturnType<${className}["${methodName}"]>>>> {
  return handleApiResponse(
    () => ${instanceName}.${methodName}(query),
    toastOptions
  );
}
`.trim(),
      )
      .join("\n\n");

    const nonQueryMethodWrappers = nonQueryMethods
      .map((methodName) =>
        `
export async function ${methodName}(
  ...argsWithToast: [
    ...WithoutRequestParams<Parameters<${className}["${methodName}"]>>,
    ToastOptions?,
    RequestParams?
  ]
): Promise<ApiResult<ExtractResponse<ReturnType<${className}["${methodName}"]>>>> {
  const { args, toastOptions, params } =
    extractArgsToastsAndParams<
      WithoutRequestParams<Parameters<${className}["${methodName}"]>>
    >(argsWithToast);

    const requestArgs = [
    ...args,
    params ?? {}
    ] as unknown as Parameters<${className}["${methodName}"]>;

  return handleApiResponse(
    () => ${instanceName}.${methodName}(...requestArgs),
    toastOptions
  );
}
`.trim(),
      )
      .join("\n\n");

    const content = `
import {
  ApiResult,
  buildQuery,
  extractArgsToastsAndParams,
  FilterFormValues,
  handleApiResponse,
  SortDirection,
  ToastOptions
} from "${runtimePackageName}";

import { ${className} } from "../generated/${baseName}";
import { RequestParams } from "../generated/http-client";

import {
  ExtractDataIfPaginated,
  ExtractResponse,
  SortableKeys,
  UnwrapArray,
  WithoutRequestParams
} from "./Types";

/* =======================
   Query Types
   ======================= */
${queryTypes}

/* =======================
   API Instance
   ======================= */
const ${instanceName} = new ${className}();

/* =======================
   Paginated Query Methods
   ======================= */
${paginatedMethodWrappers}

/* =======================
   Simple Query Methods
   ======================= */
${simpleQueryMethodWrappers}

/* =======================
   Non-Query Methods
   ======================= */
${nonQueryMethodWrappers}
`.trim();

    const outputFile = path.join(methodsDir, `${className}.api.ts`);

    await writeFormattedFile(outputFile, content);

    methodExports.push(`export * from "./methods/${className}.api";`);
  }

  const apiIndexContent = `
export * from "./generated/data-contracts";
export * from "./generated/http-client";
export * from "./methods/Types";

${methodExports.join("\n")}
`.trim();

  await writeFormattedFile(path.join(apiRoot, "index.ts"), apiIndexContent);
}

async function main() {
  console.log(`Generating API from: ${swaggerInput}`);
  console.log(`Output folder: ${apiRoot}`);

  await generateOpenApiClient();

  convertGeneratedUploadMethods(generatedDir);

  await createTypesFile();
  await createMethodFiles();

  console.log("API generation completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
