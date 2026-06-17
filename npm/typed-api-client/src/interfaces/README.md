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
| `FilterFormValues<TQuery>` | interface | Describes one typed filter field and maps it to one or two keys of the query object.                                        |
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

## `FilterType`

`FilterType` describes the kind of value a filter form item contains.

Supported values are:

```ts
type FilterType =
  | "number"
  | "date"
  | "string"
  | "timespan"
  | "boolean"
  | "boolean-button"
  | "OptionValue";
```

## `OptionValue`

`OptionValue` is used for option-based filters where the UI displays a label but the API receives another value.

```ts
const status = {
  name: "Active",
  value: 1,
};
```

When an option list is passed to `buildQuery`, each selected option is converted to its `value`.

## `FilterFormValues<TQuery>`

`FilterFormValues<TQuery>` is used when `typedApiUseFilterFormValues` is enabled. Each item describes one UI filter and maps that filter to a property of the generated query type.

| Property        | Description                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------- |
| `name`          | Display name for the filter.                                                                  |
| `filterName`    | Query property that receives `value`.                                                         |
| `filterNameMax` | Optional query property that receives `maxValue`, useful for range filters.                   |
| `type`          | Filter input type.                                                                            |
| `value`         | Current filter value. Can be a primitive value, `Date`, `OptionValue[]`, `string[]`, or null. |
| `maxValue`      | Optional upper-bound value for range filters.                                                  |
| `isAList`       | Tells `buildQuery` to treat `value` as a list and map every item.                             |

Basic string filter:

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

Range filter using `filterNameMax` and `maxValue`:

```ts
const filters: FilterFormValues<GetOrdersQuery>[] = [
  {
    name: "Created date",
    filterName: "createdFrom",
    filterNameMax: "createdTo",
    type: "date",
    value: new Date("2026-01-01"),
    maxValue: new Date("2026-01-31"),
    isAList: false,
  },
];
```

Option list filter:

```ts
const filters: FilterFormValues<GetSuppliersQuery>[] = [
  {
    name: "Statuses",
    filterName: "statusIds",
    type: "OptionValue",
    value: [
      { name: "Active", value: 1 },
      { name: "Pending", value: 2 },
    ],
    isAList: true,
  },
];
```

## `SortType`

`SortType` is the UI sort state used by the sort conversion helpers.

```ts
type SortType = "Default" | "Neutral" | "Ascending" | "Descending";
```

`Neutral` is a UI-only state and is converted to `Default` before it is sent to the API.
