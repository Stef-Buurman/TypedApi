import { getOperationTypes, generatedFileHeader } from "./schema.mjs";
import { pascalCase, sanitizeIdentifier } from "./names.mjs";

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function createImport(names, from, typeOnly = false) {
  const cleanNames = unique(names).sort((a, b) => a.localeCompare(b));
  if (cleanNames.length === 0) return "";
  const keyword = typeOnly ? "import type" : "import";
  if (cleanNames.length <= 3) {
    return `${keyword} { ${cleanNames.join(", ")} } from ${JSON.stringify(from)};`;
  }
  return `${keyword} {\n${cleanNames.map((name) => `  ${name},`).join("\n")}\n} from ${JSON.stringify(from)};`;
}

function isPrimitiveType(type) {
  return /^(void|any|unknown|string|number|boolean|Blob|File|Record<)/.test(
    type,
  );
}

function extractTopLevelTypeNames(type) {
  const withoutLiterals = String(type ?? "").replace(
    /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g,
    "",
  );
  const matches = withoutLiterals.match(/\b[A-Z][A-Za-z0-9_]*\b/g) ?? [];
  return matches.filter(
    (name) =>
      ![
        "Array",
        "Record",
        "Promise",
        "HttpResponse",
        "Blob",
        "File",
        "ApiResult",
        "RequestParams",
        "FormData",
      ].includes(name),
  );
}

function pathExpression(
  routePath,
  pathParams,
  paramsObjectName = "pathParams",
) {
  const parts = [];
  let cursor = 0;
  const regex = /\{([^}]+)\}/g;
  let match;

  while ((match = regex.exec(routePath))) {
    const [placeholder, paramName] = match;
    const before = routePath.slice(cursor, match.index);
    if (before) parts.push(JSON.stringify(before));
    parts.push(
      `encodeURIComponent(String(${paramsObjectName}.${sanitizeIdentifier(paramName)}))`,
    );
    cursor = match.index + placeholder.length;
  }

  const after = routePath.slice(cursor);
  if (after) parts.push(JSON.stringify(after));

  if (parts.length === 0) return JSON.stringify(routePath);

  return parts
    .map((part) =>
      /^"/.test(part) ? part.slice(1, -1).replace(/`/g, "\\`") : `\${${part}}`,
    )
    .join("")
    .replace(/^/, "`")
    .replace(/$/, "`");
}

function requestFormat(responseContentType, responseType) {
  if (responseType === "void") return undefined;
  if (!responseContentType) return undefined;
  if (responseContentType.includes("json")) return "json";
  if (responseContentType.startsWith("text/")) return "text";
  if (
    responseContentType === "application/octet-stream" ||
    responseType === "Blob"
  )
    return "blob";
  return undefined;
}

function contentTypeEnum(contentType) {
  switch (contentType) {
    case "application/json":
      return "ContentType.Json";
    case "application/vnd.api+json":
      return "ContentType.JsonApi";
    case "multipart/form-data":
      return "ContentType.FormData";
    case "application/x-www-form-urlencoded":
      return "ContentType.UrlEncoded";
    case "text/plain":
      return "ContentType.Text";
    default:
      return contentType?.includes("json") ? "ContentType.Json" : undefined;
  }
}

function queryExpression(operationTypes, queryValueName = "query") {
  if (!operationTypes.hasQueryParams) return undefined;

  if (!operationTypes.hasPathParams) {
    return `${queryValueName} ?? {}`;
  }

  const entries = operationTypes.queryParams.map((parameter) => {
    const identifier = sanitizeIdentifier(parameter.name);
    return `${JSON.stringify(parameter.name)}: pathParams.${identifier}`;
  });

  return `{ ${entries.join(", ")} }`;
}

function requestItems(operationInfo, operationTypes, options = {}) {
  const items = [
    `path: ${pathExpression(operationInfo.routePath, operationTypes.pathParams)}`,
    `method: ${JSON.stringify(operationInfo.method)}`,
  ];

  const query = queryExpression(
    operationTypes,
    options.queryValueName ?? "query",
  );
  if (query) items.push(`query: ${query}`);

  if (operationTypes.bodyType) {
    items.push(`body: ${options.bodyExpression ?? "data"}`);
  }

  const type = contentTypeEnum(operationTypes.contentType);
  if (type) items.push(`type: ${type}`);

  const format = requestFormat(
    operationTypes.responseContentType,
    operationTypes.responseType,
  );
  if (format) items.push(`format: ${JSON.stringify(format)}`);

  items.push("...params");
  return items;
}

