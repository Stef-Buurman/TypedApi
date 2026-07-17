import {
  dereference,
  getErrorResponses,
  getParameterSchema,
  getRequestBodyContent,
  getResponseContent,
  getSuccessResponse,
} from "./openapi-utils.mjs";
import {
  operationTypeName,
  pascalCase,
  propertyKey,
  refName,
  sanitizeIdentifier,
  typePropertyName,
  uniqueName,
} from "./names.mjs";

function jsDocFromSchema(schema, indent = "") {
  const lines = [];
  if (schema?.description)
    lines.push(...String(schema.description).split(/\r?\n/));
  if (schema?.format) lines.push(`@format ${schema.format}`);
  if (Object.prototype.hasOwnProperty.call(schema ?? {}, "default")) {
    lines.push(`@default ${JSON.stringify(schema.default)}`);
  }
  if (schema?.readOnly) lines.push("@readonly");
  if (schema?.writeOnly) lines.push("@writeOnly");
  if (schema?.deprecated) lines.push("@deprecated");
  if (lines.length === 0) return "";
  if (lines.length === 1) return `${indent}/** ${lines[0]} */\n`;
  return `${indent}/**\n${lines.map((line) => `${indent} * ${line}`).join("\n")}\n${indent} */\n`;
}

function unionTypes(types, fallback = "unknown") {
  const unique = [...new Set(types.filter(Boolean))];
  return unique.length > 0 ? unique.join(" | ") : fallback;
}

function intersectionTypes(types, fallback = "Record<string, unknown>") {
  const unique = [...new Set(types.filter(Boolean))];
  return unique.length > 0 ? unique.join(" & ") : fallback;
}

function hasObjectShape(schema) {
  return Boolean(
    schema?.properties ||
    schema?.additionalProperties ||
    schema?.type === "object",
  );
}

function schemaWithoutComposition(schema) {
  const { allOf, oneOf, anyOf, nullable, ...local } = schema ?? {};
  return local;
}

function assertUniqueTypePropertyNames(entries, contextName) {
  const seen = new Map();
  for (const rawName of entries) {
    const localName = typePropertyName(rawName);
    const existing = seen.get(localName);
    if (existing !== undefined && existing !== rawName) {
      throw new Error(
        `OpenAPI members ${JSON.stringify(existing)} and ${JSON.stringify(rawName)} in ${contextName} ` +
          `both become TypeScript property ${JSON.stringify(localName)} when only the first character is lowercased.`,
      );
    }
    seen.set(localName, rawName);
  }
}


export class TypeResolver {
  constructor(openApi, options = {}) {
    this.openApi = openApi;
    this.options = options;
    this.inlineTypes = new Map();
    this.componentNames = new Map();
    const usedNames = new Set();

    for (const rawName of Object.keys(openApi.components?.schemas ?? {})) {
      const name = uniqueName(operationTypeName(rawName), usedNames);
      this.componentNames.set(rawName, name);
    }
  }

  componentName(rawName) {
    return this.componentNames.get(rawName) ?? operationTypeName(rawName);
  }

  resolve(schemaOrRef, contextName = "Anonymous", options = {}) {
    if (!schemaOrRef) return "unknown";

    if (schemaOrRef.$ref) {
      dereference(this.openApi, schemaOrRef, "Schema reference");
      return this.componentName(refName(schemaOrRef.$ref));
    }

    const schema =
      dereference(this.openApi, schemaOrRef, "Schema reference") ?? schemaOrRef;
    const nullable =
      schema.nullable ||
      (Array.isArray(schema.type) && schema.type.includes("null"));
    let type = this.resolveNonNullable(schema, contextName, options);
    if (nullable && !/(^|\W)null(\W|$)/.test(type)) type = `${type} | null`;
    return type;
  }

