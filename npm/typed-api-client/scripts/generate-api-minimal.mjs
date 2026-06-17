import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateApi } from "swagger-typescript-api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageRoot = path.resolve(__dirname, "..");
const runtimePackageJsonPath = path.join(packageRoot, "package.json");
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
  config.swaggerUrl;

const defaultSwaggerUrl = "https://localhost:7000/swagger/v1/swagger.json";

const swaggerBackupFileSetting = getStringSetting(
  process.env.TYPED_API_SWAGGER_BACKUP_FILE,
  process.env.npm_config_typed_api_swagger_backup_file,
  config.typedApiSwaggerBackupFile,
  "swagger/swagger.backup.json",
);

const swaggerBackupPath = path.resolve(packageRoot, swaggerBackupFileSetting);

const apiRoot = path.resolve(
  cwd,
  process.env.API_OUTPUT ??
    process.env.npm_config_api_output ??
    config.apiOutput ??
    "src/api",
);

const generatedDir = path.join(apiRoot, "generated");
const methodsDir = path.join(apiRoot, "methods");

const useTypeOnlyImports =
  process.env.TYPED_API_USE_TYPE_ONLY_IMPORTS === "true" ||
  process.env.npm_config_typed_api_use_type_only_imports === "true" ||
  config.typedApiUseTypeOnlyImports === true;

const useFilterFormValues =
  process.env.TYPED_API_USE_FILTER_FORM_VALUES === "true" ||
  process.env.npm_config_typed_api_use_filter_form_values === "true" ||
  config.typedApiUseFilterFormValues === true;

function getStringSetting(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return undefined;
}

const fallbackDefaultFunctionsPath = "defaultApiFunctions";

const defaultFunctionsPathSetting = getStringSetting(
  process.env.TYPED_API_DEFAULT_FUNCTIONS_PATH,
  process.env.npm_config_typed_api_default_functions_path,
  config.typedApiDefaultFunctionsPath,
  fallbackDefaultFunctionsPath,
);

const defaultFunctionsFilePath = path.resolve(cwd, defaultFunctionsPathSetting);

const defaultSuccessHandlerName = getStringSetting(
  process.env.TYPED_API_DEFAULT_SUCCESS_HANDLER,
  process.env.npm_config_typed_api_default_success_handler,
  config.typedApiDefaultSuccessHandler,
  "handleGoodResult",
);

const defaultErrorHandlerName = getStringSetting(
  process.env.TYPED_API_DEFAULT_ERROR_HANDLER,
  process.env.npm_config_typed_api_default_error_handler,
  config.typedApiDefaultErrorHandler,
  "handleErrors",
);

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


function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function writeSwaggerBackup(content, sourceLabel) {
  fs.mkdirSync(path.dirname(swaggerBackupPath), { recursive: true });
  fs.writeFileSync(swaggerBackupPath, content);

  console.log(
    `Updated Swagger backup from ${sourceLabel}: ${path.relative(packageRoot, swaggerBackupPath)}`,
  );
}

function copySwaggerBackupFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  // Validate that the backup is at least JSON. This prevents overwriting a good
  // backup with an invalid or empty file by accident.
  JSON.parse(content);

  writeSwaggerBackup(content, path.relative(cwd, filePath));
}