function callbackOptions(defaultHandlers) {
  if (!defaultHandlers) return "{ onSuccess, onError }";

  return "{ onSuccess: onSuccess ?? typedApiDefaultSuccessHandler, onError: onError ?? typedApiDefaultErrorHandler }";
}

function optionsType(operationTypes) {
  return `ApiMethodOptions<${operationTypes.responseType}, any, RequestParams>`;
}

function promiseType(operationTypes) {
  return `Promise<ApiResult<${operationTypes.responseType}>>`;
}

function isPaginated(operationTypes) {
  return /(?:Api)?PaginationResponse\b|Paged(?:Response|Result)?\b|Paginated(?:Response|Result)?\b/.test(
    operationTypes.responseType,
  );
}

function methodDescription(operationInfo, operationTypes) {
  const description =
    operationInfo.operation.description ||
    operationInfo.operation.summary ||
    "No description";
  const tags = (operationInfo.operation.tags ?? []).join(", ");

  return `/**\n * ${description.replace(/\n/g, "\n * ")}\n *\n * @tags ${tags}\n * @name ${operationTypes.operationId}\n * @request ${operationInfo.method}:${operationInfo.routePath}\n */`;
}

function createRequestCall(operationInfo, operationTypes, options = {}) {
  const items = requestItems(operationInfo, operationTypes, options)
    .map((item) => `      ${item},`)
    .join("\n");

  return `request<${operationTypes.responseType}, any>({\n${items}\n    })`;
}

function createPaginatedMethod(operationInfo, operationTypes, defaultHandlers) {
  const queryTypeName = `${pascalCase(operationTypes.methodName)}Query`;
  const requestCall = createRequestCall(operationInfo, operationTypes, {
    queryValueName: "builtQuery",
  });

  return `${methodDescription(operationInfo, operationTypes)}
export async function ${operationTypes.methodName}(
  filters: FilterFormValues<${queryTypeName}>[] = [],
  page = 1,
  pageSize = 100,
  sortBy: SortableKeys<${operationTypes.responseType}> | null = null,
  sortDirection?: SortDirection,
  options: ${optionsType(operationTypes)} = {},
): ${promiseType(operationTypes)} {
  const { onSuccess, onError, params } = options;
  const builtQuery = buildQuery<
    ${queryTypeName},
    UnwrapArray<ExtractDataIfPaginated<${operationTypes.responseType}>>
  >(filters, page, pageSize, sortBy, sortDirection);

  return handleApiResponse<${operationTypes.responseType}, any>(
    () => ${requestCall},
    ${callbackOptions(defaultHandlers)},
  );
}`;
}

function createSimpleQueryMethod(
  operationInfo,
  operationTypes,
  defaultHandlers,
) {
  const queryTypeName = `${pascalCase(operationTypes.methodName)}Query`;
  const requestCall = createRequestCall(operationInfo, operationTypes, {
    queryValueName: "query",
  });

  return `${methodDescription(operationInfo, operationTypes)}
export async function ${operationTypes.methodName}(
  query?: ${queryTypeName},
  options: ${optionsType(operationTypes)} = {},
): ${promiseType(operationTypes)} {
  const { onSuccess, onError, params } = options;

  return handleApiResponse<${operationTypes.responseType}, any>(
    () => ${requestCall},
    ${callbackOptions(defaultHandlers)},
  );
}`;
}

function wrapperArguments(operationTypes) {
  const args = [];

  if (operationTypes.paramsTypeName && operationTypes.hasPathParams) {
    args.push(`pathParams: ${operationTypes.paramsTypeName}`);
  }

  if (operationTypes.bodyType) {
    args.push(`data: ${operationTypes.bodyType}`);
  }

  args.push(`options: ${optionsType(operationTypes)} = {}`);
  return args.join(",\n  ");
}

function createRegularMethod(operationInfo, operationTypes, defaultHandlers) {
  const isFormData = operationTypes.contentType === "multipart/form-data";
  const requestCall = createRequestCall(operationInfo, operationTypes, {
    bodyExpression: isFormData ? "formData" : "data",
  });

  const formDataLine = isFormData
    ? "\n  const formData = toFormData(data);\n"
    : "";

  return `${methodDescription(operationInfo, operationTypes)}
export async function ${operationTypes.methodName}(
  ${wrapperArguments(operationTypes)}
): ${promiseType(operationTypes)} {
  const { onSuccess, onError, params } = options;${formDataLine}
  return handleApiResponse<${operationTypes.responseType}, any>(
    () => ${requestCall},
    ${callbackOptions(defaultHandlers)},
  );
}`;
}

