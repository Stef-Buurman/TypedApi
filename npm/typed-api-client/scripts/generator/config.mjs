import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const packageRoot = path.resolve(__dirname, '../..');
export const cwd = process.cwd();

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function getBoolean(...values) {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
  }
  return undefined;
}

function getArray(value, fallback) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.split(',').map((x) => x.trim()).filter(Boolean);
  return fallback;
}

export function readGeneratorConfig() {
  const runtimePackage = readJsonIfExists(path.join(packageRoot, 'package.json'));
  const consumerPackage = readJsonIfExists(path.join(cwd, 'package.json'));
  const merged = { ...(runtimePackage.config ?? {}), ...(consumerPackage.config ?? {}) };

  const swaggerFile = getString(process.env.SWAGGER_FILE, process.env.npm_config_swagger_file, merged.swaggerFile, merged.input);
  const swaggerUrl = getString(process.env.SWAGGER_URL, process.env.npm_config_swagger_url, merged.swaggerUrl, merged.url);
  const apiOutput = getString(process.env.API_OUTPUT, process.env.npm_config_api_output, merged.apiOutput, merged.output, 'src/api');
  const backupFile = getString(process.env.TYPED_API_SWAGGER_BACKUP_FILE, process.env.npm_config_typed_api_swagger_backup_file, merged.typedApiSwaggerBackupFile, 'swagger/swagger.backup.json');

  const config = {
    runtimePackage,
    consumerPackage,
    runtimePackageName: path.resolve(cwd) === packageRoot ? '../..' : runtimePackage.name,
    swaggerFile,
    swaggerUrl,
    defaultSwaggerUrl: getString(merged.defaultSwaggerUrl, 'https://localhost:7000/swagger/v1/swagger.json'),
    apiRoot: path.resolve(cwd, apiOutput),
    backupPath: path.resolve(packageRoot, backupFile),

    // TypedApi options
    useTypeOnlyImports: getBoolean(process.env.TYPED_API_USE_TYPE_ONLY_IMPORTS, process.env.npm_config_typed_api_use_type_only_imports, merged.typedApiUseTypeOnlyImports, false),
    useFilterFormValues: getBoolean(process.env.TYPED_API_USE_FILTER_FORM_VALUES, process.env.npm_config_typed_api_use_filter_form_values, merged.typedApiUseFilterFormValues, false),
    defaultFunctionsPath: getString(process.env.TYPED_API_DEFAULT_FUNCTIONS_PATH, process.env.npm_config_typed_api_default_functions_path, merged.typedApiDefaultFunctionsPath, 'defaultApiFunctions'),
    defaultSuccessHandler: getString(process.env.TYPED_API_DEFAULT_SUCCESS_HANDLER, process.env.npm_config_typed_api_default_success_handler, merged.typedApiDefaultSuccessHandler, 'handleGoodResult'),
    defaultErrorHandler: getString(process.env.TYPED_API_DEFAULT_ERROR_HANDLER, process.env.npm_config_typed_api_default_error_handler, merged.typedApiDefaultErrorHandler, 'handleErrors'),

    // swagger-typescript-api inspired switches. Unsupported options are ignored safely.
    modular: getBoolean(process.env.npm_config_modular, merged.modular, true),
    cleanOutput: getBoolean(process.env.npm_config_clean_output, merged.cleanOutput, true),
    generateClient: getBoolean(process.env.npm_config_generate_client, merged.generateClient, true),
    generateResponses: getBoolean(process.env.npm_config_generate_responses, merged.generateResponses, true),
    extractRequestParams: getBoolean(process.env.npm_config_extract_request_params, merged.extractRequestParams, true),
    extractRequestBody: getBoolean(process.env.npm_config_extract_request_body, merged.extractRequestBody, true),
    moduleNameFirstTag: getBoolean(process.env.npm_config_module_name_first_tag, merged.moduleNameFirstTag, true),
    enumNamesAsValues: getBoolean(process.env.npm_config_enum_names_as_values, merged.enumNamesAsValues, false),
    addReadonly: getBoolean(process.env.npm_config_add_readonly, merged.addReadonly, false),
    defaultResponseAsSuccess: getBoolean(process.env.npm_config_default_response_as_success, merged.defaultResponseAsSuccess, false),
    unwrapResponseData: getBoolean(process.env.npm_config_unwrap_response_data, merged.unwrapResponseData, false),
    sortTypes: getBoolean(process.env.npm_config_sort_types, merged.sortTypes, true),
    controllersFolder: getString(process.env.npm_config_controllers_folder, merged.controllersFolder, 'controllers'),
    httpClientFileName: getString(process.env.npm_config_http_client_file_name, merged.httpClientFileName, 'http-client.ts'),
    contractsFileName: getString(process.env.npm_config_contracts_file_name, merged.contractsFileName, 'data-contracts.ts'),
    generateBarrel: getBoolean(process.env.npm_config_generate_barrel, merged.generateBarrel, true),
    routeNameStyle: getString(process.env.npm_config_route_name_style, merged.routeNameStyle, 'operationId'),
    primitiveTypeConstructs: getArray(merged.primitiveTypeConstructs, ['string', 'number', 'boolean']),
  };

  return config;
}
