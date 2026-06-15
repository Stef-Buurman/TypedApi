# Utilities

This folder contains runtime helper functions used by the generated wrapper methods and available for direct use by consumers.

## Exports

| Export                                | Description                                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `buildQuery<TQuery, TSortModel>()`    | Builds a query object from filter values, pagination, and sorting.                                          |
| `extractArgsCallbacksAndParams()`     | Splits wrapper arguments into original API arguments, success callback, error callback, and request params. |
| `extractArgsToastsAndParams()`        | Backwards-compatible argument extractor with the same callback/request-param behavior.                      |
| `handleApiResponse()`                 | Executes a generated HTTP call and returns `ApiResult<TResponse>`.                                          |
| `HandleApiResponseOptions<TResponse>` | Options object for `handleApiResponse`, containing optional success and error callbacks.                    |
| `getSortTypeFromSortDirection()`      | Converts an API sort direction to a UI `SortType`.                                                          |
| `getSortDirectionFromSortType()`      | Converts a UI `SortType` to an API sort direction.                                                          |
| `ApiSortDirection`                    | API sort direction union: `Default`, `Ascending`, or `Descending`.                                          |
| `sortTypes`                           | Constant list of supported UI sort states.                                                                  |
| `SortDirection`                       | Sort direction value accepted by generated query objects.                                                   |
| `toFormData()`                        | Converts an object payload into `FormData`.                                                                 |

## `buildQuery`

Use `buildQuery` to turn filter form values into a query object.

```ts
const query = buildQuery(filters, 1, 25, "name", "Ascending");
```

It ignores empty values, adds `pageNumber`, optionally adds `pageSize`, and adds sort fields when provided.

## `handleApiResponse`

Use `handleApiResponse` when wrapping a generated HTTP client method manually.

```ts
const result = await handleApiResponse(
  () => api.getSuppliers({ pageNumber: 1, pageSize: 25 }),
  { onSuccess, onError },
);
```

## `toFormData`

Use `toFormData` for multipart request bodies.

```ts
const formData = toFormData({
  title: "Example",
  file,
  tags: ["a", "b"],
});
```

Files keep their filename, arrays are appended as repeated fields, primitives become strings, and objects are JSON-stringified.
