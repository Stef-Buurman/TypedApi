import {
  dereference,
  getRequestBodyContent,
  getResponseContent,
  getSuccessResponse,
} from "./openapi-utils.mjs";
import { camelCase, pascalCase, propertyKey, refName } from "./names.mjs";

function jsDocFromSchema(schema, indent = "") {
  const lines = [];

  if (schema?.description) {
    lines.push(...String(schema.description).split(/\r?\n/));
  }

  if (schema?.format) {
    lines.push(`@format ${schema.format}`);
  }

  if (Object.prototype.hasOwnProperty.call(schema ?? {}, "default")) {
    lines.push(`@default ${JSON.stringify(schema.default)}`);
  }

  if (schema?.deprecated) {
    lines.push("@deprecated");
  }

  if (lines.length === 0) {
    return "";
  }

  if (lines.length === 1) {
    return `${indent}/** ${lines[0]} */\n`;
  }

  return `${indent}/**\n${lines.map((line) => `${indent} * ${line}`).join("\n")}\n${indent} */\n`;
}

function unionTypes(types) {
  const unique = [...new Set(types.filter(Boolean))];
  return unique.length > 0 ? unique.join(" | ") : "any";
}

export class TypeResolver {
  constructor(openApi, options = {}) {
    this.openApi = openApi;
    this.options = options;
    this.inlineTypes = new Map();
  }

  resolve(schemaOrRef, contextName = "Anonymous", options = {}) {
    if (!schemaOrRef) {
      return "any";
    }

    if (schemaOrRef.$ref) {
      return refName(schemaOrRef.$ref);
    }

    const schema = dereference(this.openApi, schemaOrRef) ?? schemaOrRef;
    const nullable =
      schema.nullable ||
      (Array.isArray(schema.type) && schema.type.includes("null"));
    let type = this.resolveNonNullable(schema, contextName, options);

    if (nullable && !type.includes("null")) {
      type = `${type} | null`;
    }

    return type;
  }

  resolveNonNullable(schema, contextName, options = {}) {
    if (schema.const !== undefined) {
      return JSON.stringify(schema.const);
    }

    if (Array.isArray(schema.enum)) {
      if (options.inlineEnumAsUnion) {
        return unionTypes(
          this.enumLiteralValues(schema).map((value) => JSON.stringify(value)),
        );
      }

      return pascalCase(contextName);
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
      return schema.allOf
        .map((item, index) =>
          this.resolve(item, `${contextName}${index + 1}`, options),
        )
        .join(" & ");
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
        if (schema.format === "binary") {
          return options.binaryAsBlob ? "Blob" : "File";
        }
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
        if (schema.properties) {
          return this.createInlineObjectType(schema, contextName, options);
        }

        if (schema.additionalProperties) {
          const valueType =
            schema.additionalProperties === true
              ? "any"
              : this.resolve(
                  schema.additionalProperties,
                  `${contextName}Value`,
                  options,
                );
          return `Record<string, ${valueType}>`;
        }

        return schemaType === "object" ? "Record<string, any>" : "any";
    }
  }

  createInlineObjectType(schema, contextName, options = {}) {
    const name = pascalCase(contextName);

    if (!this.inlineTypes.has(name)) {
      this.inlineTypes.set(name, schema);
    }

    return name;
  }

  createInterface(name, schema) {
    const required = new Set(schema.required ?? []);
    const lines = [`export interface ${name} {`];

    for (const [propertyName, propertySchema] of Object.entries(
      schema.properties ?? {},
    )) {
      // Required names must still be checked against the original OpenAPI name.
      const propertyRequired = required.has(propertyName);
      const optionalToken = propertyRequired ? "" : "?";

      const propertyType = this.resolve(
        propertySchema,
        `${name}${pascalCase(propertyName)}`,
        { inlineEnumAsUnion: true },
      );

      const resolvedSchema = dereference(this.openApi, propertySchema);
      const typescriptPropertyName = camelCase(propertyName);

      lines.push(
        jsDocFromSchema(resolvedSchema, "  ") +
          `  ${propertyKey(typescriptPropertyName)}${optionalToken}: ${propertyType};`,
      );
    }

    if (schema.additionalProperties) {
      const valueType =
        schema.additionalProperties === true
          ? "any"
          : this.resolve(schema.additionalProperties, `${name}Value`, {
              inlineEnumAsUnion: true,
            });

      lines.push(`  [key: string]: ${valueType};`);
    }

    lines.push("}");
    return lines.join("\n");
  }

