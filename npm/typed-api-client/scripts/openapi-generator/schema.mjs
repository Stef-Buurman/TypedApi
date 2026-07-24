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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function genericDeclarationBody(declaration) {
  if (declaration.startsWith("export interface ")) {
    const bodyStart = declaration.indexOf("{");
    return bodyStart >= 0 ? declaration.slice(bodyStart + 1) : "";
  }

  const bodyStart = declaration.indexOf("=");
  return bodyStart >= 0 ? declaration.slice(bodyStart + 1) : "";
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


function normalizeGenericBindings(bindings, parameters, contextName) {
  const normalized = Array.isArray(bindings)
    ? bindings
        .map((binding) => ({
          parameter: String(binding?.parameter ?? "").trim(),
          path: String(binding?.path ?? "").trim(),
        }))
        .filter((binding) => binding.parameter && binding.path.startsWith("/"))
    : [];
  for (const binding of normalized) {
    if (!parameters.includes(binding.parameter)) {
      throw new Error(`${contextName} binding ${binding.path} refers to unknown parameter ${binding.parameter}.`);
    }
  }
  return normalized;
}

function normalizeGenericArgument(argument, parameters, contextName) {
  if (!argument || typeof argument !== "object") {
    throw new Error(`${contextName} contains an invalid generic argument.`);
  }

  const genericParameter = String(argument.genericParameter ?? "").trim();
  const primitive = String(argument.primitive ?? "").trim();
  const schemaId = String(argument.schemaId ?? "").trim();
  const populated = [genericParameter, primitive, schemaId].filter(Boolean);
  if (populated.length !== 1) {
    throw new Error(`${contextName} generic arguments must specify exactly one of genericParameter, primitive, or schemaId.`);
  }
  if (genericParameter && !parameters.includes(genericParameter)) {
    throw new Error(`${contextName} refers to unknown generic parameter ${genericParameter}.`);
  }
  if (genericParameter) return { genericParameter };
  if (primitive) return { primitive };
  return { schemaId };
}

function normalizeGenericBase(base, ownerParameters, contextName) {
  if (!base || typeof base !== "object") return undefined;
  const definition = String(base.definition ?? "").trim();
  const parameters = Array.isArray(base.parameters)
    ? base.parameters.map((item) => String(item)).filter(Boolean)
    : [];
  const rawArguments = Array.isArray(base.arguments) ? base.arguments : [];
  const properties = Array.isArray(base.properties)
    ? [...new Set(base.properties.map((item) => String(item)).filter(Boolean))]
    : [];
  if (!definition || parameters.length === 0 || parameters.length !== rawArguments.length) {
    throw new Error(`Invalid generic base metadata for ${contextName}.`);
  }
  const argumentsList = rawArguments.map((argument) =>
    normalizeGenericArgument(argument, ownerParameters, `Generic base ${definition}`),
  );
  const bindings = normalizeGenericBindings(
    base.bindings,
    parameters,
    `Generic base ${definition}`,
  );
  return {
    definition,
    parameters,
    arguments: argumentsList,
    properties,
    bindings,
    base: normalizeGenericBase(base.base, parameters, definition),
  };
}

function genericMetadata(schema) {
  const metadata = schema?.["x-typedapi-generic"];
  if (!metadata || typeof metadata !== "object") return undefined;
  const definition = String(metadata.definition ?? "").trim();
  const parameters = Array.isArray(metadata.parameters)
    ? metadata.parameters.map((item) => String(item)).filter(Boolean)
    : [];
  const argumentsList = Array.isArray(metadata.arguments) ? metadata.arguments : [];
  if (!definition || parameters.length === 0 || parameters.length !== argumentsList.length) {
    throw new Error(`Invalid x-typedapi-generic metadata for ${definition || "an unnamed schema"}.`);
  }
  const bindings = normalizeGenericBindings(metadata.bindings, parameters, `Generic schema ${definition}`);
  return {
    definition,
    parameters,
    arguments: argumentsList,
    bindings,
    base: normalizeGenericBase(metadata.base, parameters, definition),
  };
}

function decodeJsonPointerPart(value) {
  return value.replace(/~1/g, "/").replace(/~0/g, "~");
}

function cloneSchemaWithGenericBindings(schema, metadata) {
  const clone = structuredClone(schema);
  for (const binding of metadata.bindings ?? []) {
    const parts = binding.path.split("/").slice(1).map(decodeJsonPointerPart);
    if (parts.length === 0) continue;
    let parent = clone;
    for (const part of parts.slice(0, -1)) {
      parent = parent?.[part];
      if (!parent || typeof parent !== "object") break;
    }
    if (!parent || typeof parent !== "object") continue;
    const finalPart = parts.at(-1);
    if (!Object.prototype.hasOwnProperty.call(parent, finalPart)) continue;
    parent[finalPart] = { "x-typedapi-generic-parameter": binding.parameter };
  }
  return clone;
}

function copySelectedProperties(schema, selectedProperties) {
  const selected = new Set(selectedProperties ?? []);
  const properties = Object.fromEntries(
    Object.entries(schema?.properties ?? {}).filter(([name]) => selected.has(name)),
  );
  const required = (schema?.required ?? []).filter((name) => selected.has(name));
  const result = {
    ...schemaWithoutComposition(schema),
    type: "object",
    properties,
  };
  delete result["x-typedapi-generic"];
  if (required.length > 0) result.required = required;
  else delete result.required;
  return result;
}

function removeSelectedProperties(schema, selectedProperties) {
  const selected = new Set(selectedProperties ?? []);
  const result = structuredClone(schemaWithoutComposition(schema));
  result.properties = Object.fromEntries(
    Object.entries(result.properties ?? {}).filter(([name]) => !selected.has(name)),
  );
  result.required = (result.required ?? []).filter((name) => !selected.has(name));
  delete result["x-typedapi-generic"];
  if (Object.keys(result.properties).length === 0) delete result.properties;
  if (result.required.length === 0) delete result.required;
  return result;
}

function hasOwnObjectMembers(schema) {
  return Object.keys(schema?.properties ?? {}).length > 0 || Boolean(schema?.additionalProperties);
}

function discriminatorMappings(schema) {
  const discriminator = schema?.discriminator;
  if (!discriminator?.propertyName) return [];
  const mapping = discriminator.mapping ?? {};
  const entries = Object.entries(mapping)
    .filter(([, ref]) => typeof ref === "string" && ref.includes("/"))
    .map(([value, ref]) => ({ propertyName: discriminator.propertyName, value, rawName: refName(ref) }));
  if (entries.length > 0) return entries;

  return (schema.oneOf ?? [])
    .filter((item) => item?.$ref)
    .map((item) => ({
      propertyName: discriminator.propertyName,
      value: refName(item.$ref),
      rawName: refName(item.$ref),
    }));
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
    this.genericSchemas = new Map();
    this.genericDefinitions = new Map();
    this.discriminatorProperties = new Map();
    this.polymorphicBases = new Map();
    const schemas = openApi.components?.schemas ?? {};
    const usedNames = new Set();

    const registerGenericDefinition = (normalized) => {
      const existing = this.genericDefinitions.get(normalized.definitionName);
      if (existing && existing.parameters.join("|") !== normalized.parameters.join("|")) {
        throw new Error(`Generic schemas for ${normalized.definitionName} use inconsistent type parameters.`);
      }
      if (existing && JSON.stringify(existing.bindings) !== JSON.stringify(normalized.bindings)) {
        throw new Error(`Generic schemas for ${normalized.definitionName} use inconsistent generic bindings.`);
      }
      if (existing && JSON.stringify(existing.base ?? null) !== JSON.stringify(normalized.base ?? null)) {
        throw new Error(`Generic schemas for ${normalized.definitionName} use inconsistent generic inheritance metadata.`);
      }
      if (!existing || (existing.synthetic && !normalized.synthetic)) {
        this.genericDefinitions.set(normalized.definitionName, normalized);
      }
      usedNames.add(normalized.definitionName);
    };

    for (const [rawName, schema] of Object.entries(schemas)) {
      const metadata = genericMetadata(schema);
      if (!metadata) continue;
      const definitionName = operationTypeName(metadata.definition);
      const normalized = { ...metadata, definitionName, rawName, synthetic: false };
      this.genericSchemas.set(rawName, normalized);
      registerGenericDefinition(normalized);
    }

    const resolveConcreteBaseArguments = (base, ownerMetadata) => {
      const ownerArguments = new Map(
        ownerMetadata.parameters.map((parameter, index) => [parameter, ownerMetadata.arguments[index]]),
      );
      return base.arguments.map((argument, index) => {
        const concrete = argument.genericParameter
          ? ownerArguments.get(argument.genericParameter)
          : argument;
        if (!concrete) {
          throw new Error(
            `Generic base ${base.definition} could not resolve argument ${base.parameters[index]}.`,
          );
        }
        const { parameter: _ignoredParameter, ...resolvedArgument } = concrete;
        return { parameter: base.parameters[index], ...resolvedArgument };
      });
    };

    const registerSyntheticBases = (ownerMetadata, sourceRawName) => {
      const base = ownerMetadata.base;
      if (!base) return;
      const definitionName = operationTypeName(base.definition);
      const normalized = {
        definition: base.definition,
        definitionName,
        parameters: base.parameters,
        arguments: resolveConcreteBaseArguments(base, ownerMetadata),
        bindings: base.bindings,
        base: base.base,
        rawName: sourceRawName,
        synthetic: true,
        syntheticProperties: base.properties,
      };
      registerGenericDefinition(normalized);
      registerSyntheticBases(normalized, sourceRawName);
    };

    for (const metadata of this.genericSchemas.values()) {
      registerSyntheticBases(metadata, metadata.rawName);
    }

    for (const rawName of Object.keys(schemas)) {
      if (this.genericSchemas.has(rawName)) continue;
      const name = uniqueName(operationTypeName(rawName), usedNames);
      this.componentNames.set(rawName, name);
    }

    for (const [rawBaseName, schema] of Object.entries(schemas)) {
      const mappings = discriminatorMappings(schema);
      if (mappings.length > 0) this.polymorphicBases.set(rawBaseName, mappings);
      for (const mapping of mappings) {
        const properties = this.discriminatorProperties.get(mapping.rawName) ?? new Map();
        const previous = properties.get(mapping.propertyName);
        if (previous !== undefined && previous !== mapping.value) {
          throw new Error(
            `Schema ${mapping.rawName} has conflicting discriminator values for ${mapping.propertyName}.`,
          );
        }
        properties.set(mapping.propertyName, mapping.value);
        this.discriminatorProperties.set(mapping.rawName, properties);
      }
    }
  }

  componentName(rawName) {
    return this.componentNames.get(rawName) ?? operationTypeName(rawName);
  }

  componentType(rawName, options = {}) {
    if (options.asInheritanceBase && this.polymorphicBases.has(rawName)) {
      return `${this.componentName(rawName)}Base`;
    }

    const metadata = this.genericSchemas.get(rawName);
    if (!metadata) return this.componentName(rawName);

    const argumentTypes = metadata.arguments.map((argument) => {
      if (argument?.primitive) return String(argument.primitive);
      if (argument?.schemaId) {
        const schemaId = String(argument.schemaId);
        return options.genericArgumentSubstitutions?.get(schemaId)
          ?? this.componentType(schemaId, options);
      }
      return "unknown";
    });
    return `${metadata.definitionName}<${argumentTypes.join(", ")}>`;
  }

  genericBaseType(base, ownerParameters) {
    const argumentTypes = base.arguments.map((argument) => {
      if (argument.genericParameter) return argument.genericParameter;
      if (argument.primitive) return argument.primitive;
      if (argument.schemaId) return this.componentType(argument.schemaId);
      return "unknown";
    });
    return `${operationTypeName(base.definition)}<${argumentTypes.join(", ")}>`;
  }

  isGenericBaseReference(item, base) {
    if (!item?.$ref) return false;
    const metadata = this.genericSchemas.get(refName(item.$ref));
    return metadata?.definitionName === operationTypeName(base.definition);
  }

  resolve(schemaOrRef, contextName = "Anonymous", options = {}) {
    if (!schemaOrRef) return "unknown";

    if (schemaOrRef.$ref) {
      dereference(this.openApi, schemaOrRef, "Schema reference");
      return this.componentType(refName(schemaOrRef.$ref), options);
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
    const genericParameter = schema?.["x-typedapi-generic-parameter"];
    if (genericParameter) return String(genericParameter);
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
        this.resolve(item, `${contextName}${index + 1}`, {
          ...options,
          asInheritanceBase: true,
        }),
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

  createInlineObjectType(schema, contextName, options = {}) {
    const base = operationTypeName(contextName);
    let name = base;
    let counter = 2;
    while (
      this.componentNamesHasValue(name) ||
      this.genericDefinitions.has(name) ||
      (this.inlineTypes.has(name) && this.inlineTypes.get(name).schema !== schema)
    ) {
      name = `${base}${counter++}`;
    }
    if (!this.inlineTypes.has(name)) this.inlineTypes.set(name, { schema, options });
    return name;
  }

  componentNamesHasValue(value) {
    return [...this.componentNames.values()].includes(value);
  }

  objectMembers(name, schema, options = {}) {
    const required = new Set(schema.required ?? []);
    const lines = [];

    const propertyEntries = Object.entries(schema.properties ?? {});
    const syntheticDiscriminators = options.rawName
      ? this.discriminatorProperties.get(options.rawName) ?? new Map()
      : new Map();
    assertUniqueTypePropertyNames(
      [...propertyEntries.map(([propertyName]) => propertyName), ...syntheticDiscriminators.keys()],
      name,
    );

    for (const [propertyName, propertySchema] of propertyEntries) {
      const localPropertyName = typePropertyName(propertyName);
      const discriminatorValue = syntheticDiscriminators.get(propertyName);
      const optionalToken = discriminatorValue !== undefined || required.has(propertyName) ? "" : "?";
      const propertyType = discriminatorValue !== undefined
        ? JSON.stringify(discriminatorValue)
        : this.resolve(propertySchema, `${name}${pascalCase(propertyName)}`, {
            ...options,
            inlineEnumAsUnion: true,
          });
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

    for (const [propertyName, value] of syntheticDiscriminators) {
      if (Object.prototype.hasOwnProperty.call(schema.properties ?? {}, propertyName)) continue;
      lines.push(`  ${propertyKey(typePropertyName(propertyName))}: ${JSON.stringify(value)};`);
    }

    if (schema.additionalProperties) {
      const valueType =
        schema.additionalProperties === true
          ? "unknown"
          : this.resolve(schema.additionalProperties, `${name}Value`, {
              ...options,
              inlineEnumAsUnion: true,
            });
      lines.push(`  [key: string]: ${valueType};`);
    }

    return lines;
  }

  createInterface(name, schema, options = {}) {
    return [
      `export interface ${name} {`,
      ...this.objectMembers(name, schema, options),
      "}",
    ].join("\n");
  }

  createObjectTypeLiteral(name, schema, options = {}) {
    return ["{", ...this.objectMembers(name, schema, options), "}"].join("\n");
  }

  createDeclaration(name, schema, options = {}) {
    if (Array.isArray(schema.enum)) return this.createEnum(name, schema);

    if (schema.oneOf || schema.anyOf) {
      const variants = schema.oneOf ?? schema.anyOf;
      const variantTypes = variants.map((item, index) =>
        this.resolve(item, `${name}${index + 1}`, { ...options, inlineEnumAsUnion: true }),
      );
      return `export type ${name} = ${unionTypes(variantTypes)};`;
    }

    if (schema.allOf) {
      const parts = schema.allOf.map((item, index) => {
        const resolvedItem = dereference(this.openApi, item, "allOf schema reference");
        if (!item?.$ref && hasObjectShape(resolvedItem) && !resolvedItem.allOf && !resolvedItem.oneOf && !resolvedItem.anyOf) {
          return this.createObjectTypeLiteral(`${name}${index + 1}`, resolvedItem, {
            ...options,
            rawName: undefined,
          });
        }
        return this.resolve(item, `${name}${index + 1}`, {
          ...options,
          inlineEnumAsUnion: true,
          asInheritanceBase: true,
        });
      });
      const localSchema = schemaWithoutComposition(schema);
      const hasSyntheticDiscriminator = options.rawName && this.discriminatorProperties.has(options.rawName);
      if (hasObjectShape(localSchema) || hasSyntheticDiscriminator)
        parts.push(this.createObjectTypeLiteral(`${name}Own`, localSchema, options));
      return `export type ${name} = ${intersectionTypes(parts)};`;
    }

    if (hasObjectShape(schema)) return this.createInterface(name, schema, options);
    return `export type ${name} = ${this.resolve(schema, name, { ...options, inlineEnumAsUnion: true })};`;
  }

  createGenericDeclaration(metadata, schema) {
    const substitutions = new Map();
    metadata.arguments.forEach((argument, index) => {
      if (argument?.schemaId) substitutions.set(String(argument.schemaId), metadata.parameters[index]);
    });
    const genericName = `${metadata.definitionName}<${metadata.parameters.join(", ")}>`;
    const templateSchema = cloneSchemaWithGenericBindings(schema, metadata);
    let declaration;

    if (metadata.base) {
      const inheritedProperties = new Set(metadata.base.properties ?? []);
      const ownSchema = removeSelectedProperties(templateSchema, inheritedProperties);
      const parts = [this.genericBaseType(metadata.base, metadata.parameters)];

      for (const [index, item] of (templateSchema.allOf ?? []).entries()) {
        if (this.isGenericBaseReference(item, metadata.base)) continue;
        const resolvedItem = dereference(this.openApi, item, "allOf schema reference");
        if (!item?.$ref && hasObjectShape(resolvedItem) && !resolvedItem.allOf && !resolvedItem.oneOf && !resolvedItem.anyOf) {
          const ownInlineSchema = removeSelectedProperties(resolvedItem, inheritedProperties);
          if (hasOwnObjectMembers(ownInlineSchema)) {
            parts.push(this.createObjectTypeLiteral(`${genericName}${index + 1}`, ownInlineSchema, {
              rawName: undefined,
              genericArgumentSubstitutions: substitutions,
            }));
          }
          continue;
        }
        parts.push(this.resolve(item, `${genericName}${index + 1}`, {
          inlineEnumAsUnion: true,
          genericArgumentSubstitutions: substitutions,
          asInheritanceBase: true,
        }));
      }

      if (hasOwnObjectMembers(ownSchema)) {
        parts.push(this.createObjectTypeLiteral(`${genericName}Own`, ownSchema, {
          rawName: metadata.rawName,
          genericArgumentSubstitutions: substitutions,
        }));
      }
      declaration = `export type ${genericName} = ${intersectionTypes(parts)};`;
    } else {
      declaration = this.createDeclaration(genericName, templateSchema, {
        rawName: metadata.rawName,
        genericArgumentSubstitutions: substitutions,
      });
    }

    const body = genericDeclarationBody(declaration);
    const unusedParameters = metadata.parameters.filter((parameter) =>
      !new RegExp(`\\b${escapeRegExp(parameter)}\\b`).test(body),
    );
    if (unusedParameters.length > 0) {
      throw new Error(
        `Generic schema ${metadata.rawName} declares unbound type parameter${unusedParameters.length === 1 ? "" : "s"} ` +
          `${unusedParameters.join(", ")}. Ensure x-typedapi-generic.bindings includes inherited or flattened generic properties.`,
      );
    }
    return declaration;
  }

  isPolymorphicBase(rawName) {
    return this.polymorphicBases.has(rawName);
  }

  createPolymorphicDeclarations(rawName, schema) {
    const name = this.componentName(rawName);
    const mappings = this.polymorphicBases.get(rawName) ?? [];
    const variants = mappings.map((mapping) => this.componentType(mapping.rawName));
    const { oneOf, anyOf, discriminator, ...baseSchema } = schema;
    const declarations = [];
    if (hasObjectShape(baseSchema) || baseSchema.allOf) {
      declarations.push(this.createDeclaration(`${name}Base`, baseSchema));
    } else {
      declarations.push(`export interface ${name}Base {}`);
    }
    declarations.push(`export type ${name} = ${unionTypes(variants)};`);
    return declarations;
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
  const filterForm = Boolean(operationInfo.operation["x-typedapi-filter-form"]);
  const isPureGeneratedQuery =
    (paginated || filterForm) &&
    parametersByLocation.query.length > 0 &&
    !parametersByLocation.path.length &&
    !parametersByLocation.header.length &&
    !parametersByLocation.cookie.length &&
    !bodyType;
  const parameterTypeNames = isPureGeneratedQuery
    ? { query: parameterTypeName(operationTypeNameBase, "query") }
    : {};

  return {
    operationId,
    operationTypeNameBase,
    originalOperationId: operationInfo.originalOperationId,
    methodName: operationInfo.methodName,
    methodNameSource: operationInfo.methodNameSource,
    paramsTypeName:
      hasNonBodyInput && !isPureGeneratedQuery
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
    filterFormMetadata: operationInfo.operation["x-typedapi-filter-form"],
  };
}

export function generateDataContracts(openApi, operations, options = {}) {
  const resolver = new TypeResolver(openApi, options);
  const declarations = [];
  const schemas = openApi.components?.schemas ?? {};

  const genericDefinitions = [...resolver.genericDefinitions.values()].sort((a, b) =>
    a.definitionName.localeCompare(b.definitionName),
  );
  for (const metadata of genericDefinitions) {
    const sourceSchema = dereference(
      openApi,
      schemas[metadata.rawName],
      "Generic component schema reference",
    );
    const schema = metadata.synthetic
      ? copySelectedProperties(sourceSchema, metadata.syntheticProperties)
      : sourceSchema;
    declarations.push(resolver.createGenericDeclaration(metadata, schema));
  }

  const entries = Object.entries(schemas).sort(([a], [b]) => a.localeCompare(b));
  for (const [rawName, schemaOrRef] of entries) {
    if (resolver.genericSchemas.has(rawName)) continue;
    const schema = dereference(openApi, schemaOrRef, "Component schema reference");
    if (resolver.isPolymorphicBase(rawName)) {
      declarations.push(...resolver.createPolymorphicDeclarations(rawName, schema));
      continue;
    }
    declarations.push(
      resolver.createDeclaration(resolver.componentName(rawName), schema, { rawName }),
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

  for (const [name, inline] of resolver.inlineTypes.entries()) {
    if (!resolver.componentNamesHasValue(name) && !resolver.genericDefinitions.has(name))
      declarations.push(resolver.createDeclaration(name, inline.schema, inline.options));
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
