import { getOperationTypes, generatedFileHeader } from "./schema.mjs";
import { pascalCase, typePropertyName } from "./names.mjs";

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function createImport(names, from, typeOnly = false) {
  const cleanNames = unique(names).sort((a, b) => a.localeCompare(b));
  if (cleanNames.length === 0) return "";
  const keyword = typeOnly ? "import type" : "import";
  if (cleanNames.length <= 3) return `${keyword} { ${cleanNames.join(", ")} } from ${JSON.stringify(from)};`;
  return `${keyword} {\n${cleanNames.map((name) => `  ${name},`).join("\n")}\n} from ${JSON.stringify(from)};`;
}

function isPrimitiveType(type) {
  return /^(void|any|unknown|string|number|boolean|Blob|File|Record<)/.test(type);
}

function extractTopLevelTypeNames(type) {
  const withoutLiterals = String(type ?? "").replace(/"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g, "");
  const matches = withoutLiterals.match(/\b[A-Z][A-Za-z0-9_]*\b/g) ?? [];
  return matches.filter(
    (name) => ![
      "Array", "Record", "Promise", "HttpResponse", "Blob", "File", "ApiResult",
      "RequestParams", "FormData", "ApiClientError", "ApiHttpError",
    ].includes(name),
  );
}

function localPropertyAccess(baseExpression, wireName) {
  return `${baseExpression}[${JSON.stringify(typePropertyName(wireName))}]`;
}

function parameterValueExpression(sourceExpression, parameter) {
  return localPropertyAccess(sourceExpression, parameter.name);
}

function parameterObjectExpression(sourceExpression, parameters) {
  const properties = parameters.map(
    (parameter) => `${JSON.stringify(parameter.name)}: ${parameterValueExpression(
      sourceExpression,
      parameter,
    )}`,
  );
  return properties.length <= 2
    ? `{ ${properties.join(", ")} }`
    : `{
${properties.map((property) => `          ${property},`).join("\n")}
        }`;
}

function pathExpression(routePath, pathParams, inputName = "input") {
  const parts = [];
  let cursor = 0;
  const regex = /\{([^}]+)\}/g;
  let match;

  while ((match = regex.exec(routePath))) {
    const [placeholder, paramName] = match;
    const before = routePath.slice(cursor, match.index);
    if (before) parts.push(JSON.stringify(before));
    const parameter = pathParams.find((item) => item.name === paramName);
    const valueExpression = parameter
      ? parameterValueExpression(inputName, parameter)
      : localPropertyAccess(inputName, paramName);
    parts.push(`encodeURIComponent(String(${valueExpression}))`);
    cursor = match.index + placeholder.length;
  }

  const after = routePath.slice(cursor);
  if (after) parts.push(JSON.stringify(after));
  if (parts.length === 0) return JSON.stringify(routePath);

  return parts
    .map((part) => /^"/.test(part) ? part.slice(1, -1).replace(/`/g, "\\`") : `\${${part}}`)
    .join("")
    .replace(/^/, "`")
    .replace(/$/, "`");
}

function requestFormat(responseContentType, responseType) {
  if (responseType === "void" || !responseContentType) return undefined;
  if (responseContentType.includes("json")) return "json";
  if (responseContentType.startsWith("text/")) return "text";
  if (responseContentType === "application/octet-stream" || responseType === "Blob") return "blob";
  return undefined;
}

function contentTypeEnum(contentType) {
  switch (contentType) {
    case "application/json": return "ContentType.Json";
    case "application/vnd.api+json": return "ContentType.JsonApi";
    case "multipart/form-data": return "ContentType.FormData";
    case "application/x-www-form-urlencoded": return "ContentType.UrlEncoded";
    case "text/plain": return "ContentType.Text";
    default: return contentType?.includes("json") ? "ContentType.Json" : undefined;
  }
}

function toWireExpression(valueExpression, schemaKey) {
  if (!schemaKey) return valueExpression;
  return `toWireValue(${valueExpression}, typedApiWireSchemas[${JSON.stringify(schemaKey)}], typedApiWireSchemas)`;
}

function requestItems(operationInfo, operationTypes, options = {}) {
  const inputName = options.inputName ?? "input";
  const items = [
    "...params",
    `path: ${pathExpression(
      operationInfo.routePath,
      operationTypes.parametersByLocation.path,
      inputName,
    )}`,
    `method: ${JSON.stringify(operationInfo.method)}`,
  ];

  if (options.queryValueName) {
    items.push(`query: ${options.queryValueName}`);
  } else if (operationTypes.hasQueryParams) {
    items.push(
      `query: ${parameterObjectExpression(
        inputName,
        operationTypes.parametersByLocation.query,
      )}`,
    );
  }

  if (operationTypes.bodyType) {
    const bodyExpression = options.bodyValueName ?? "data";
    items.push(`body: ${toWireExpression(bodyExpression, operationTypes.bodyWireSchemaKey)}`);
  }

  if (operationTypes.hasHeaderParams || operationTypes.hasCookieParams) {
    const headerSources = ["params.headers"];
    if (operationTypes.hasHeaderParams) {
      const headersExpression = parameterObjectExpression(
        inputName,
        operationTypes.parametersByLocation.header,
      );
      headerSources.push(`toRequestHeaders(${headersExpression})`);
    }
    if (operationTypes.hasCookieParams) {
      const cookiesExpression = parameterObjectExpression(
        inputName,
        operationTypes.parametersByLocation.cookie,
      );
      const cookieCondition = operationTypes.parametersByLocation.cookie
        .map((parameter) => `${parameterValueExpression(inputName, parameter)} !== undefined`)
        .join(" || ") || "false";
      headerSources.push(
        `${cookieCondition} ? { Cookie: toCookieHeader(${cookiesExpression}) } : undefined`,
      );
    }
    items.push(`headers: mergeHeaders(${headerSources.join(", ")})`);
  }

  const type = contentTypeEnum(operationTypes.contentType);
  if (type) items.push(`type: ${type}`);
  const format = requestFormat(operationTypes.responseContentType, operationTypes.responseType);
  if (format) items.push(`format: ${JSON.stringify(format)}`);
  return items;
}

function callbackOptions(operationTypes, defaultHandlers) {
  const items = [];
  if (defaultHandlers) {
    items.push("onSuccess: onSuccess ?? typedApiDefaultSuccessHandler");
    items.push("onError: onError ?? typedApiDefaultErrorHandler");
  } else {
    items.push("onSuccess");
    items.push("onError");
  }

  if (operationTypes.responseWireSchemaKey) {
    items.push(
      `transformResponse: (value) => fromWireValue(value, typedApiWireSchemas[${JSON.stringify(
        operationTypes.responseWireSchemaKey,
      )}], typedApiWireSchemas) as ${operationTypes.responseType}`,
    );
  }
  if (operationTypes.errorWireSchemaKey) {
    items.push(
      `transformError: (value) => fromWireValue(value, typedApiWireSchemas[${JSON.stringify(
        operationTypes.errorWireSchemaKey,
      )}], typedApiWireSchemas) as ${operationTypes.errorType}`,
    );
  } else if (operationTypes.usesHttpErrorFallback) {
    items.push(
      "transformError: (value, response) => createApiHttpError(response.status, value)",
    );
  }

  return items.length <= 2
    ? `{ ${items.join(", ")} }`
    : `{\n      ${items.join(",\n      ")},\n    }`;
}

function optionsType(operationTypes) {
  return `ApiMethodOptions<${operationTypes.responseType}, ${operationTypes.errorType}, RequestParams>`;
}

function promiseType(operationTypes) {
  return `Promise<ApiResult<${operationTypes.responseType}, ${operationTypes.errorType}>>`;
}

function isPaginated(operationTypes) {
  return Boolean(operationTypes.paginationMetadata) ||
    /(?:Api)?Pagination(?:Sort)?Response\b|Paged(?:Response|Result)?\b|Paginated(?:Response|Result)?\b/.test(
      operationTypes.responseType,
    );
}

function methodDescription(operationInfo, operationTypes) {
  const description = operationInfo.operation.description || operationInfo.operation.summary || "No description";
  const tags = (operationInfo.operation.tags ?? []).join(", ");
  return `/**\n * ${description.replace(/\n/g, "\n * ")}\n *\n * @tags ${tags}\n * @name ${operationTypes.methodNameSource}\n * @request ${operationInfo.method}:${operationInfo.routePath}\n */`;
}

function createRequestCall(operationInfo, operationTypes, options = {}) {
  const items = requestItems(operationInfo, operationTypes, options)
    .map((item) => `      ${item},`)
    .join("\n");
  return `request<${operationTypes.responseType}, ${operationTypes.errorType}>({\n${items}\n    })`;
}

function createPaginatedMethod(operationInfo, operationTypes, defaultHandlers) {
  const queryTypeName = operationTypes.parameterTypeNames.query;
  const requestCall = createRequestCall(operationInfo, operationTypes, { queryValueName: "builtQuery" });
  return `${methodDescription(operationInfo, operationTypes)}
export async function ${operationTypes.methodName}(
  filters: FilterFormValues<${queryTypeName}>[] = [],
  page = 1,
  pageSize = 100,
  sortBy: SortableKeys<${operationTypes.responseType}> | null = null,
  sortDirection?: SortDirection,
  options: ${optionsType(operationTypes)} = {},
): ${promiseType(operationTypes)} {
  const { onSuccess, onError, params = {} } = options;
  const builtQuery = buildQuery<
    ${queryTypeName},
    UnwrapArray<ExtractDataIfPaginated<${operationTypes.responseType}>>
  >(filters, page, pageSize, sortBy, sortDirection);

  return handleApiResponse<${operationTypes.responseType}, ${operationTypes.errorType}>(
    () => ${requestCall},
    ${callbackOptions(operationTypes, defaultHandlers)},
  );
}`;
}

function regularParameterArgumentName(operationTypes) {
  if (operationTypes.hasPathParams) return "pathParams";
  if (
    operationTypes.hasQueryParams &&
    !operationTypes.hasHeaderParams &&
    !operationTypes.hasCookieParams
  ) return "query";
  return "requestParams";
}

function createRegularMethod(operationInfo, operationTypes, defaultHandlers) {
  const args = [];
  const parameterArgumentName = operationTypes.paramsTypeName
    ? regularParameterArgumentName(operationTypes)
    : undefined;

  if (operationTypes.paramsTypeName) {
    const canOmitParams = operationTypes.allParametersOptional && !operationTypes.bodyType;
    args.push(
      `${parameterArgumentName}: ${operationTypes.paramsTypeName}${canOmitParams ? " = {}" : ""}`,
    );
  }

  if (operationTypes.bodyType) {
    args.push(`data: ${operationTypes.bodyType}`);
  }

  args.push(`options: ${optionsType(operationTypes)} = {}`);
  const requestCall = createRequestCall(operationInfo, operationTypes, {
    inputName: parameterArgumentName ?? "undefined",
    bodyValueName: operationTypes.bodyType ? "data" : undefined,
  });

  return `${methodDescription(operationInfo, operationTypes)}
export async function ${operationTypes.methodName}(
  ${args.join(",\n  ")}
): ${promiseType(operationTypes)} {
  const { onSuccess, onError, params = {} } = options;

  return handleApiResponse<${operationTypes.responseType}, ${operationTypes.errorType}>(
    () => ${requestCall},
    ${callbackOptions(operationTypes, defaultHandlers)},
  );
}`;
}

function createMethod(operationInfo, operationTypes, defaultHandlers, options) {
  if (
    operationTypes.hasQueryParams &&
    !operationTypes.hasPathParams &&
    !operationTypes.bodyType &&
    !operationTypes.hasHeaderParams &&
    !operationTypes.hasCookieParams &&
    options.useFilterFormValues !== false &&
    isPaginated(operationTypes)
  ) {
    return createPaginatedMethod(operationInfo, operationTypes, defaultHandlers);
  }
  return createRegularMethod(operationInfo, operationTypes, defaultHandlers);
}

export function methodFileNameForController(controllerName) {
  return `${controllerName}.api.ts`;
}

export function controllerNameForOperation(operationInfo, options = {}) {
  if (options.moduleNameFirstTag !== false) {
    const [tag] = operationInfo.operation.tags ?? [];
    if (tag) return pascalCase(tag, "Default");
  }
  const parts = operationInfo.routePath.split("/").filter(Boolean);
  return pascalCase(parts[1] ?? parts[0] ?? "Default", "Default");
}

export function generateMethodFile(openApi, controllerName, operations, options = {}) {
  const dataContractImports = [];
  const dataContractValueImports = [];
  const helperTypeImports = ["ApiResult", "ApiMethodOptions"];
  const helperValueImports = ["handleApiResponse"];
  const methods = [];
  let needsContentType = false;
  let needsPaginationTypes = false;
  let needsHeaderHelpers = false;
  let needsWireMappings = false;

  for (const operationInfo of operations) {
    const operationTypes = getOperationTypes(openApi, operationInfo, options);

    for (const typeName of Object.values(operationTypes.parameterTypeNames)) dataContractImports.push(typeName);
    if (operationTypes.paramsTypeName) dataContractImports.push(operationTypes.paramsTypeName);
    if (operationTypes.bodyType && !isPrimitiveType(operationTypes.bodyType)) {
      dataContractImports.push(...extractTopLevelTypeNames(operationTypes.bodyType));
    }
    if (!isPrimitiveType(operationTypes.responseType)) {
      dataContractImports.push(...extractTopLevelTypeNames(operationTypes.responseType));
    }
    if (!isPrimitiveType(operationTypes.errorType)) {
      dataContractImports.push(...extractTopLevelTypeNames(operationTypes.errorType));
    }
    if (operationTypes.usesHttpErrorFallback) {
      helperTypeImports.push("ApiHttpError");
      helperValueImports.push("createApiHttpError");
    }

    if (contentTypeEnum(operationTypes.contentType)) needsContentType = true;
    if (operationTypes.hasHeaderParams || operationTypes.hasCookieParams) needsHeaderHelpers = true;
    if (
      operationTypes.bodyWireSchemaKey ||
      operationTypes.responseWireSchemaKey ||
      operationTypes.errorWireSchemaKey
    ) {
      needsWireMappings = true;
    }
    if (
      operationTypes.hasQueryParams &&
      !operationTypes.hasPathParams && !operationTypes.bodyType &&
      !operationTypes.hasHeaderParams && !operationTypes.hasCookieParams &&
      options.useFilterFormValues !== false && isPaginated(operationTypes)
    ) {
      needsPaginationTypes = true;
    }

    methods.push(createMethod(operationInfo, operationTypes, options.defaultHandlers, options));
  }

  if (needsHeaderHelpers) helperValueImports.push("mergeHeaders", "toCookieHeader", "toRequestHeaders");
  if (needsWireMappings) {
    dataContractValueImports.push("typedApiWireSchemas");
    helperValueImports.push("fromWireValue", "toWireValue");
  }
  if (needsPaginationTypes) {
    helperValueImports.push("buildQuery");
    helperTypeImports.push(
      "ExtractDataIfPaginated", "FilterFormValues", "SortableKeys", "SortDirection", "UnwrapArray",
    );
  }

  const useTypeOnlyImports = options.useTypeOnlyImports !== false;
  const defaultHandlers = options.defaultHandlers;
  const imports = [
    generatedFileHeader(),
    createImport(["request", ...(needsContentType ? ["ContentType"] : [])], "../generated/http-client"),
    createImport(["RequestParams"], "../generated/http-client", useTypeOnlyImports),
    createImport(dataContractValueImports, "../generated/data-contracts"),
    createImport(dataContractImports, "../generated/data-contracts", useTypeOnlyImports),
    createImport(helperValueImports, options.runtimePackageName ?? "typedapi-client-helpers"),
    createImport(helperTypeImports, options.runtimePackageName ?? "typedapi-client-helpers", useTypeOnlyImports),
    defaultHandlers
      ? `import { ${defaultHandlers.success} as typedApiDefaultSuccessHandler, ${defaultHandlers.error} as typedApiDefaultErrorHandler } from ${JSON.stringify(defaultHandlers.path)};`
      : "",
  ].filter(Boolean);

  return `${imports.join("\n")}\n\n${methods.join("\n\n")}\n`;
}