  createEnum(name, schema) {
    const values = schema.enum ?? [];

    if (this.options.generateUnionEnums) {
      return `export type ${name} = ${unionTypes(this.enumLiteralValues(schema).map((value) => JSON.stringify(value)))};`;
    }

    const lines = [`export const ${name} = {`];

    for (const [index, value] of values.entries()) {
      const memberName = this.enumMemberName(schema, value, index);
      const enumValue = this.enumRuntimeValue(schema, value, index);
      lines.push(`  ${memberName}: ${JSON.stringify(enumValue)},`);
    }

    lines.push("} as const;");
    lines.push(`export type ${name} = (typeof ${name})[keyof typeof ${name}];`);
    return lines.join("\n");
  }

  enumMetadataNames(schema) {
    const enumNames =
      schema?.["x-enumNames"] ??
      schema?.["x-enum-varnames"] ??
      schema?.["x-enumVarnames"];

    return Array.isArray(enumNames) ? enumNames : [];
  }

  enumLiteralValues(schema) {
    const values = schema.enum ?? [];
    const enumNames = this.enumMetadataNames(schema);

    if (this.options.enumNamesAsValues && enumNames.length > 0) {
      return values.map((value, index) => enumNames[index] ?? value);
    }

    return values;
  }

  enumRuntimeValue(schema, value, index) {
    const enumNames = this.enumMetadataNames(schema);

    if (this.options.enumNamesAsValues && enumNames.length > 0) {
      return enumNames[index] ?? value;
    }

    return value;
  }

  enumMemberName(schema, value, index) {
    const enumNames = this.enumMetadataNames(schema);
    const rawName = enumNames[index] ?? value;
    return pascalCase(String(rawName), "Value").replace(/^[0-9]/, "_$&");
  }
}

function shouldUseInterface(schema) {
  return Boolean(
    schema?.properties ||
    schema?.additionalProperties ||
    schema?.type === "object",
  );
}

export function generateDataContracts(openApi, operations, options = {}) {
  const resolver = new TypeResolver(openApi, options);
  const declarations = [];
  const schemas = openApi.components?.schemas ?? {};

  const schemaEntries = Object.entries(schemas).sort(
    ([aName, aSchema], [bName, bSchema]) => {
      const aIsEnum = Array.isArray(aSchema.enum);
      const bIsEnum = Array.isArray(bSchema.enum);
      if (aIsEnum !== bIsEnum) return aIsEnum ? -1 : 1;
      return aName.localeCompare(bName);
    },
  );

  for (const [name, schema] of schemaEntries) {
    if (Array.isArray(schema.enum)) {
      declarations.push(resolver.createEnum(name, schema));
    } else if (shouldUseInterface(schema)) {
      declarations.push(resolver.createInterface(name, schema));
    } else {
      declarations.push(
        `export type ${name} = ${resolver.resolve(schema, name, { inlineEnumAsUnion: true })};`,
      );
    }
  }

  for (const operationInfo of operations) {
    const operationId = operationInfo.operation.operationId;
    if (!operationId) continue;

    const parameterProperties = operationInfo.parameters.map((parameter) => ({
      name: parameter.name,
      schema: parameter.schema ?? {},
      required: Boolean(parameter.required),
    }));

    if (parameterProperties.length > 0) {
      declarations.push(
        createParamsInterface(
          openApi,
          resolver,
          `${operationId}Params`,
          parameterProperties,
        ),
      );
    }

    const bodyContent = getRequestBodyContent(
      operationInfo.operation.requestBody,
    );
    const bodySchema = bodyContent?.mediaType?.schema;

    if (
      bodySchema &&
      !bodySchema.$ref &&
      (bodyContent.contentType === "multipart/form-data" ||
        shouldUseInterface(bodySchema))
    ) {
      const payloadName = `${operationId}Payload`;
      if (!schemas[payloadName]) {
        declarations.push(resolver.createInterface(payloadName, bodySchema));
      }
    }

    const successResponse = getSuccessResponse(
      operationInfo.operation,
      options.defaultResponseAsSuccess,
    );
    const responseContent = getResponseContent(successResponse?.response);
    const responseSchema = responseContent?.mediaType?.schema;

    if (responseSchema && !responseSchema.$ref) {
      resolver.resolve(responseSchema, `${operationId}Response`, {
        binaryAsBlob:
          responseContent?.contentType === "application/octet-stream",
        inlineEnumAsUnion: true,
      });
    }
  }

  for (const [name, schema] of resolver.inlineTypes.entries()) {
    if (!schemas[name]) {
      declarations.push(resolver.createInterface(name, schema));
    }
  }

  return `${generatedFileHeader()}\n\n${declarations.join("\n\n")}\n`;
}

