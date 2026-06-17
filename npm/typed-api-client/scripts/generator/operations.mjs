import { controllerNameFromOperation, methodNameFromOperation, quoteProperty, refName, safeIdentifier, safeTypeName, uniqueName } from './names.mjs';
import { schemaToType } from './schemas.mjs';

const httpMethods = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

function toStatusKey(status) {
  return String(status).toLowerCase();
}

function responseSchema(operation, config) {
  const responses = operation.responses ?? {};
  const successStatus = Object.keys(responses).find((status) => /^[23]\d\d$/.test(status))
    ?? (config.defaultResponseAsSuccess ? 'default' : undefined)
    ?? '200';
  const response = responses[successStatus] ?? responses.default ?? {};
  const content = response.content ?? {};
  const media = content['application/json'] ?? content['text/json'] ?? content['application/*+json'] ?? Object.values(content)[0];
  return media?.schema;
}

function errorSchema(operation) {
  const responses = operation.responses ?? {};
  const errorStatus = Object.keys(responses).find((status) => /^[45]\d\d$/.test(status));
  const response = responses[errorStatus] ?? responses.default ?? {};
  const content = response.content ?? {};
  const media = content['application/json'] ?? content['text/json'] ?? content['application/*+json'] ?? Object.values(content)[0];
  return media?.schema;
}

function requestBody(operation) {
  const body = operation.requestBody;
  if (!body) return undefined;
  const content = body.content ?? {};
  const mediaType = content['multipart/form-data'] ? 'multipart/form-data'
    : content['application/x-www-form-urlencoded'] ? 'application/x-www-form-urlencoded'
    : content['application/json'] ? 'application/json'
    : Object.keys(content)[0];
  const media = content[mediaType];
  return { mediaType, schema: media?.schema, required: body.required === true };
}

function mergeParameters(pathItem, operation) {
  return [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])];
}

function parameterType(parameter, config) {
  return schemaToType(parameter.schema ?? {}, config);
}

function makeParamsType(name, parameters, location, config) {
  const filtered = parameters.filter((p) => p.in === location);
  if (!filtered.length) return undefined;
  const required = new Set(filtered.filter((p) => p.required).map((p) => p.name));
  const lines = filtered.map((p) => `  ${quoteProperty(p.name)}${required.has(p.name) ? '' : '?'}: ${parameterType(p, config)};`);
  return { name, source: `export interface ${name} {\n${lines.join('\n')}\n}` };
}

function createPathTemplate(route, pathParams) {
  let expression = JSON.stringify(route);
  if (!pathParams.length) return expression;
  let template = route;
  for (const param of pathParams) {
    const id = safeIdentifier(param.name);
    template = template.replaceAll(`{${param.name}}`, `\${encodeURIComponent(String(${id}))}`);
  }
  return '`' + template + '`';
}

function getFormatFromResponse(operation) {
  const responses = operation.responses ?? {};
  const success = responses[Object.keys(responses).find((s) => /^[23]/.test(s))] ?? responses.default;
  const content = success?.content ?? {};
  if (content['application/json'] || content['text/json'] || content['application/*+json']) return 'json';
  if (content['application/octet-stream']) return 'blob';
  if (content['text/plain']) return 'text';
  return 'json';
}