  resolveNonNullable(schema, contextName, options = {}) {
    if (schema.const !== undefined) return JSON.stringify(schema.const);

    if (Array.isArray(schema.enum)) {
      if (options.inlineEnumAsUnion) {
        return unionTypes(
          this.enumLiteralValues(schema).map((value) => JSON.stringify(value)),
        );
      }
      return operationTypeName(contextName);
    }

    if (schema.oneOf || schema.anyOf) {
      const variants = schema.oneOf ?? schema.anyOf;
      return unionTypes(
        variants.map((item, index) =>
          this.resolve(item, `${contextName}${index + 1}`, options),
        ),
      );
    }

    if (schema.allOf) {
      const parts = schema.allOf.map((item, index) =>
        this.resolve(item, `${contextName}${index + 1}`, options),
      );
      const localSchema = schemaWithoutComposition(schema);
      if (hasObjectShape(localSchema)) {
        parts.push(
          this.createInlineObjectType(
            localSchema,
            `${contextName}Own`,
            options,
          ),
        );
      }
      return intersectionTypes(parts);
    }

    const schemaType = Array.isArray(schema.type)
      ? schema.type.find((item) => item !== "null")
      : schema.type;

    switch (schemaType) {
      case "integer":
      case "number":
        return "number";
      case "boolean":
        return "boolean";
      case "string":
        if (schema.format === "binary")
          return options.binaryAsBlob ? "Blob" : "File";
        return "string";
      case "array": {
        const itemType = this.resolve(
          schema.items ?? {},
          `${contextName}Item`,
          options,
        );
        return /^[A-Za-z_$][\w$]*(?:<.*>)?$/.test(itemType) ||
          itemType.endsWith("[]")
          ? `${itemType}[]`
          : `(${itemType})[]`;
      }
      case "object":
      default:
        if (schema.properties)
          return this.createInlineObjectType(schema, contextName, options);
        if (schema.additionalProperties) {
          const valueType =
            schema.additionalProperties === true
              ? "unknown"
              : this.resolve(
                  schema.additionalProperties,
                  `${contextName}Value`,
                  options,
                );
          return `Record<string, ${valueType}>`;
        }
        return schemaType === "object" ? "Record<string, unknown>" : "unknown";
    }
  }

  createInlineObjectType(schema, contextName) {
    const base = operationTypeName(contextName);
    let name = base;
    let counter = 2;
    while (
      this.componentNamesHasValue(name) ||
      (this.inlineTypes.has(name) && this.inlineTypes.get(name) !== schema)
    ) {
      name = `${base}${counter++}`;
    }
    if (!this.inlineTypes.has(name)) this.inlineTypes.set(name, schema);
    return name;
  }

  componentNamesHasValue(value) {
    return [...this.componentNames.values()].includes(value);
  }

  objectMembers(name, schema) {
    const required = new Set(schema.required ?? []);
    const lines = [];

    const propertyEntries = Object.entries(schema.properties ?? {});
    assertUniqueTypePropertyNames(
      propertyEntries.map(([propertyName]) => propertyName),
      name,
    );

    for (const [propertyName, propertySchema] of propertyEntries) {
      const localPropertyName = typePropertyName(propertyName);
      const optionalToken = required.has(propertyName) ? "" : "?";
      const propertyType = this.resolve(
        propertySchema,
        `${name}${pascalCase(propertyName)}`,
        {
          inlineEnumAsUnion: true,
        },
      );
      const resolvedSchema = dereference(
        this.openApi,
        propertySchema,
        "Property schema reference",
      );
      lines.push(
        jsDocFromSchema(resolvedSchema, "  ") +
          `  ${propertyKey(localPropertyName)}${optionalToken}: ${propertyType};`,
      );
    }

    if (schema.additionalProperties) {
      const valueType =
        schema.additionalProperties === true
          ? "unknown"
          : this.resolve(schema.additionalProperties, `${name}Value`, {
              inlineEnumAsUnion: true,
            });
      lines.push(`  [key: string]: ${valueType};`);
    }

    return lines;
  }

  createInterface(name, schema) {
    return [
      `export interface ${name} {`,
      ...this.objectMembers(name, schema),
      "}",
    ].join("\n");
  }

  createObjectTypeLiteral(name, schema) {
    return ["{", ...this.objectMembers(name, schema), "}"].join("\n");
  }

  createDeclaration(name, schema) {
    if (Array.isArray(schema.enum)) return this.createEnum(name, schema);

    if (schema.allOf) {
      const parts = schema.allOf.map((item, index) =>
        this.resolve(item, `${name}${index + 1}`, { inlineEnumAsUnion: true }),
      );
      const localSchema = schemaWithoutComposition(schema);
      if (hasObjectShape(localSchema))
        parts.push(this.createObjectTypeLiteral(`${name}Own`, localSchema));
      return `export type ${name} = ${intersectionTypes(parts)};`;
    }

    if (hasObjectShape(schema)) return this.createInterface(name, schema);
    return `export type ${name} = ${this.resolve(schema, name, { inlineEnumAsUnion: true })};`;
  }

