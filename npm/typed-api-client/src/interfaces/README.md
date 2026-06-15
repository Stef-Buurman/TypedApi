# Interfaces

This folder contains public data shapes and unions that consumers use directly when working with generated API wrapper methods.

## Exports

| Export                     | Type      | Description                                                                                                                 |
| -------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ApiResult<T>`             | type      | Standard result wrapper returned by generated API wrapper methods. The `ok` property is the discriminator.                  |
| `ApiSuccessResult<T>`      | type      | Success-only branch of `ApiResult<T>`. Use it for success handlers or helper methods that only accept successful responses. |
| `ApiErrorResult<T>`        | type      | Error-only branch of `ApiResult<T>`. Use it for error handlers or helper methods that only accept failed responses.         |
| `FilterType`               | type      | Union of supported filter input types used by generated filter-form methods.                                                |
| `OptionValue`              | interface | Option item with a display `name` and submitted `value`.                                                                    |
| `FilterFormValues<TQuery>` | interface | Describes one typed filter field and maps it to a key of the query object.                                                  |
| `SortType`                 | type      | Sort state used by UI components: `Default`, `Neutral`, `Ascending`, or `Descending`.                                       |

## `ApiResult<T>`

`ApiResult<T>` is the main return type of generated wrapper methods.

```ts
const result = await getSuppliers({ pageNumber: 1, pageSize: 25 });

if (result.ok) {
  result.response;
} else {
  result.error;
}
```

## `ApiSuccessResult<T>` and `ApiErrorResult<T>`

Use these helper types when a function should receive only one branch of `ApiResult<T>`.

```ts
import type { ApiErrorResult, ApiSuccessResult } from "typedapi-client-helpers";

function success<T>(result: ApiSuccessResult<T>) {
  console.log(result.response);
}

function error<T>(result: ApiErrorResult<T>) {
  console.error(result.error);
}
```

## `FilterFormValues<TQuery>`

`FilterFormValues<TQuery>` is used when `typedApiUseFilterFormValues` is enabled. Each item describes one UI filter and maps that filter to a property of the generated query type.

```ts
const filters: FilterFormValues<GetSuppliersQuery>[] = [
  {
    name: "Name",
    filterName: "name",
    type: "string",
    value: "Example",
    isAList: false,
  },
];
```
