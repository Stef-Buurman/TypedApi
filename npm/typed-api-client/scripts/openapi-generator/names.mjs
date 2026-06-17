const reservedWords = new Set([
  "abstract",
  "any",
  "as",
  "asserts",
  "async",
  "await",
  "boolean",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "constructor",
  "continue",
  "debugger",
  "declare",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "get",
  "if",
  "implements",
  "import",
  "in",
  "infer",
  "instanceof",
  "interface",
  "is",
  "keyof",
  "let",
  "module",
  "namespace",
  "never",
  "new",
  "null",
  "number",
  "object",
  "of",
  "package",
  "private",
  "protected",
  "public",
  "readonly",
  "require",
  "return",
  "set",
  "static",
  "string",
  "super",
  "switch",
  "symbol",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "unique",
  "unknown",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

export function pascalCase(value, fallback = "Anonymous") {
  const text = String(value ?? "").trim();
  const parts = text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);

  const name = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  return name || fallback;
}

export function camelCase(value, fallback = "value") {
  const pascal = pascalCase(value, pascalCase(fallback));
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function lowerFirst(value) {
  const text = String(value ?? "");
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function sanitizeIdentifier(value, fallback = "value") {
  let name = String(value ?? "").replace(/[^A-Za-z0-9_$]/g, "_");

  if (!name) {
    name = fallback;
  }

  if (/^[0-9]/.test(name)) {
    name = `_${name}`;
  }

  if (reservedWords.has(name)) {
    name = `${name}_`;
  }

  return name;
}

export function propertyKey(value) {
  const name = String(value ?? "");

  if (/^[$A-Z_a-z][$\w]*$/.test(name) && !reservedWords.has(name)) {
    return name;
  }

  return JSON.stringify(name);
}

export function refName(ref) {
  return decodeURIComponent(String(ref).split("/").pop() ?? "");
}

export function uniqueName(baseName, usedNames) {
  let name = baseName;
  let counter = 2;

  while (usedNames.has(name)) {
    name = `${baseName}${counter}`;
    counter += 1;
  }

  usedNames.add(name);
  return name;
}