  createEnum(name, schema) {
    if (this.options.generateUnionEnums) {
      return `export type ${name} = ${unionTypes(
        this.enumLiteralValues(schema).map((value) => JSON.stringify(value)),
      )};`;
    }

    const lines = [`export const ${name} = {`];
    for (const [index, value] of (schema.enum ?? []).entries()) {
      const memberName = this.enumMemberName(schema, value, index);
      const enumValue = this.enumRuntimeValue(schema, value, index);
      lines.push(`  ${propertyKey(memberName)}: ${JSON.stringify(enumValue)},`);
    }
    lines.push("} as const;");
    lines.push(`export type ${name} = (typeof ${name})[keyof typeof ${name}];`);
    return lines.join("\n");
  }

  enumMetadataNames(schema) {
    const names =
      schema?.["x-enumNames"] ??
      schema?.["x-enum-varnames"] ??
      schema?.["x-enumVarnames"];
    return Array.isArray(names) ? names : [];
  }

  enumLiteralValues(schema) {
    const values = schema.enum ?? [];
    const names = this.enumMetadataNames(schema);
    return this.options.enumNamesAsValues && names.length > 0
      ? values.map((value, index) => names[index] ?? value)
      : values;
  }

  enumRuntimeValue(schema, value, index) {
    const names = this.enumMetadataNames(schema);
    return this.options.enumNamesAsValues && names.length > 0
      ? (names[index] ?? value)
      : value;
  }

  enumMemberName(schema, value, index) {
    const rawName = this.enumMetadataNames(schema)[index] ?? value;
    return operationTypeName(String(rawName) || "Value");
  }
}

function parameterTypeName(operationId, location) {
  return `${operationId}${pascalCase(location)}Params`;
}

function combinedParameterTypeName(operationId) {
  return `${operationId}Params`;
}

function createParamsInterface(openApi, resolver, name, parameters) {
  const lines = [`export interface ${name} {`];
  assertUniqueTypePropertyNames(
    parameters.map((parameter) => parameter.name),
    name,
  );
  for (const parameter of parameters) {
    const parameterSchema = getParameterSchema(openApi, parameter);
    const optionalToken =
      parameter.required || parameter.in === "path" ? "" : "?";
    const parameterType = resolver.resolve(
      parameterSchema,
      `${name}${pascalCase(parameter.name)}`,
      {
        inlineEnumAsUnion: true,
      },
    );
    lines.push(
      jsDocFromSchema(parameterSchema, "  ") +
        `  ${propertyKey(typePropertyName(parameter.name))}${optionalToken}: ${parameterType};`,
    );
  }
  lines.push("}");
  return lines.join("\n");
}

function resolveResponseType(
  resolver,
  response,
  contextName,
  binaryAsBlob = false,
) {
  const content = getResponseContent(response);
  const schema = content?.mediaType?.schema;
  if (!schema) return undefined;
  return resolver.resolve(schema, contextName, {
    binaryAsBlob:
      binaryAsBlob || content?.contentType === "application/octet-stream",
    inlineEnumAsUnion: true,
  });
}

