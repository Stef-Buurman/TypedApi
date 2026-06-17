import { getOperationTypes, generatedFileHeader } from "./schema.mjs";
import { pascalCase, propertyKey, sanitizeIdentifier } from "./names.mjs";

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function createImport(names, from, typeOnly = false) {
  const cleanNames = unique(names).sort((a, b) => a.localeCompare(b));
  if (cleanNames.length === 0) return "";
  const keyword = typeOnly ? "import type" : "import";
  return `${keyword} { ${cleanNames.join(", ")} } from ${JSON.stringify(from)};`;
}

function pathExpression(routePath, pathParams) {
  const parts = [];
  let cursor = 0;
  const regex = /\{([^}]+)\}/g;
  let match;

  while ((match = regex.exec(routePath))) {
    const [placeholder, paramName] = match;
    const before = routePath.slice(cursor, match.index);
    if (before) parts.push(JSON.stringify(before));
    parts.push(sanitizeIdentifier(paramName));
    cursor = match.index + placeholder.length;
  }

  const after = routePath.slice(cursor);
  if (after) parts.push(JSON.stringify(after));

  if (parts.length === 0) {
    return JSON.stringify(routePath);
  }

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

function destructuredParams(operationTypes) {
  const parameters = [
    ...operationTypes.pathParams,
    ...operationTypes.queryParams,
  ];
  return parameters.map((parameter) => sanitizeIdentifier(parameter.name));
}

function queryExpression(operationTypes) {
  if (!operationTypes.hasQueryParams) return undefined;

  if (!operationTypes.hasPathParams) {
    return "query";
  }

  const entries = operationTypes.queryParams.map((parameter) => {
    const identifier = sanitizeIdentifier(parameter.name);
    return `${JSON.stringify(parameter.name)}: ${identifier}`;
  });

  return `{ ${entries.join(", ")} }`;
}

function methodArguments(operationTypes) {
  const args = [];

  if (operationTypes.paramsTypeName) {
    if (operationTypes.hasPathParams) {
      args.push(
        `{ ${destructuredParams(operationTypes).join(", ")} }: ${operationTypes.paramsTypeName}`,
      );
    } else {
      args.push(`query: ${operationTypes.paramsTypeName} = {}`);
    }
  }

  if (operationTypes.bodyType) {
    args.push(`data: ${operationTypes.bodyType}`);
  }

  args.push("params: RequestParams = {}");
  return args.join(", ");
}

function createMethod(operationInfo, operationTypes) {
  const requestItems = [
    `path: ${pathExpression(operationInfo.routePath, operationTypes.pathParams)}`,
    `method: ${JSON.stringify(operationInfo.method)}`,
  ];

  const query = queryExpression(operationTypes);
  if (query) requestItems.push(`query: ${query}`);

  if (operationTypes.bodyType) {
    requestItems.push("body: data");
  }

  const type = contentTypeEnum(operationTypes.contentType);
  if (type) requestItems.push(`type: ${type}`);

  const format = requestFormat(
    operationTypes.responseContentType,
    operationTypes.responseType,
  );
  if (format) requestItems.push(`format: ${JSON.stringify(format)}`);

  requestItems.push("...params");

  const description =
    operationInfo.operation.description ||
    operationInfo.operation.summary ||
    "No description";
  const tags = (operationInfo.operation.tags ?? []).join(", ");
  const requestItemsText = requestItems
    .map((item) => `      ${item},`)
    .join("\n");

  return `
  /**
   * ${description.replace(/\n/g, "\n   * ")}
   *
   * @tags ${tags}
   * @name ${operationTypes.operationId}
   * @request ${operationInfo.method}:${operationInfo.routePath}
   */
  ${operationTypes.methodName} = (${methodArguments(operationTypes)}): Promise<HttpResponse<${operationTypes.responseType}, any>> =>
    this.request<${operationTypes.responseType}, any>({
${requestItemsText}
    });`.trimEnd();
}

export function generateController(
  openApi,
  controllerName,
  operations,
  options = {},
) {
  const dataContractImports = [];
  const methods = [];
  let needsContentType = false;

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
    if (contentTypeEnum(operationTypes.contentType)) needsContentType = true;

    methods.push(createMethod(operationInfo, operationTypes));
  }

  const useTypeOnlyImports = options.useTypeOnlyImports !== false;
  const imports = [
    generatedFileHeader(),
    createImport(
      [...(needsContentType ? ["ContentType"] : []), "HttpClient"],
      "../http-client",
    ),
    createImport(
      ["HttpResponse", "RequestParams"],
      "../http-client",
      useTypeOnlyImports,
    ),
    createImport(dataContractImports, "../data-contracts", useTypeOnlyImports),
  ].filter(Boolean);

  return `${imports.join("\n")}\n\nexport class ${controllerName}<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {\n${methods.map((method) => `${method}\n`).join("\n")}\n}\n`;
}

function isPrimitiveType(type) {
  return /^(void|any|unknown|string|number|boolean|Blob|File|Record<)/.test(
    type,
  );
}

function extractTopLevelTypeNames(type) {
  const withoutLiterals = type.replace(/"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/g, "");
  const matches = withoutLiterals.match(/\b[A-Z][A-Za-z0-9_]*\b/g) ?? [];
  return matches.filter(
    (name) =>
      !["Array", "Record", "Promise", "HttpResponse", "Blob", "File"].includes(
        name,
      ),
  );
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
