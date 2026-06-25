#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateApi } from "./openapi-generator/index.mjs";

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

const cwd = process.cwd();
const cliArguments = new Set(process.argv.slice(2));

if (cliArguments.has("--help") || cliArguments.has("-h")) {
  console.log(`typedapi-generate [options]

Options:
  --check       Fail when generated files differ
  --strict      Do not fall back to a stale Swagger backup
  --offline     Generate only from the configured Swagger backup
  --verbose     Print additional diagnostics
  --help        Show this help`);
  process.exit(0);
}

const checkMode = cliArguments.has("--check");
const strictMode = cliArguments.has("--strict");
const offlineMode = cliArguments.has("--offline");
const verboseMode = cliArguments.has("--verbose");

const config = {
  ...(runtimePackageJson.config ?? {}),
  ...(consumerPackageJson.config ?? {}),
};

const runtimePackageName =
  path.resolve(cwd) === packageRoot ? "../.." : runtimePackageJson.name;

const swaggerFile = getStringSetting(
  process.env.SWAGGER_FILE,
  process.env.npm_config_swagger_file,
  config.swaggerFile,
  config.input,
);

const swaggerUrl = getStringSetting(
  process.env.SWAGGER_URL,
  process.env.npm_config_swagger_url,
  config.swaggerUrl,
  config.url,
);

const defaultSwaggerUrl = getStringSetting(
  config.defaultSwaggerUrl,
  "https://localhost:7000/swagger/v1/swagger.json",
);

const swaggerBackupPath = path.resolve(
  cwd,
  getStringSetting(
    process.env.TYPED_API_SWAGGER_BACKUP_FILE,
    process.env.npm_config_typed_api_swagger_backup_file,
    config.typedApiSwaggerBackupFile,
    "swagger/swagger.backup.json",
  ),
);

const swaggerDownloadTimeoutMs = getNumberSetting(
  process.env.TYPED_API_DOWNLOAD_TIMEOUT_MS,
  process.env.npm_config_typed_api_download_timeout_ms,
  config.typedApiDownloadTimeoutMs,
  15000,
);

const apiRoot = path.resolve(
  cwd,
  getStringSetting(
    process.env.API_OUTPUT,
    process.env.npm_config_api_output,
    config.apiOutput,
    config.output,
    "src/api",
  ),
);

const methodsDir = path.join(apiRoot, "methods");