async function downloadSwaggerBackupFromUrl(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Swagger URL returned ${response.status} ${response.statusText}: ${url}`,
    );
  }

  const content = await response.text();

  // Validate before saving, so a server error page is never stored as backup.
  JSON.parse(content);

  writeSwaggerBackup(content, url);
}

function useBackupSwaggerInput(reason) {
  if (!fileExists(swaggerBackupPath)) {
    return undefined;
  }

  console.warn(
    `${reason} Using Swagger backup: ${path.relative(packageRoot, swaggerBackupPath)}`,
  );

  return {
    input: swaggerBackupPath,
    label: swaggerBackupPath,
  };
}

async function resolveSwaggerInput() {
  if (swaggerFile) {
    const swaggerFilePath = path.resolve(cwd, swaggerFile);

    if (fileExists(swaggerFilePath)) {
      copySwaggerBackupFromFile(swaggerFilePath);

      return {
        input: swaggerFilePath,
        label: swaggerFilePath,
      };
    }

    const backupInput = useBackupSwaggerInput(
      `Swagger file was not found: ${swaggerFilePath}.`,
    );

    if (backupInput) {
      return backupInput;
    }

    throw new Error(
      `Swagger file was not found and no backup exists: ${swaggerFilePath}`,
    );
  }

  if (swaggerUrl) {
    try {
      await downloadSwaggerBackupFromUrl(swaggerUrl);

      return {
        input: swaggerBackupPath,
        label: swaggerUrl,
      };
    } catch (error) {
      const backupInput = useBackupSwaggerInput(
        `Swagger URL is not available: ${swaggerUrl}.`,
      );

      if (backupInput) {
        return backupInput;
      }

      throw error;
    }
  }

  const defaultSwaggerFile = path.resolve(cwd, "swagger/swagger.json");

  if (fileExists(defaultSwaggerFile)) {
    copySwaggerBackupFromFile(defaultSwaggerFile);

    return {
      input: defaultSwaggerFile,
      label: defaultSwaggerFile,
    };
  }

  try {
    await downloadSwaggerBackupFromUrl(defaultSwaggerUrl);

    return {
      input: swaggerBackupPath,
      label: defaultSwaggerUrl,
    };
  } catch (error) {
    const backupInput = useBackupSwaggerInput(
      `Default Swagger file was not found and default Swagger URL is not available.`,
    );

    if (backupInput) {
      return backupInput;
    }

    throw error;
  }
}

async function writeFormattedFile(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function removeGeneratedRouteFiles() {
  const files = fs.readdirSync(generatedDir);

  for (const file of files) {
    if (/route\.ts$/i.test(file)) {
      fs.rmSync(path.join(generatedDir, file), { force: true });
    }
  }
}

async function generateOpenApiClient(swaggerInput) {
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

  generateOptions.input = swaggerInput;

  await generateApi(generateOptions);

  removeGeneratedRouteFiles();
}

function createImportStatement({ names, from, typeOnly = false }) {
  if (!names || names.length === 0) {
    return "";
  }

  const importKeyword = typeOnly ? "import type" : "import";

  return `${importKeyword} {
${names.map((name) => `  ${name},`).join("\n")}
} from "${from}";`;
}

function createAliasedImportStatement({ imports, from }) {
  if (!imports || imports.length === 0) {
    return "";
  }

  return `import {
${imports
  .map(({ name, alias }) =>
    alias && alias !== name ? `  ${name} as ${alias},` : `  ${name},`,
  )
  .join("\n")}
} from "${from}";`;
}

function resolveImportFilePath(fromDirectory, importPath) {
  if (!importPath.startsWith(".")) {
    return undefined;
  }

  const basePath = path.resolve(fromDirectory, importPath);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.jsx"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function createDefaultFunctionsFileIfMissing(filePath) {
  const extension = path.extname(filePath);
  const resolvedFilePath = extension ? filePath : `${filePath}.ts`;

  if (fs.existsSync(resolvedFilePath)) {
    return resolvedFilePath;
  }

  fs.mkdirSync(path.dirname(resolvedFilePath), { recursive: true });

  fs.writeFileSync(
    resolvedFilePath,
    `
${createImportStatement({
  names: ["ApiErrorResult", "ApiSuccessResult"],
  from: "typedapi-client-helpers",
  typeOnly: true,
})}

export function ${defaultSuccessHandlerName}<T>(
  _response: ApiSuccessResult<T>,
): void | Promise<void> {
  // Add your default success handling here.
}

export function ${defaultErrorHandlerName}<T>(
  _error: ApiErrorResult<T>,
): void | Promise<void> {
  // Add your default error handling here.
}
`,
  );

  console.log(
    `Created default API handler file: ${path.relative(process.cwd(), resolvedFilePath)}`,
  );

  return resolvedFilePath;
}

function toRelativeImportPath(fromDirectory, filePath) {
  let relativePath = path.relative(fromDirectory, filePath);

  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  relativePath = relativePath.replaceAll(path.sep, "/");

  return relativePath.replace(/\.(ts|tsx|js|jsx)$/, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fileExportsName(source, exportName) {
  const escapedName = escapeRegExp(exportName);

  const directExportPattern = new RegExp(
    `export\\s+(?:async\\s+)?(?:function|const|let|var|class)\\s+${escapedName}\\b`,
    "m",
  );

  if (directExportPattern.test(source)) {
    return true;
  }

  const namedExportBlocks = source.matchAll(/export\s*\{([\s\S]*?)\}/g);

  for (const match of namedExportBlocks) {
    const exportedNames = match[1]
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (
      exportedNames.some((part) => {
        const [localName, aliasName] = part
          .split(/\s+as\s+/)
          .map((name) => name.trim());

        return (
          aliasName === exportName || (!aliasName && localName === exportName)
        );
      })
    ) {
      return true;
    }
  }

  return false;
}

function resolveDefaultHandlers(importFromDirectory) {
  const defaultFunctionsFile =
    resolveImportFilePath(importFromDirectory, defaultFunctionsFilePath) ??
    createDefaultFunctionsFileIfMissing(defaultFunctionsFilePath);

  const source = fs.readFileSync(defaultFunctionsFile, "utf8");
  const hasSuccessHandler = fileExportsName(source, defaultSuccessHandlerName);
  const hasErrorHandler = fileExportsName(source, defaultErrorHandlerName);

  if (!hasSuccessHandler || !hasErrorHandler) {
    const missingNames = [
      ...(!hasSuccessHandler ? [defaultSuccessHandlerName] : []),
      ...(!hasErrorHandler ? [defaultErrorHandlerName] : []),
    ];

    console.warn(
      `Default API handlers were not imported because ${path.relative(
        process.cwd(),
        defaultFunctionsFile,
      )} does not export: ${missingNames.join(", ")}.`,
    );

    return undefined;
  }

  return {
    defaultFunctionsPath: toRelativeImportPath(
      importFromDirectory,
      defaultFunctionsFile,
    ),
    defaultSuccessHandlerName,
    defaultErrorHandlerName,
  };
}

function callbackOptionsExpression(defaultHandlers) {
  if (defaultHandlers) {
    return `{
      onSuccess: onSuccess ?? typedApiDefaultSuccessHandler,
      onError: onError ?? typedApiDefaultErrorHandler
    }`;
  }

  return `{
      onSuccess,
      onError
    }`;
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

function getGeneratedMethods(source) {
  const methodRegex = /^\s*(\w+)\s*=\s*\(/gm;
  const matches = [...source.matchAll(methodRegex)];

  return matches.map((match, index) => {
    const methodName = match[1];
    const startIndex = match.index ?? 0;
    const endIndex =
      index + 1 < matches.length ? matches[index + 1].index : source.length;

    const methodSource = source.slice(startIndex, endIndex);

    return {
      methodName,
      methodSource,
      isFormData: methodSource.includes("type: ContentType.FormData"),
    };
  });
}

function splitTopLevelArguments(value) {
  const args = [];
  let current = "";
  let depth = 0;
  let quote = "";

  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    const previousChar = value[index - 1];

    if (quote) {
      current += char;

      if (char === quote && previousChar !== "\\") {
        quote = "";
      }

      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "(" || char === "{" || char === "[" || char === "<") {
      depth++;
      current += char;
      continue;
    }

    if (char === ")" || char === "}" || char === "]" || char === ">") {
      depth--;
      current += char;
      continue;
    }

    if (char === "," && depth === 0) {
      if (current.trim()) {
        args.push(current.trim());
      }

      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

function getGeneratedMethodArgumentCount(signatureParams) {
  const args = splitTopLevelArguments(signatureParams);

  if (args.length === 0) {
    return 0;
  }

  const lastArg = args[args.length - 1];

  if (/\bparams\s*:\s*RequestParams\b/.test(lastArg)) {
    return args.length - 1;
  }

  return args.length;
}

async function createMethodFiles() {
  const defaultHandlers = resolveDefaultHandlers(methodsDir);

  const generatedFiles = fs
    .readdirSync(generatedDir)
    .filter(
      (file) =>
        file.endsWith(".ts") &&
        file !== "http-client.ts" &&
        file !== "data-contracts.ts" &&
        !/route\.ts$/i.test(file) &&
        !file.includes(".api"),
    );

  const methodExports = [];

  for (const file of generatedFiles) {
    const filePath = path.join(generatedDir, file);
    const source = fs.readFileSync(filePath, "utf8");

    const baseName = file.replace(".ts", "");
    const className = baseName.split("-").map(pascalCase).join("");

    const instanceName = `${className.charAt(0).toLowerCase()}${className.slice(1)}Api`;

    const paginatedMethods = [];
    const simpleQueryMethods = [];
    const nonQueryMethods = [];

    const generatedMethods = getGeneratedMethods(source);

    for (const generatedMethod of generatedMethods) {
      const { methodName, methodSource, isFormData } = generatedMethod;

      const signatureRegex = new RegExp(
        `${methodName}\\s*=\\s*\\(([^)]*)\\)\\s*=>`,
        "m",
      );

      const signatureMatch = methodSource.match(signatureRegex);

      if (!signatureMatch) {
        continue;
      }

      const params = signatureMatch[1].trim();
      const methodArgumentCount = getGeneratedMethodArgumentCount(params);

      const returnTypeMatch = methodSource.match(/this\.request<([^,>]+)/m);
      const returnType = returnTypeMatch?.[1] ?? "";

      const isPaginated =
        returnType.includes("ApiPaginationResponse") ||
        returnType.trim().endsWith("[]");

      if (params.startsWith("query")) {
        if (isPaginated) {
          paginatedMethods.push(methodName);
        } else {
          simpleQueryMethods.push(methodName);
        }

        continue;
      }

      nonQueryMethods.push({
        methodName,
        isFormData,
        methodArgumentCount,
      });
    }

    const queryTypes = [...paginatedMethods, ...simpleQueryMethods]
      .map((methodName) =>
        `
