/**
 * Converts an object payload into `FormData`.
 *
 * Supports single files, file arrays, primitive values, and nested objects.
 * Arrays are appended as repeated fields with the same key.
 */
export function toFormData<T extends object>(payload: T): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    appendFormDataValue(formData, key, value);
  }

  return formData;
}

/**
 * Appends a single value to a `FormData` object.
 *
 * Files keep their filename, blobs are appended directly,
 * primitives are converted to strings, and objects are JSON-stringified.
 */
function appendFormDataValue(
  formData: FormData,
  key: string,
  value: unknown,
): void {
  if (value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendFormDataValue(formData, key, item);
    }

    return;
  }

  if (value instanceof File) {
    formData.append(key, value, value.name);
    return;
  }

  if (value instanceof Blob) {
    formData.append(key, value);
    return;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    formData.append(key, String(value));
    return;
  }

  formData.append(key, JSON.stringify(value));
}
