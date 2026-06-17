export const httpMethods = new Set([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

export function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function dereference(openApi, schemaOrRef) {
  if (!schemaOrRef || !schemaOrRef.$ref) {
    return schemaOrRef;
  }

  const path = schemaOrRef.$ref.replace(/^#\//, "").split("/");
  let current = openApi;

  for (const rawPart of path) {
    const part = rawPart.replace(/~1/g, "/").replace(/~0/g, "~");
    current = current?.[part];
  }

  return current ?? schemaOrRef;
}

export function getRequestBodyContent(requestBody) {
  const content = requestBody?.content ?? {};
  const preferredTypes = [
    "application/json",
    "multipart/form-data",
    "application/x-www-form-urlencoded",
    "text/plain",
    "application/octet-stream",
  ];

  for (const contentType of preferredTypes) {
    if (content[contentType]) {
      return {
        contentType,
        mediaType: content[contentType],
      };
    }
  }

  const [contentType, mediaType] = Object.entries(content)[0] ?? [];

  return contentType ? { contentType, mediaType } : undefined;
}

export function getSuccessResponse(
  operation,
  defaultResponseAsSuccess = false,
) {
  const responses = operation.responses ?? {};
  const preferredStatusCodes = [
    "200",
    "201",
    "202",
    "203",
    "204",
    "205",
    "206",
    "207",
    "208",
    "226",
  ];

  for (const statusCode of preferredStatusCodes) {
    if (responses[statusCode]) {
      return { statusCode, response: responses[statusCode] };
    }
  }

  const successEntry = Object.entries(responses).find(([statusCode]) =>
    /^2\d\d$/.test(statusCode),
  );

  if (successEntry) {
    return { statusCode: successEntry[0], response: successEntry[1] };
  }

  if (defaultResponseAsSuccess && responses.default) {
    return { statusCode: "default", response: responses.default };
  }

  return undefined;
}

export function getResponseContent(response) {
  const content = response?.content ?? {};
  const preferredTypes = [
    "application/json",
    "text/json",
    "application/problem+json",
    "application/octet-stream",
    "text/plain",
  ];

  for (const contentType of preferredTypes) {
    if (content[contentType]) {
      return {
        contentType,
        mediaType: content[contentType],
      };
    }
  }

  const [contentType, mediaType] = Object.entries(content)[0] ?? [];

  return contentType ? { contentType, mediaType } : undefined;
}

export function collectOperations(openApi) {
  const operations = [];

  for (const [routePath, pathItem] of Object.entries(openApi.paths ?? {})) {
    const pathParameters = Array.isArray(pathItem.parameters)
      ? pathItem.parameters
      : [];

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method)) {
        continue;
      }

      const parameters = [
        ...pathParameters,
        ...(Array.isArray(operation.parameters) ? operation.parameters : []),
      ];

      operations.push({
        routePath,
        method: method.toUpperCase(),
        operation,
        parameters,
      });
    }
  }

  return operations;
}