export type ${toQueryName(methodName)} =
  NonNullable<
    Parameters<${className}["${methodName}"]>[0]
  >;
`.trim(),
      )
      .join("\n\n");

    const hasPaginatedMethods = paginatedMethods.length > 0;

    const hasFormDataMethods = nonQueryMethods.some(
      ({ isFormData }) => isFormData,
    );

    const hasRegularNonQueryMethods = nonQueryMethods.some(
      ({ isFormData }) => !isFormData,
    );

    const paginatedMethodWrappers = paginatedMethods
      .map((methodName) => {
        if (useFilterFormValues) {
          return `
export async function ${methodName}(
  filters: FilterFormValues<${toQueryName(methodName)}>[] = [],
  page = 1,
  pageSize = 100,
  sortBy: SortableKeys<
    ExtractResponse<ReturnType<${className}["${methodName}"]>>
  > | null = null,
  sortDirection?: SortDirection,
  options: ApiMethodOptions<
    ExtractResponse<ReturnType<${className}["${methodName}"]>>,
    ExtractError<ReturnType<${className}["${methodName}"]>>,
    RequestParams
  > = {}
): Promise<ApiResult<ExtractResponse<ReturnType<${className}["${methodName}"]>>>> {
  const { onSuccess, onError, params } = options;

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
        >(filters, page, pageSize, sortBy, sortDirection),
        params ?? {}
      ),
    ${callbackOptionsExpression(defaultHandlers)}
  );
}
`.trim();
        }

        return `