function createMethod(operationInfo, operationTypes, defaultHandlers, options) {
  if (
    operationTypes.hasQueryParams &&
    !operationTypes.hasPathParams &&
    options.useFilterFormValues !== false &&
    isPaginated(operationTypes)
  ) {
    return createPaginatedMethod(
      operationInfo,
      operationTypes,
      defaultHandlers,
    );
  }

  if (
    operationTypes.hasQueryParams &&
    !operationTypes.hasPathParams &&
    !operationTypes.bodyType
  ) {
    return createSimpleQueryMethod(
      operationInfo,
      operationTypes,
      defaultHandlers,
    );
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

  const firstPathPart =
    operationInfo.routePath.split("/").filter(Boolean)[1] ??
    operationInfo.routePath.split("/").filter(Boolean)[0] ??
    "Default";

  return pascalCase(firstPathPart, "Default");
}

export function generateMethodFile(
  openApi,
  controllerName,
  operations,
  options = {},
) {
  const dataContractImports = [];
  const helperTypeImports = ["ApiResult", "ApiMethodOptions"];
  const helperValueImports = ["handleApiResponse"];
  const methods = [];
  const queryAliases = [];
  let needsContentType = false;
  let needsToFormData = false;
  let needsPaginationTypes = false;

  for (const operationInfo of operations) {
    const operationTypes = getOperationTypes(openApi, operationInfo, options);
    if (!operationTypes.operationId || !operationTypes.methodName) continue;

    if (operationTypes.paramsTypeName)
      dataContractImports.push(operationTypes.paramsTypeName);
    if (
      operationTypes.bodyType &&
      operationTypes.bodyType !== "Blob" &&
      operationTypes.bodyType !== "File"
    ) {
      dataContractImports.push(operationTypes.bodyType);
    }
    if (!isPrimitiveType(operationTypes.responseType)) {
      dataContractImports.push(
        ...extractTopLevelTypeNames(operationTypes.responseType),
      );
    }

    if (operationTypes.hasQueryParams && !operationTypes.hasPathParams) {
      const queryTypeName = `${pascalCase(operationTypes.methodName)}Query`;
      queryAliases.push(
        `export type ${queryTypeName} = NonNullable<${operationTypes.paramsTypeName}>;`,
      );
    }

    if (contentTypeEnum(operationTypes.contentType)) needsContentType = true;
    if (operationTypes.contentType === "multipart/form-data")
      needsToFormData = true;
    if (
      operationTypes.hasQueryParams &&
      !operationTypes.hasPathParams &&
      options.useFilterFormValues !== false &&
      isPaginated(operationTypes)
    ) {
      needsPaginationTypes = true;
    }

    methods.push(
      createMethod(
        operationInfo,
        operationTypes,
        options.defaultHandlers,
        options,
      ),
    );
  }

  if (needsToFormData) helperValueImports.push("toFormData");
  if (needsPaginationTypes) {
    helperValueImports.push("buildQuery");
    helperTypeImports.push(
      "ExtractDataIfPaginated",
      "FilterFormValues",
      "SortableKeys",
      "SortDirection",
      "UnwrapArray",
    );
  }

  const defaultHandlers = options.defaultHandlers;
  const useTypeOnlyImports = options.useTypeOnlyImports !== false;
  const imports = [
    generatedFileHeader(),
    createImport(
      ["request", ...(needsContentType ? ["ContentType"] : [])],
      "../generated/http-client",
    ),
    createImport(
      ["RequestParams"],
      "../generated/http-client",
      useTypeOnlyImports,
    ),
    createImport(
      dataContractImports,
      "../generated/data-contracts",
      useTypeOnlyImports,
    ),
    createImport(
      helperValueImports,
      options.runtimePackageName ?? "typedapi-client-helpers",
    ),
    createImport(
      helperTypeImports,
      options.runtimePackageName ?? "typedapi-client-helpers",
      useTypeOnlyImports,
    ),
    defaultHandlers
      ? `import { ${defaultHandlers.success} as typedApiDefaultSuccessHandler, ${defaultHandlers.error} as typedApiDefaultErrorHandler } from ${JSON.stringify(defaultHandlers.path)};`
      : "",
  ].filter(Boolean);

  const aliases = unique(queryAliases).join("\n");
  const aliasBlock = aliases ? `${aliases}\n\n` : "";

  return `${imports.join("\n")}\n\n${aliasBlock}${methods.join("\n\n")}\n`;
}
