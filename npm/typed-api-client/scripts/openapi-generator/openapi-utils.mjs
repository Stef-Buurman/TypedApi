import { operationMethodName, operationTypeName } from "./names.mjs";

export const httpMethods = new Set([
  "get", "put", "post", "delete", "options", "head", "patch", "trace",
]);

export function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function dereference(openApi, value, kind = "OpenAPI reference") {
  if (!value || !value.$ref) return value;

  const ref = String(value.$ref);
  if (!ref.startsWith("#/")) {
    throw new Error(`${kind} uses an unsupported external reference: ${ref}`);
  }

  const path = ref.replace(/^#\//, "").split("/");
  let current = openApi;

  for (const rawPart of path) {
    const part = rawPart.replace(/~1/g, "/").replace(/~0/g, "~");
    current = current?.[part];
  }

  if (current === undefined) {
    throw new Error(`${kind} could not be resolved: ${ref}`);
  }

  return current;
}

export function getParameterSchema(openApi, parameter) {
  if (parameter?.schema) return dereference(openApi, parameter.schema, "Parameter schema reference");

  const content = parameter?.content ?? {};
  const mediaTypes = Object.entries(content);
  if (mediaTypes.length === 0) return {};
  if (mediaTypes.length > 1) {
    throw new Error(
      `Parameter ${JSON.stringify(parameter?.name ?? "unknown")} contains multiple media types, which is not supported.`,
    );
  }
  return dereference(openApi, mediaTypes[0][1]?.schema ?? {}, "Parameter content schema reference");
}

export function getRequestBodyContent(openApi, requestBodyOrRef) {
  const requestBody = dereference(openApi, requestBodyOrRef, "Request body reference");
  const content = requestBody?.content ?? {};
  const preferredTypes = [
    "application/json",
    "application/vnd.api+json",
    "multipart/form-data",
    "application/x-www-form-urlencoded",
    "text/plain",
    "application/octet-stream",
  ];

  for (const contentType of preferredTypes) {
    if (content[contentType]) return { contentType, mediaType: content[contentType], requestBody };
  }

  const [contentType, mediaType] = Object.entries(content)[0] ?? [];
  return contentType ? { contentType, mediaType, requestBody } : undefined;
}

export function getSuccessResponse(openApi, operation, defaultResponseAsSuccess = false) {
  const responses = operation.responses ?? {};
  const preferredStatusCodes = [
    "200", "201", "202", "203", "204", "205", "206", "207", "208", "226",
  ];

  for (const statusCode of preferredStatusCodes) {
    if (responses[statusCode]) {
      return {
        statusCode,
        response: dereference(openApi, responses[statusCode], "Response reference"),
      };
    }
  }

  const successEntry = Object.entries(responses).find(([statusCode]) =>
    /^2(?:\d\d|XX)$/i.test(statusCode),
  );
  if (successEntry) {
    return {
      statusCode: successEntry[0],
      response: dereference(openApi, successEntry[1], "Response reference"),
    };
  }

  if (defaultResponseAsSuccess && responses.default) {
    return {
      statusCode: "default",
      response: dereference(openApi, responses.default, "Response reference"),
    };
  }

  return undefined;
}

export function getErrorResponses(openApi, operation) {
  return Object.entries(operation.responses ?? {})
    .filter(([statusCode]) => statusCode === "default" || !/^2(?:\d\d|XX)$/i.test(statusCode))
    .map(([statusCode, response]) => ({
      statusCode,
      response: dereference(openApi, response, "Response reference"),
    }));
}

export function getResponseContent(response) {
  const content = response?.content ?? {};
  const preferredTypes = [
    "application/problem+json",
    "application/json",
    "text/json",
    "application/octet-stream",
    "text/plain",
  ];

  for (const contentType of preferredTypes) {
    if (content[contentType]) return { contentType, mediaType: content[contentType] };
  }

  const [contentType, mediaType] = Object.entries(content)[0] ?? [];
  return contentType ? { contentType, mediaType } : undefined;
}

function fallbackOperationId(routePath, method, operation) {
  const tag = operation.tags?.[0];
  const route = routePath.replace(/[{}]/g, " ");
  return `${tag ?? "Endpoint"} ${method} ${route}`;
}

function getTypedApiOperationMetadata(operation) {
  const metadata = operation?.["x-typedapi-operation"];
  return isObject(metadata) ? metadata : {};
}

function resolveMethodNameSource(operation, rawOperationId, options, method, routePath) {
  const style = options.methodNameStyle ?? "operationId";
  if (style === "operationId") return rawOperationId;

  if (style === "action") {
    const actionName = String(getTypedApiOperationMetadata(operation).actionName ?? "").trim();
    if (!actionName) {
      throw new Error(
        `Cannot use typedApiMethodNameStyle "action" for ${method.toUpperCase()} ${routePath}: ` +
          "the operation does not contain x-typedapi-operation.actionName metadata. " +
          'Update TypedApi.Swagger to the matching 0.3.0 package or use typedApiMethodNameStyle "operationId".', 
      );
    }
    return actionName;
  }

  throw new Error(
    `Unsupported method name style ${JSON.stringify(style)}. Use "operationId" or "action".`,
  );
}

export function collectOperations(openApi, options = {}) {
  const operations = [];
  const rawIds = new Map();
  const typeNames = new Map();
  const methodNames = new Map();

  for (const [routePath, pathItemOrRef] of Object.entries(openApi.paths ?? {})) {
    const pathItem = dereference(openApi, pathItemOrRef, "Path item reference");
    const pathParameters = Array.isArray(pathItem.parameters)
      ? pathItem.parameters.map((item) => dereference(openApi, item, "Parameter reference"))
      : [];

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method)) continue;

      const rawOperationId = String(
        operation.operationId ??
          (options.generateMissingOperationIds
            ? fallbackOperationId(routePath, method, operation)
            : ""),
      ).trim();

      if (!rawOperationId) {
        throw new Error(
          `Missing operationId for ${method.toUpperCase()} ${routePath}. ` +
            "Add a unique operationId or enable generateMissingOperationIds.",
        );
      }

      if (rawIds.has(rawOperationId)) {
        throw new Error(
          `Duplicate operationId ${JSON.stringify(rawOperationId)} for ` +
            `${method.toUpperCase()} ${routePath} and ${rawIds.get(rawOperationId)}.`,
        );
      }
      rawIds.set(rawOperationId, `${method.toUpperCase()} ${routePath}`);

      const operationId = operationTypeName(rawOperationId);
      const methodNameSource = resolveMethodNameSource(
        operation,
        rawOperationId,
        options,
        method,
        routePath,
      );
      const methodName = operationMethodName(methodNameSource);
      const typeName = operationTypeName(methodNameSource);

      if (typeNames.has(operationId)) {
        throw new Error(
          `Operation IDs ${JSON.stringify(rawOperationId)} and ${JSON.stringify(typeNames.get(operationId))} ` +
            `both normalize to TypeScript type name ${operationId}.`,
        );
      }
      if (methodNames.has(methodName)) {
        const previous = methodNames.get(methodName);
        throw new Error(
          `Generated TypeScript method name ${JSON.stringify(methodName)} is duplicated by ` +
            `${JSON.stringify(previous.operationId)} and ${JSON.stringify(rawOperationId)} ` +
            `while typedApiMethodNameStyle is ${JSON.stringify(options.methodNameStyle ?? "operationId")}. ` +
            'Rename one controller action or use typedApiMethodNameStyle "operationId".', 
        );
      }
      typeNames.set(operationId, rawOperationId);
      methodNames.set(methodName, { operationId: rawOperationId, source: methodNameSource });

      const operationParameters = Array.isArray(operation.parameters)
        ? operation.parameters.map((item) => dereference(openApi, item, "Parameter reference"))
        : [];
      const parametersByKey = new Map();
      for (const parameter of [...pathParameters, ...operationParameters]) {
        const location = String(parameter?.in ?? "");
        const name = String(parameter?.name ?? "");
        if (!["path", "query", "header", "cookie"].includes(location)) {
          throw new Error(
            `Unsupported parameter location ${JSON.stringify(location)} for ${method.toUpperCase()} ${routePath}.`,
          );
        }
        if (!name) {
          throw new Error(`A ${location} parameter for ${method.toUpperCase()} ${routePath} has no name.`);
        }
        if (location === "path" && parameter.required !== true) {
          throw new Error(`Path parameter ${JSON.stringify(name)} must be required for ${method.toUpperCase()} ${routePath}.`);
        }
        parametersByKey.set(`${location}:${name}`, parameter);
      }
      const parameters = [...parametersByKey.values()];

      operations.push({
        routePath,
        method: method.toUpperCase(),
        operation,
        originalOperationId: rawOperationId,
        operationId,
        typeName,
        methodName,
        methodNameSource,
        parameters,
      });
    }
  }

  return operations;
}

export function validateOpenApiDocument(openApi, options = {}) {
  if (!isObject(openApi)) throw new Error("The OpenAPI input is not a JSON object.");
  if (typeof openApi.openapi !== "string" || !openApi.openapi.startsWith("3.")) {
    throw new Error(
      `TypedApi requires an OpenAPI 3.x document. Received: ${JSON.stringify(openApi.openapi ?? openApi.swagger ?? "unknown")}.`,
    );
  }
  if (!isObject(openApi.info)) throw new Error("The OpenAPI document does not contain a valid info object.");
  if (!isObject(openApi.paths)) throw new Error("The OpenAPI document does not contain a valid paths object.");

  const contract = openApi["x-typedapi"];
  if (contract?.contractVersion !== undefined) {
    const supported = options.supportedContractVersion ?? 1;
    if (Number(contract.contractVersion) !== supported) {
      throw new Error(
        `Unsupported TypedApi contract version ${contract.contractVersion}. This generator supports version ${supported}.`,
      );
    }
  }
}