const defaultFunctionsPathSetting = getStringSetting(
  process.env.TYPED_API_DEFAULT_FUNCTIONS_PATH,
  process.env.npm_config_typed_api_default_functions_path,
  config.typedApiDefaultFunctionsPath,
  "src/defaultApiFunctions",
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

const generatorOptions = {
  cleanOutput: getBooleanSetting(
    process.env.TYPED_API_CLEAN_OUTPUT,
    process.env.npm_config_typed_api_clean_output,
    process.env.npm_config_clean_output,
    config.typedApiCleanOutput,
    config.cleanOutput,
    true,
  ),
  moduleNameFirstTag: getBooleanSetting(
    process.env.TYPED_API_MODULE_NAME_FIRST_TAG,
    process.env.npm_config_typed_api_module_name_first_tag,
    process.env.npm_config_module_name_first_tag,
    config.typedApiModuleNameFirstTag,
    config.moduleNameFirstTag,
    true,
  ),
  defaultResponseAsSuccess: getBooleanSetting(
    process.env.TYPED_API_DEFAULT_RESPONSE_AS_SUCCESS,
    process.env.npm_config_typed_api_default_response_as_success,
    process.env.npm_config_default_response_as_success,
    config.typedApiDefaultResponseAsSuccess,
    config.defaultResponseAsSuccess,
    false,
  ),
  generateUnionEnums: getBooleanSetting(
    process.env.TYPED_API_GENERATE_UNION_ENUMS,
    process.env.npm_config_typed_api_generate_union_enums,
    process.env.npm_config_generate_union_enums,
    config.typedApiGenerateUnionEnums,
    config.generateUnionEnums,
    false,
  ),
  enumNamesAsValues: getBooleanSetting(
    process.env.TYPED_API_ENUM_NAMES_AS_VALUES,
    process.env.npm_config_typed_api_enum_names_as_values,
    process.env.npm_config_enum_names_as_values,
    config.typedApiEnumNamesAsValues,
    config.enumNamesAsValues,
    false,
  ),
  useTypeOnlyImports: getBooleanSetting(
    process.env.TYPED_API_USE_TYPE_ONLY_IMPORTS,
    process.env.npm_config_typed_api_use_type_only_imports,
    process.env.npm_config_use_type_only_imports,
    config.typedApiUseTypeOnlyImports,
    config.useTypeOnlyImports,
    true,
  ),
  useFilterFormValues: getBooleanSetting(
    process.env.TYPED_API_USE_FILTER_FORM_VALUES,
    process.env.npm_config_typed_api_use_filter_form_values,
    config.typedApiUseFilterFormValues,
    true,
  ),
  generateMissingOperationIds: getBooleanSetting(
    process.env.TYPED_API_GENERATE_MISSING_OPERATION_IDS,
    process.env.npm_config_typed_api_generate_missing_operation_ids,
    config.typedApiGenerateMissingOperationIds,
    false,
  ),
  methodNameStyle: getMethodNameStyle(
    process.env.TYPED_API_METHOD_NAME_STYLE,
    process.env.npm_config_typed_api_method_name_style,
    config.typedApiMethodNameStyle,
    "operationId",
  ),
  check: checkMode,
  baseUrl: getStringSetting(
    process.env.TYPED_API_BASE_URL,
    process.env.npm_config_typed_api_base_url,
    config.typedApiBaseUrl,
  ),
  runtimePackageName,
};

function getStringSetting(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return undefined;
}

function getMethodNameStyle(...values) {
  const value = getStringSetting(...values) ?? "operationId";
  const normalized = value.replace(/[\s_-]/g, "").toLowerCase();

  if (["operationid", "operation"].includes(normalized)) return "operationId";
  if (["action", "actionname", "controllermethod"].includes(normalized)) return "action";

  throw new Error(
    `Invalid typedApiMethodNameStyle ${JSON.stringify(value)}. Use "operationId" or "action".`,
  );
}

function getBooleanSetting(...values) {
  const fallback = values[values.length - 1];

  for (const value of values.slice(0, -1)) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string" && value.trim() !== "") {
      const normalized = value.trim().toLowerCase();
      if (["1", "true", "yes", "on"].includes(normalized)) return true;
      if (["0", "false", "no", "off"].includes(normalized)) return false;
    }
  }

  return Boolean(fallback);
}