export function collectOperations(document, config) {
  const controllers = new Map();
  const usedTypeNames = new Set(Object.keys(document.components?.schemas ?? {}).map(safeTypeName));
  const inlineTypes = [];

  for (const [route, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [rawMethod, operation] of Object.entries(pathItem ?? {})) {
      const httpMethod = rawMethod.toLowerCase();
      if (!httpMethods.has(httpMethod) || !operation) continue;

      const controllerName = controllerNameFromOperation(operation, route, config);
      const methodName = methodNameFromOperation(operation, httpMethod, route);
      const parameters = mergeParameters(pathItem, operation);
      const pathParams = parameters.filter((p) => p.in === 'path');
      const queryParams = parameters.filter((p) => p.in === 'query');
      const headerParams = parameters.filter((p) => p.in === 'header');
      const body = requestBody(operation);

      const operationTypeBase = safeTypeName(operation.operationId || `${controllerName}_${methodName}`);
      const queryType = queryParams.length ? uniqueName(`${operationTypeBase}Query`, usedTypeNames) : undefined;
      const headerType = headerParams.length ? uniqueName(`${operationTypeBase}Headers`, usedTypeNames) : undefined;
      const bodyType = body?.schema ? (body.schema.$ref ? refName(body.schema.$ref) : uniqueName(`${operationTypeBase}Body`, usedTypeNames)) : undefined;
      const responseType = responseSchema(operation, config) ? schemaToType(responseSchema(operation, config), config) : 'void';
      const errorType = errorSchema(operation) ? schemaToType(errorSchema(operation), config) : 'unknown';

      const queryTypeSource = queryType ? makeParamsType(queryType, parameters, 'query', config)?.source : undefined;
      const headerTypeSource = headerType ? makeParamsType(headerType, parameters, 'header', config)?.source : undefined;
      const bodyTypeSource = bodyType && body?.schema && !body.schema.$ref ? `export type ${bodyType} = ${schemaToType(body.schema, config)};` : undefined;

      if (queryTypeSource) inlineTypes.push({ name: queryType, source: queryTypeSource });
      if (headerTypeSource) inlineTypes.push({ name: headerType, source: headerTypeSource });
      if (bodyTypeSource) inlineTypes.push({ name: bodyType, source: bodyTypeSource });

      const item = {
        route,
        httpMethod: httpMethod.toUpperCase(),
        controllerName,
        methodName,
        operation,
        pathParams,
        queryType,
        headerType,
        bodyType,
        bodyRequired: body?.required === true,
        mediaType: body?.mediaType,
        responseType,
        errorType,
        format: getFormatFromResponse(operation),
        queryTypeSource,
        headerTypeSource,
        bodyTypeSource,
      };

      if (!controllers.has(controllerName)) controllers.set(controllerName, []);
      controllers.get(controllerName).push(item);
    }
  }

  return { controllers, inlineTypes: inlineTypes.filter(Boolean) };
}

function generatedMethodArguments(operation) {
  const args = [];
  for (const param of operation.pathParams) {
    args.push(`${safeIdentifier(param.name)}: ${schemaToType(param.schema ?? {}, {})}`);
  }
  if (operation.queryType) args.push(`query?: ${operation.queryType}`);
  if (operation.bodyType) args.push(`data${operation.bodyRequired ? '' : '?'}: ${operation.bodyType}`);
  if (operation.headerType) args.push(`headers?: ${operation.headerType}`);
  args.push('params: RequestParams = {}');
  return args.join(',\n    ');
}

function callArgs(operation) {
  const path = createPathTemplate(operation.route, operation.pathParams);
  const lines = [
    `path: ${path}`,
    `method: "${operation.httpMethod}"`,
  ];
  if (operation.queryType) lines.push('query: query as any');
  if (operation.bodyType) lines.push('body: data');
  if (operation.mediaType === 'multipart/form-data') lines.push('type: ContentType.FormData');
  else if (operation.mediaType === 'application/x-www-form-urlencoded') lines.push('type: ContentType.UrlEncoded');
  else if (operation.bodyType) lines.push('type: ContentType.Json');
  lines.push(`format: "${operation.format}"`);
  if (operation.headerType) lines.push('headers: { ...(params.headers ?? {}), ...headers }');
  lines.push('...params');
  return lines.map((x) => `      ${x},`).join('\n');
}

function wrapperArguments(operation) {
  const args = [];
  for (const param of operation.pathParams) args.push(`${safeIdentifier(param.name)}: ${schemaToType(param.schema ?? {}, {})}`);
  if (operation.queryType) args.push(`query?: ${operation.queryType}`);
  if (operation.bodyType) args.push(`data${operation.bodyRequired ? '' : '?'}: ${operation.bodyType}`);
  if (operation.headerType) args.push(`headers?: ${operation.headerType}`);
  args.push(`options: ApiMethodOptions<${operation.responseType}, ${operation.errorType}, RequestParams> = {}`);
  return args.join(',\n  ');
}

function classCall(operation, instanceName) {
  const args = [];
  for (const param of operation.pathParams) args.push(safeIdentifier(param.name));
  if (operation.queryType) args.push('query');
  if (operation.bodyType) args.push('data as any');
  if (operation.headerType) args.push('headers');
  args.push('params ?? {}');
  return `${instanceName}.${operation.methodName}Raw(${args.join(', ')})`;
}

