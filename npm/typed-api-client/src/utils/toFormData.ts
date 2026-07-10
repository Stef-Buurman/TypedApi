/**
 * Converts an object payload into `FormData`.
 *
 * Supports single files, file arrays, primitive values, dates, and nested
 * objects. Arrays are appended as repeated fields with the same key.
 *
 * @throws {Error} when `FormData` is unavailable in the current runtime.
 */
export function toFormData<T extends object>(payload: T): FormData {
  if (typeof FormData === "undefined") {
    throw new Error(
      "FormData is not available in this runtime. Provide a FormData polyfill or use a runtime with the Fetch API.",
    );
  }

  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    appendFormDataValue(formData, key, value);
  }

  return formData;
}

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

/** Appends a single value to a `FormData` object. */
function appendFormDataValue(
  formData: FormData,
  key: string,
  value: unknown,
): void {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    for (const item of value) appendFormDataValue(formData, key, item);
    return;
  }

  if (isFile(value)) {
    formData.append(key, value, value.name);
    return;
  }

  if (isBlob(value)) {
    formData.append(key, value);
    return;
  }

  if (value instanceof Date) {
    formData.append(key, value.toISOString());
    return;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    formData.append(key, String(value));
    return;
  }

  formData.append(key, JSON.stringify(value));
}
