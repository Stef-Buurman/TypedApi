/** Describes how generated TypeScript member names map to OpenAPI wire names. */
export type WireSchema =
  | { readonly kind: "identity" }
  | { readonly kind: "ref"; readonly ref: string }
  | { readonly kind: "array"; readonly items?: WireSchema }
  | {
      readonly kind: "object";
      readonly properties?: Readonly<Record<string, WireProperty>>;
      readonly additionalProperties?: true | WireSchema;
    }
  | { readonly kind: "allOf"; readonly schemas: readonly WireSchema[] }
  | { readonly kind: "union"; readonly schemas: readonly WireSchema[] };

export type WireProperty = {
  readonly wireName: string;
  readonly schema?: WireSchema;
};

export type WireSchemaRegistry = Readonly<Record<string, WireSchema>>;

type Direction = "toWire" | "fromWire";

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isMappableObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  if (value instanceof Date || isFile(value) || isBlob(value) || isFormData(value)) return false;
  return true;
}

function resolveSchema(
  schema: WireSchema | undefined,
  registry: WireSchemaRegistry,
): Exclude<WireSchema, { readonly kind: "ref" }> | undefined {
  let current = schema;
  const visited = new Set<string>();
  while (current?.kind === "ref") {
    if (visited.has(current.ref)) return { kind: "identity" };
    visited.add(current.ref);
    current = registry[current.ref] ?? { kind: "identity" };
  }
  return current;
}

function mergeObjectSchemas(
  schema: WireSchema,
  registry: WireSchemaRegistry,
  visitedRefs = new Set<string>(),
): Extract<WireSchema, { kind: "object" }> | undefined {
  if (schema.kind === "ref") {
    if (visitedRefs.has(schema.ref)) return undefined;
    const nextVisited = new Set(visitedRefs);
    nextVisited.add(schema.ref);
    const resolved = registry[schema.ref];
    return resolved ? mergeObjectSchemas(resolved, registry, nextVisited) : undefined;
  }

  if (schema.kind === "object") return schema;
  if (schema.kind !== "allOf" && schema.kind !== "union") return undefined;

  const properties: Record<string, WireProperty> = {};
  let additionalProperties: true | WireSchema | undefined;
  let foundObject = false;

  for (const part of schema.schemas) {
    const objectPart = mergeObjectSchemas(part, registry, visitedRefs);
    if (!objectPart) continue;
    foundObject = true;
    Object.assign(properties, objectPart.properties ?? {});
    if (objectPart.additionalProperties !== undefined) {
      additionalProperties = objectPart.additionalProperties;
    }
  }

  return foundObject
    ? { kind: "object", properties, ...(additionalProperties !== undefined ? { additionalProperties } : {}) }
    : undefined;
}

function mapValue(
  value: unknown,
  schema: WireSchema | undefined,
  registry: WireSchemaRegistry,
  direction: Direction,
  seen: WeakMap<object, unknown>,
): unknown {
  if (value === null || value === undefined || !schema) return value;

  const resolved = resolveSchema(schema, registry);
  if (!resolved || resolved.kind === "identity") return value;

  if (resolved.kind === "array") {
    if (!Array.isArray(value)) return value;
    const existing = seen.get(value);
    if (existing) return existing;
    const output: unknown[] = [];
    seen.set(value, output);
    for (const item of value) {
      output.push(mapValue(item, resolved.items, registry, direction, seen));
    }
    return output;
  }

  if (resolved.kind === "allOf" || resolved.kind === "union") {
    const merged = mergeObjectSchemas(resolved, registry);
    if (merged) return mapValue(value, merged, registry, direction, seen);
    return value;
  }

  if (!isMappableObject(value)) return value;
  const existing = seen.get(value);
  if (existing) return existing;

  const output: Record<string, unknown> = {};
  seen.set(value, output);
  const properties = resolved.properties ?? {};
  const byWireName = new Map(
    Object.entries(properties).map(([localName, property]) => [property.wireName, [localName, property] as const]),
  );

  for (const [inputName, inputValue] of Object.entries(value)) {
    const propertyEntry = direction === "toWire"
      ? properties[inputName]
        ? [inputName, properties[inputName]] as const
        : undefined
      : byWireName.get(inputName);

    if (propertyEntry) {
      const [localName, property] = propertyEntry;
      const outputName = direction === "toWire" ? property.wireName : localName;
      output[outputName] = mapValue(inputValue, property.schema, registry, direction, seen);
      continue;
    }

    const additionalSchema = resolved.additionalProperties === true
      ? undefined
      : resolved.additionalProperties;
    output[inputName] = mapValue(inputValue, additionalSchema, registry, direction, seen);
  }

  return output;
}

/** Converts generated lower-first member names to their exact OpenAPI wire names. */
export function toWireValue<T>(
  value: T,
  schema: WireSchema | undefined,
  registry: WireSchemaRegistry = {},
): unknown {
  return mapValue(value, schema, registry, "toWire", new WeakMap());
}

/** Converts exact OpenAPI wire names to generated lower-first member names. */
export function fromWireValue<T>(
  value: T,
  schema: WireSchema | undefined,
  registry: WireSchemaRegistry = {},
): unknown {
  return mapValue(value, schema, registry, "fromWire", new WeakMap());
}