export function generateControllerFile(controllerName, operations, config, defaultHandlers) {
  const instanceName = `${controllerName.charAt(0).toLowerCase()}${controllerName.slice(1)}Api`;
  const typeKeyword = config.useTypeOnlyImports ? 'import type' : 'import';
  const imports = [
    '/* eslint-disable */',
    '/* tslint:disable */',
    '// This file was generated by typedapi-client-helpers. Do not edit manually.',
    '',
    'import { ContentType, HttpClient } from "../http-client";',
    `${typeKeyword} { RequestParams } from "../http-client";`,
    `${typeKeyword} { ApiResult, ApiMethodOptions } from "${config.runtimePackageName}";`,
    `import { handleApiResponse } from "${config.runtimePackageName}";`,
    `import type * as Contracts from "../data-contracts";`,
  ];

  if (defaultHandlers) {
    imports.push(`import { ${defaultHandlers.success} as typedApiDefaultSuccessHandler, ${defaultHandlers.error} as typedApiDefaultErrorHandler } from "${defaultHandlers.path}";`);
  }

  const contractNames = new Set(config.contractNames ?? []);
  const localTypeNames = new Set(
    operations
      .flatMap((op) => [op.queryType, op.headerType, op.bodyTypeSource ? op.bodyType : undefined])
      .filter(Boolean),
  );
  const fixContractRefs = (source) => source.replace(/\b([A-Z][A-Za-z0-9_]*)(?=\b)/g, (match) => {
    if (localTypeNames.has(match)) return match;
    if (contractNames.has(match)) return `Contracts.${match}`;
    return match;
  });
  const fixLocalTypeSource = (source) =>
    source
      .replace(/(:\s*)([^;\n]+)(;)/g, (_m, prefix, type, suffix) => `${prefix}${fixContractRefs(type)}${suffix}`)
      .replace(/(=\s*)([^;]+)(;)/g, (_m, prefix, type, suffix) => `${prefix}${fixContractRefs(type)}${suffix}`);

  const localTypeSources = [];
  const seenLocalTypes = new Set();
  for (const op of operations) {
    for (const source of [op.queryTypeSource, op.headerTypeSource, op.bodyTypeSource]) {
      if (!source || seenLocalTypes.has(source)) continue;
      seenLocalTypes.add(source);
      localTypeSources.push(fixLocalTypeSource(source));
    }
  }

  const rawMethods = operations.map((op) => {
    const responseType = fixContractRefs(op.responseType);
    const errorType = fixContractRefs(op.errorType);
    const args = fixContractRefs(generatedMethodArguments(op));
    return `  public ${op.methodName}Raw = (\n    ${args}\n  ): Promise<import("../http-client").HttpResponse<${responseType}, ${errorType}>> => {\n    return this.http.request<${responseType}, ${errorType}>({\n${callArgs(op)}\n    });\n  };`;
  }).join('\n\n');

  const wrappers = operations.map((op) => {
    const responseType = fixContractRefs(op.responseType);
    const errorType = fixContractRefs(op.errorType);
    const args = fixContractRefs(wrapperArguments(op));
    const callbackOptions = defaultHandlers
      ? '{ onSuccess: onSuccess ?? typedApiDefaultSuccessHandler, onError: onError ?? typedApiDefaultErrorHandler }'
      : '{ onSuccess, onError }';
    return `export async function ${op.methodName}(\n  ${args}\n): Promise<ApiResult<${responseType}>> {\n  const { onSuccess, onError, params } = options;\n\n  return handleApiResponse<${responseType}, ${errorType}>(\n    () => ${classCall(op, instanceName)},\n    ${callbackOptions}\n  );\n}`;
  }).join('\n\n');

  const classSource = `export class ${controllerName}Api {\n  private readonly http: HttpClient;\n\n  constructor(http: HttpClient = new HttpClient()) {\n    this.http = http;\n  }\n\n${rawMethods}\n}\n\nconst ${instanceName} = new ${controllerName}Api();`;

  const localTypes = localTypeSources.length ? `${localTypeSources.join('\n\n')}\n\n` : '';
  return `${imports.join('\n')}\n\n${localTypes}${classSource}\n\n${wrappers}\n`;
}