export async function ${methodName}(
  query?: ${toQueryName(methodName)},
  options: ApiMethodOptions<
    ExtractResponse<ReturnType<${className}["${methodName}"]>>,
    ExtractError<ReturnType<${className}["${methodName}"]>>,
    RequestParams
  > = {}
): Promise<ApiResult<ExtractResponse<ReturnType<${className}["${methodName}"]>>>> {
  const { onSuccess, onError, params } = options;

  return handleApiResponse(
    () =>
      ${instanceName}.${methodName}(
        (query ?? {}) as ${toQueryName(methodName)},
        params ?? {}
      ),
    ${callbackOptionsExpression(defaultHandlers)}
  );
}
`.trim();
      })
      .join("\n\n");

    const simpleQueryMethodWrappers = simpleQueryMethods
      .map((methodName) =>
        `
export async function ${methodName}(
  query?: ${toQueryName(methodName)},
  options: ApiMethodOptions<
    ExtractResponse<ReturnType<${className}["${methodName}"]>>,
    ExtractError<ReturnType<${className}["${methodName}"]>>,
    RequestParams
  > = {}
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        ${className}["${methodName}"]
      >
    >
  >
> {
  const { onSuccess, onError, params } = options;

  return handleApiResponse(
    () =>
      ${instanceName}.${methodName}(
        (query ?? {}) as ${toQueryName(methodName)},
        params ?? {}
      ),
    ${callbackOptionsExpression(defaultHandlers)}
  );
}
`.trim(),
      )
      .join("\n\n");

    const nonQueryMethodWrappers = nonQueryMethods
      .map(({ methodName, isFormData, methodArgumentCount }) => {
        if (isFormData) {
          return `
export async function ${methodName}(
  data: Parameters<
    ${className}["${methodName}"]
  >[0],
  options: ApiMethodOptions<
    ExtractResponse<ReturnType<${className}["${methodName}"]>>,
    ExtractError<ReturnType<${className}["${methodName}"]>>,
    RequestParams
  > = {}
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        ${className}["${methodName}"]
      >
    >
  >
> {
  const { onSuccess, onError, params } = options;
  const formData = toFormData(data);

  return handleApiResponse(
    () =>
      ${instanceName}.${methodName}(
        formData as unknown as Parameters<
          ${className}["${methodName}"]
        >[0],
        params ?? {}
      ),
    ${callbackOptionsExpression(defaultHandlers)}
  );
}
`.trim();
        }

        return `
export async function ${methodName}(
  ...argsWithOptions: [
    ...ApiMethodArguments<
      ${className}["${methodName}"],
      RequestParams
    >,
    ApiMethodOptions<
      ExtractResponse<ReturnType<${className}["${methodName}"]>>,
      ExtractError<ReturnType<${className}["${methodName}"]>>,
      RequestParams
    >?
  ]
): Promise<
  ApiResult<
    ExtractResponse<
      ReturnType<
        ${className}["${methodName}"]
      >
    >
  >
> {
  const args = [...argsWithOptions] as unknown[];

  const options =
    args.length > ${methodArgumentCount}
      ? (args.pop() as ApiMethodOptions<
            ExtractResponse<ReturnType<${className}["${methodName}"]>>,
            ExtractError<ReturnType<${className}["${methodName}"]>>,
            RequestParams
          >)
      : {};

  const { onSuccess, onError, params } = options ?? {};

  const requestArgs = [
    ...args,
    params ?? {}
  ] as unknown as Parameters<
    ${className}["${methodName}"]
  >;

  return handleApiResponse(
    () =>
      ${instanceName}.${methodName}(
        ...requestArgs
      ),
    ${callbackOptionsExpression(defaultHandlers)}
  );
}
`.trim();
      })
      .join("\n\n");

    const runtimeValueImportNames = [
      ...(hasPaginatedMethods && useFilterFormValues ? ["buildQuery"] : []),
      ...(hasFormDataMethods ? ["toFormData"] : []),
      "handleApiResponse",
    ];

    const runtimeTypeImportNames = [
      "ApiResult",
      "ApiMethodOptions",
      ...(hasRegularNonQueryMethods ? ["ApiMethodArguments"] : []),
      "ExtractResponse",
      "ExtractError",

      ...(hasPaginatedMethods && useFilterFormValues
        ? [
            "ExtractDataIfPaginated",
            "FilterFormValues",
            "SortableKeys",
            "SortDirection",
            "UnwrapArray",
          ]
        : []),
    ];

    const runtimeValueImports = createImportStatement({
      names: runtimeValueImportNames,
      from: runtimePackageName,
    });

    const defaultFunctionImports = defaultHandlers
      ? createAliasedImportStatement({
          imports: [
            {
              name: defaultHandlers.defaultSuccessHandlerName,
              alias: "typedApiDefaultSuccessHandler",
            },
            {
              name: defaultHandlers.defaultErrorHandlerName,
              alias: "typedApiDefaultErrorHandler",
            },
          ],
          from: defaultHandlers.defaultFunctionsPath,
        })
      : "";

    const runtimeTypeImports = createImportStatement({
      names: runtimeTypeImportNames,
      from: runtimePackageName,
      typeOnly: useTypeOnlyImports,
    });

    const generatedValueImports = createImportStatement({
      names: [className],
      from: `../generated/${baseName}`,
    });

    const generatedTypeImports =
      generatedMethods.length > 0
        ? createImportStatement({
            names: ["RequestParams"],
            from: "../generated/http-client",
            typeOnly: useTypeOnlyImports,
          })
        : "";

    const content = `
${runtimeValueImports}

${defaultFunctionImports}

${runtimeTypeImports}

${generatedValueImports}

${generatedTypeImports}

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
${methodExports.join("\n")}
`.trim();

  await writeFormattedFile(path.join(apiRoot, "index.ts"), apiIndexContent);
}

async function fixGeneratedMixedImports(apiDir) {
  const tsFiles = getAllTsFiles(apiDir);

  for (const filePath of tsFiles) {
    if (
      filePath.endsWith("http-client.ts") ||
      filePath.endsWith("data-contracts.ts")
    ) {
      continue;
    }

    const originalContent = fs.readFileSync(filePath, "utf8");
    let content = originalContent;

    content = content.replace(
      /import\s*\{([\s\S]*?)\}\s*from\s*["']\.\/http-client["'];/g,
      (_match, importsText) => {
        const importedNames = importsText
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean);

        const typeNames = importedNames.filter(
          (name) => name === "RequestParams",
        );

        const valueNames = importedNames.filter(
          (name) => name !== "RequestParams",
        );

        const statements = [];

        if (valueNames.length > 0) {
          statements.push(
            `import { ${valueNames.join(", ")} } from "./http-client";`,
          );
        }

        if (typeNames.length > 0 && useTypeOnlyImports) {
          statements.push(
            `import type { ${typeNames.join(", ")} } from "./http-client";`,
          );
        } else if (typeNames.length > 0) {
          statements.push(
            `import { ${typeNames.join(", ")} } from "./http-client";`,
          );
        }

        return statements.join("\n");
      },
    );

    if (useTypeOnlyImports) {
      content = content.replace(
        /import\s*\{([\s\S]*?)\}\s*from\s*["']\.\/data-contracts["'];/g,
        (_match, importsText) =>
          `import type {${importsText}} from "./data-contracts";`,
      );
    }

    if (content !== originalContent) {
      await writeFormattedFile(filePath, content);

      console.log(
        `Fixed mixed imports in ${path.relative(process.cwd(), filePath)}`,
      );
    }
  }
}

async function main() {
  const swaggerInput = await resolveSwaggerInput();

  console.log(`Generating API from: ${swaggerInput.label}`);
  console.log(`Output folder: ${apiRoot}`);

  await generateOpenApiClient(swaggerInput.input);

  await fixGeneratedMixedImports(generatedDir);

  await createMethodFiles();

  console.log("API generation completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