export function getOperationTypes(
  openApi,
  operationInfo,
  options = {},
  resolver = new TypeResolver(openApi, options),
) {
  const operationId = operationInfo.operationId;
  const operationTypeNameBase = operationInfo.typeName ?? operationId;
  const parameters = operationInfo.parameters ?? [];
  const parametersByLocation = Object.fromEntries(
    ["path", "query", "header", "cookie"].map((location) => [
      location,
      parameters.filter((parameter) => parameter.in === location),
    ]),
  );

  const requestBodyContent = getRequestBodyContent(
    openApi,
    operationInfo.operation.requestBody,
  );
  const requestBodySchema = requestBodyContent?.mediaType?.schema;
  let bodyType;
  if (requestBodySchema) {
    if (requestBodySchema.$ref) {
      bodyType = resolver.resolve(requestBodySchema, `${operationTypeNameBase}Payload`);
    } else if (
      requestBodyContent?.contentType === "multipart/form-data" ||
      hasObjectShape(requestBodySchema)
    ) {
      bodyType = `${operationTypeNameBase}Payload`;
    } else {
      bodyType = resolver.resolve(requestBodySchema, `${operationTypeNameBase}Payload`, {
        inlineEnumAsUnion: true,
      });
    }
  }

  const successResponse = getSuccessResponse(
    openApi,
    operationInfo.operation,
    options.defaultResponseAsSuccess,
  );
  const responseContent = getResponseContent(successResponse?.response);
  const responseType = successResponse
    ? (resolveResponseType(
        resolver,
        successResponse.response,
        `${operationTypeNameBase}Response`,
      ) ?? "void")
    : "void";

  const errorResponses = getErrorResponses(openApi, operationInfo.operation);
  const errorTypes = errorResponses
    .map(({ statusCode, response }) =>
      resolveResponseType(
        resolver,
        response,
        `${operationTypeNameBase}Error${statusCode}`,
      ),
    )
    .filter(Boolean);
  const usesHttpErrorFallback = errorTypes.length === 0;
  const errorType = unionTypes(errorTypes, "ApiHttpError");

  const hasNonBodyInput = parameters.length > 0;
  const paginated =
    Boolean(operationInfo.operation["x-typedapi-pagination"]) ||
    /(?:Api)?Pagination(?:Sort)?Response\b|Paged(?:Response|Result)?\b|Paginated(?:Response|Result)?\b/.test(
      responseType,
    );
  const isPurePaginatedQuery =
    paginated &&
    parametersByLocation.query.length > 0 &&
    !parametersByLocation.path.length &&
    !parametersByLocation.header.length &&
    !parametersByLocation.cookie.length &&
    !bodyType;
  const parameterTypeNames = isPurePaginatedQuery
    ? { query: parameterTypeName(operationTypeNameBase, "query") }
    : {};

  return {
    operationId,
    operationTypeNameBase,
    originalOperationId: operationInfo.originalOperationId,
    methodName: operationInfo.methodName,
    methodNameSource: operationInfo.methodNameSource,
    paramsTypeName:
      hasNonBodyInput && !isPurePaginatedQuery
        ? combinedParameterTypeName(operationTypeNameBase)
        : undefined,
    parameterTypeNames,
    parameters,
    parametersByLocation,
    allParametersOptional: parameters.every(
      (parameter) => parameter.in !== "path" && !parameter.required,
    ),
    bodyType,
    bodyRequired: Boolean(requestBodyContent?.requestBody?.required),
    responseType,
    errorType,
    usesHttpErrorFallback,
    contentType: requestBodyContent?.contentType,
    responseContentType: responseContent?.contentType,
    hasPathParams: parametersByLocation.path.length > 0,
    hasQueryParams: parametersByLocation.query.length > 0,
    hasHeaderParams: parametersByLocation.header.length > 0,
    hasCookieParams: parametersByLocation.cookie.length > 0,
    paginationMetadata: operationInfo.operation["x-typedapi-pagination"],
  };
}

export function generateDataContracts(openApi, operations, options = {}) {
  const resolver = new TypeResolver(openApi, options);
  const declarations = [];
  const schemas = openApi.components?.schemas ?? {};

  const entries = Object.entries(schemas).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [rawName, schemaOrRef] of entries) {
    const schema = dereference(
      openApi,
      schemaOrRef,
      "Component schema reference",
    );
    declarations.push(
      resolver.createDeclaration(resolver.componentName(rawName), schema),
    );
  }

  for (const operationInfo of operations) {
    const operationTypes = getOperationTypes(
      openApi,
      operationInfo,
      options,
      resolver,
    );

    if (operationTypes.paramsTypeName) {
      declarations.push(
        createParamsInterface(
          openApi,
          resolver,
          operationTypes.paramsTypeName,
          operationTypes.parameters,
        ),
      );
    }

    for (const [location, parameters] of Object.entries(
      operationTypes.parametersByLocation,
    )) {
      const typeName = operationTypes.parameterTypeNames[location];
      if (typeName)
        declarations.push(
          createParamsInterface(openApi, resolver, typeName, parameters),
        );
    }

    const bodyContent = getRequestBodyContent(
      openApi,
      operationInfo.operation.requestBody,
    );
    const bodySchema = bodyContent?.mediaType?.schema;
    if (
      bodySchema &&
      !bodySchema.$ref &&
      (bodyContent.contentType === "multipart/form-data" ||
        hasObjectShape(bodySchema))
    ) {
      declarations.push(
        resolver.createDeclaration(
          `${operationTypes.operationTypeNameBase}Payload`,
          bodySchema,
        ),
      );
    }
  }

  for (const [name, schema] of resolver.inlineTypes.entries()) {
    if (!resolver.componentNamesHasValue(name))
      declarations.push(resolver.createDeclaration(name, schema));
  }


  return `${generatedFileHeader()}\n\n${declarations.join("\n\n")}\n`;
}

export function generatedFileHeader() {
  return `/* eslint-disable */
/* tslint:disable */
/*
 * -------------------------------------------------------------------------------------
 * ## THIS FILE WAS GENERATED BY typedapi-client-helpers                              ##
 * ## DO NOT EDIT THIS FILE DIRECTLY                                                  ##
 * ##                                                                                 ##
 * ## AUTHOR: Stef Buurman                                                            ##
 * ## SOURCE: https://github.com/Stef-Buurman/TypedApi/tree/main/npm/typed-api-client ##
 * -------------------------------------------------------------------------------------
 */`;
}