function createParamsInterface(openApi, resolver, name, parameters) {
  const required = new Set(
    parameters
      .filter((parameter) => parameter.required)
      .map((parameter) => parameter.name),
  );
  const lines = [`export interface ${name} {`];

  for (const parameter of parameters) {
    const parameterSchema = dereference(openApi, parameter.schema);
    const optionalToken = required.has(parameter.name) ? "" : "?";
    const parameterType = resolver.resolve(
      parameter.schema,
      `${name}${pascalCase(parameter.name)}`,
      { inlineEnumAsUnion: true },
    );
    lines.push(
      jsDocFromSchema(parameterSchema, "  ") +
        `  ${propertyKey(parameter.name)}${optionalToken}: ${parameterType};`,
    );
  }

  lines.push("}");
  return lines.join("\n");
}

export function getOperationTypes(openApi, operationInfo, options = {}) {
  const resolver = new TypeResolver(openApi, options);
  const operationId = operationInfo.operation.operationId;
  const parameters = operationInfo.parameters ?? [];
  const pathParams = parameters.filter((parameter) => parameter.in === "path");
  const queryParams = parameters.filter(
    (parameter) => parameter.in === "query",
  );
  const requestBodyContent = getRequestBodyContent(
    operationInfo.operation.requestBody,
  );
  const requestBodySchema = requestBodyContent?.mediaType?.schema;
  const successResponse = getSuccessResponse(
    operationInfo.operation,
    options.defaultResponseAsSuccess,
  );
  const responseContent = getResponseContent(successResponse?.response);
  const responseSchema = responseContent?.mediaType?.schema;

  let bodyType;
  if (requestBodySchema) {
    if (requestBodySchema.$ref) {
      bodyType = resolver.resolve(requestBodySchema, `${operationId}Payload`);
    } else if (
      requestBodyContent?.contentType === "multipart/form-data" ||
      shouldUseInterface(requestBodySchema)
    ) {
      bodyType = `${operationId}Payload`;
    } else {
      bodyType = resolver.resolve(requestBodySchema, `${operationId}Payload`, {
        inlineEnumAsUnion: true,
      });
    }
  }

  let responseType = "void";
  if (responseSchema) {
    responseType = resolver.resolve(responseSchema, `${operationId}Response`, {
      binaryAsBlob: responseContent?.contentType === "application/octet-stream",
      inlineEnumAsUnion: true,
    });
  }

  return {
    operationId,
    methodName: operationId
      ? operationId.charAt(0).toLowerCase() + operationId.slice(1)
      : undefined,
    paramsTypeName: parameters.length > 0 ? `${operationId}Params` : undefined,
    bodyType,
    responseType,
    contentType: requestBodyContent?.contentType,
    responseContentType: responseContent?.contentType,
    hasPathParams: pathParams.length > 0,
    hasQueryParams: queryParams.length > 0,
    pathParams,
    queryParams,
  };
}

export function generatedFileHeader() {
  return `/* eslint-disable */
/* tslint:disable */
/*
 * --------------------------------------------------------------------------------
 * ## THIS FILE WAS GENERATED BY typedapi-client-helpers                         ##
 * ##                                                                            ##
 * ## AUTHOR: Stef Buurman                                                       ##
 * ## SOURCE: https://github.com/Stef-Buurman/TypedApi/tree/main/npm/typed-api-client ##
 * --------------------------------------------------------------------------------
 */`;
}
