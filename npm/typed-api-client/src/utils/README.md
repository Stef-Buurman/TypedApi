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
| `ApiSortDirection`                    | type     | API sort direction union aligned with .NET: `Default`, `Neutral`, `Asc`, or `Desc` (legacy long names are accepted when reading).                                 |
| `sortTypes`                           | const    | Constant list of supported UI sort states.                                                         |
| `toFormData()`                        | function | Converts an object payload into `FormData`.                                                        |

## `buildQuery`

Use `buildQuery` to turn typed filter form values into a generated API query object.

```ts
const query = buildQuery(filters, 1, 25, "name", "Asc");
```

`buildQuery`:

- ignores `null`, `undefined`, empty-string, `"null"`, and `"undefined"` filter values;
- maps `OptionValue` filters to their submitted `value` fields;
- maps array filters item by item when `isAList` is true;
- writes `maxValue` to `filterNameMax` when a range filter is configured;
- appends `pageNumber`;
- appends `pageSize` when the provided page size is greater than `0`;
- adds `sortBy` and `sortDirection` when provided;
- converts date values to ISO strings;
- converts number values with `Number(value)`;
- converts boolean values with `Boolean(value)`.

Example with a range filter:

```ts
const query = buildQuery(
  [
    {
      name: "Created date",
      filterName: "createdFrom",
      filterNameMax: "createdTo",
      type: "date",
      value: new Date("2026-01-01"),
      maxValue: new Date("2026-01-31"),
      isAList: false,
    },
  ],
  1,
  25,
  "createdAt",
  "Desc",
);
```

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

`extractArgsToastsAndParams` is kept for backwards compatibility with older generated files that used toast-oriented naming. New generated code should use method options instead of positional callbacks.

It returns the same shape as `extractArgsCallbacksAndParams`:

```ts
{
  args,
  onSuccess,
  onError,
  params,
}
```

## `handleApiResponse`

Use `handleApiResponse` when wrapping a generated HTTP client method manually.

```ts
const result = await handleApiResponse(
  () => api.getSuppliers({ pageNumber: 1, pageSize: 25 }),
  { onSuccess, onError },
);
```

It converts successful responses, failed HTTP responses, thrown `Response` objects, and other thrown errors into the same `ApiResult<TResponse>` shape.

Successful responses return:

```ts
{
  ok: true,
  status,
  response,
}
```

Failed responses and thrown errors return:

```ts
{
  ok: false,
  status,
  error,
}
```

Empty response bodies and HTTP 204 responses are returned as `undefined`. JSON responses are parsed, and non-JSON responses are returned as text.

## Sort conversion helpers

Use `getSortTypeFromSortDirection` and `getSortDirectionFromSortType` when mapping between UI state and API sort direction values.

```ts
const sortType = getSortTypeFromSortDirection("Asc");
const sortDirection = getSortDirectionFromSortType(sortType);
```

`Neutral` is preserved for APIs that expose a neutral sort state.

Unknown, missing, or unsupported sort values safely fall back to `Default`.

## `toFormData`

Use `toFormData` for multipart request bodies.

```ts
const formData = toFormData({
  title: "Example",
  file,
  tags: ["a", "b"],
});
```

`toFormData` behavior:

- skips `null` and `undefined` values;
- appends arrays as repeated fields with the same key;
- keeps `File` names when appending files;
- appends `Blob` values directly;
- converts strings, numbers, and booleans to strings;
- JSON-stringifies nested objects.
