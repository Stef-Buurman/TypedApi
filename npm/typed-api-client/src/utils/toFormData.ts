export function toFormData<T extends object>(payload: T): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    appendFormDataValue(formData, key, value);
  }

  return formData;
}

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