# Utilities

This folder contains runtime helper functions used by generated wrapper methods and available for direct use by package consumers.

## Exports

| Export                                | Kind     | Description                                                                                        |
| ------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `buildQuery<TQuery, TSortModel>()`    | function | Builds a query object from filter values, pagination, and sorting.                                 |
| `SortDirection`                       | type     | Sort direction value accepted by generated query objects. Supports string and numeric enum values. |
| `extractArgsCallbacksAndParams()`     | function | Backwards-compatible helper for older generated files that used positional callbacks.              |
| `extractArgsToastsAndParams()`        | function | Backwards-compatible argument extractor with the same callback/request-param behavior.             |
| `handleApiResponse()`                 | function | Executes a generated HTTP call and returns `ApiResult<TResponse>`.                                 |
| `HandleApiResponseOptions<TResponse>` | type     | Options object for `handleApiResponse`, containing optional success and error callbacks.           |
| `getSortTypeFromSortDirection()`      | function | Converts an API sort direction to a UI `SortType`.                                                 |
| `getSortDirectionFromSortType()`      | function | Converts a UI `SortType` to an API sort direction.                                                 |
| `ApiSortDirection`                    | type     | API sort direction union: `Default`, `Ascending`, or `Descending`.                                 |
| `sortTypes`                           | const    | Constant list of supported UI sort states.                                                         |
| `toFormData()`                        | function | Converts an object payload into `FormData`.                                                        |

## `buildQuery`

Use `buildQuery` to turn typed filter form values into a generated API query object.

```ts
const query = buildQuery(filters, 1, 25, "name", "Ascending");
```

`buildQuery`:

- ignores empty `null`, `undefined`, and empty-string values;
- maps option filters to their submitted `value` fields;
- appends `pageNumber` and, when enabled, `pageSize`;
- adds `sortBy` and `sortDirection` when provided;
- converts date, number, and boolean values to API-friendly values.

## Method options in generated wrappers

New generated wrapper methods use a final method options object instead of separate positional callback arguments.

```ts
await getSuppliers(
  { pageNumber: 1, pageSize: 25 },
  {
    onSuccess,
    onError,
    params: { headers },
  },
);
```

The generated wrapper passes `onSuccess` and `onError` to `handleApiResponse`, and forwards `params` to the raw generated HTTP client.

## `extractArgsCallbacksAndParams`

`extractArgsCallbacksAndParams` is kept for backwards compatibility with older generated files that used positional callback arguments.

Older generated files could call methods like this:

```ts
await updateSupplier(id, body, onSuccess, onError, { headers });
```

`extractArgsCallbacksAndParams` separates that tuple into:

```ts
{
  args,
  onSuccess,
  onError,
  params,
}
```

New generated wrapper methods should use the method options object instead.

## `extractArgsToastsAndParams`

`extractArgsToastsAndParams` is kept for backwards compatibility with older generated files. New generated code should use method options instead of positional callbacks.

## `handleApiResponse`

Use `handleApiResponse` when wrapping a generated HTTP client method manually.

```ts
const result = await handleApiResponse(
  () => api.getSuppliers({ pageNumber: 1, pageSize: 25 }),
  { onSuccess, onError },
);
```

It converts successful responses, failed HTTP responses, and thrown errors into the same `ApiResult<TResponse>` shape.

## Sort conversion helpers

Use `getSortTypeFromSortDirection` and `getSortDirectionFromSortType` when mapping between UI state and API sort direction values.

```ts
const sortType = getSortTypeFromSortDirection("Ascending");
const sortDirection = getSortDirectionFromSortType(sortType);
```

`Neutral` is a UI-only state and is sent to the API as `Default`.

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