function getNumberSetting(...values) {
  for (const value of values) {
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return undefined;
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function displayPath(filePath) {
  return path.relative(cwd, filePath) || ".";
}

function writeSwaggerBackup(content, sourceLabel) {
  fs.mkdirSync(path.dirname(swaggerBackupPath), { recursive: true });
  const temporaryPath = `${swaggerBackupPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporaryPath, content);
  fs.renameSync(temporaryPath, swaggerBackupPath);

  console.log(
    `Updated Swagger backup from ${sourceLabel}: ${displayPath(swaggerBackupPath)}`,
  );
}

function copySwaggerBackupFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  JSON.parse(content);
  writeSwaggerBackup(content, path.relative(cwd, filePath));
}

async function downloadSwaggerBackupFromUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error(`Swagger download timed out after ${swaggerDownloadTimeoutMs}ms.`)),
    swaggerDownloadTimeoutMs,
  );
  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(
      `Swagger URL returned ${response.status} ${response.statusText}: ${url}`,
    );
  }

  const content = await response.text();
  JSON.parse(content);
  writeSwaggerBackup(content, url);
}

function useBackupSwaggerInput(reason) {
  if (!fileExists(swaggerBackupPath)) {
    return undefined;
  }

  console.warn(
    `${reason} Using Swagger backup: ${displayPath(swaggerBackupPath)}`,
  );

  return {
    input: swaggerBackupPath,
    label: swaggerBackupPath,
  };
}

async function resolveSwaggerInput() {
  if (offlineMode) {
    if (!fileExists(swaggerBackupPath)) {
      throw new Error(`Offline mode requires an existing Swagger backup: ${swaggerBackupPath}`);
    }
    return { input: swaggerBackupPath, label: swaggerBackupPath };
  }

  if (swaggerFile) {
    const swaggerFilePath = path.resolve(cwd, swaggerFile);

    if (fileExists(swaggerFilePath)) {
      copySwaggerBackupFromFile(swaggerFilePath);

      return {
        input: swaggerFilePath,
        label: swaggerFilePath,
      };
    }

    const backupInput = strictMode
      ? undefined
      : useBackupSwaggerInput(`Swagger file was not found: ${swaggerFilePath}.`);

    if (backupInput) return backupInput;

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
      const backupInput = strictMode
        ? undefined
        : useBackupSwaggerInput(`Swagger URL is not available: ${swaggerUrl}.`);

      if (backupInput) return backupInput;

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
  } catch {
    const backupInput = strictMode
      ? undefined
      : useBackupSwaggerInput(
          "Default Swagger file was not found and default Swagger URL is not available.",
        );

    if (backupInput) return backupInput;

    throw new Error(
      `No Swagger input found. Add swagger/swagger.json, configure swaggerFile, or configure swaggerUrl.`,
    );
  }
}

function createImportStatement({ names, from, typeOnly = false }) {
  const cleanNames = [...new Set(names.filter(Boolean))];
  if (cleanNames.length === 0) return "";
  const importKeyword = typeOnly ? "import type" : "import";
  return `${importKeyword} { ${cleanNames.join(", ")} } from ${JSON.stringify(from)};`;
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
    `${createImportStatement({
      names: ["ApiErrorResult", "ApiSuccessResult"],
      from: runtimePackageName,
      typeOnly: generatorOptions.useTypeOnlyImports !== false,
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

  return relativePath
    .replaceAll(path.sep, "/")
    .replace(/\.(ts|tsx|js|jsx)$/, "");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function resolveDefaultHandlers() {
  const candidatePath = path.extname(defaultFunctionsFilePath)
    ? defaultFunctionsFilePath
    : `${defaultFunctionsFilePath}.ts`;
  if (checkMode && !fs.existsSync(candidatePath)) {
    if (verboseMode) console.log("Skipping missing default handler file in check mode.");
    return undefined;
  }
  const defaultFunctionsFile = createDefaultFunctionsFileIfMissing(defaultFunctionsFilePath);
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
    path: toRelativeImportPath(methodsDir, defaultFunctionsFile),
    success: defaultSuccessHandlerName,
    error: defaultErrorHandlerName,
  };
}

async function main() {
  const swaggerInput = await resolveSwaggerInput();

  console.log(`Generating API from: ${swaggerInput.label}`);
  console.log(`Output folder: ${apiRoot}`);
  console.log(
    "Generator: local typedapi OpenAPI generator, function-only methods",
  );

  const result = await generateApi({
    input: swaggerInput.input,
    output: apiRoot,
    ...generatorOptions,
    generatorVersion: runtimePackageJson.version,
    defaultHandlers: resolveDefaultHandlers(),
  });

  for (const file of result.files) {
    console.log(`Generated ${path.relative(cwd, file)}`);
  }

  if (verboseMode && result.writeStrategy === "managed-file-sync") {
    console.log(
      "Used Windows-safe managed-file synchronization because the output directory could not be replaced atomically.",
    );
  }

  console.log(checkMode ? "Generated API is up to date." : "API generation completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
