# Types

This folder contains public TypeScript helper types used by generated API wrapper methods.

## Callback types

| Export                          | Description                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `ApiSuccessHandler<TResponse>`  | Function type for success callbacks. Receives `ApiSuccessResult<TResponse>`.                           |
| `ApiErrorHandler<TResponse>`    | Function type for error callbacks. Receives `ApiErrorResult<TResponse>`.                               |
| `ApiMethodCallbacks<TResponse>` | Backwards-compatible object shape containing optional `onSuccess`, `onError`, and `params` properties. |

```ts
import type {
  ApiErrorHandler,
  ApiSuccessHandler,
} from "typedapi-client-helpers";

const onSuccess: ApiSuccessHandler<SupplierResponse> = (result) => {
  console.log(result.status, result.response);
};

const onError: ApiErrorHandler<SupplierResponse> = (result) => {
  console.error(result.status, result.error);
};
```

## Generated method option and argument types

Generated wrapper methods use a final options object instead of separate positional callback arguments.

| Export                                                | Description                                                                                                     |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `ApiMethodOptions<TResponse, TError, TRequestParams>` | Final options object used by generated wrapper methods. Contains optional `onSuccess`, `onError`, and `params`. |
| `ApiMethodArguments<TMethod, TRequestParams>`         | Extracts the generated method argument tuple without the trailing raw request-params argument.                  |
| `WithoutRequestParams<T>`                             | Removes a trailing optional `RequestParams` from an argument tuple. Kept as a smaller tuple helper.             |

The generated methods use `ApiMethodOptions` as their final argument.

```ts
await getSuppliers(
  { pageNumber: 1, pageSize: 25 },
  {
    onSuccess,
    onError,
    params: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  },
);
```

For non-query generated client methods, `ApiMethodArguments` keeps the original API arguments but removes the raw generated `RequestParams` parameter from the public wrapper signature.

```ts
type UpdateSupplierArguments = ApiMethodArguments<
  Supplier["updateSupplier"],
  RequestParams
>;
```

This lets the wrapper expose:

```ts
await updateSupplier(id, body, options);
```

instead of requiring consumers to call the raw generated shape directly.

## API method helper types

| Export                      | Description                                                                       |
| --------------------------- | --------------------------------------------------------------------------------- |
| `ExtractResponse<T>`        | Extracts the success response body type from a generated method promise.          |
| `ExtractError<T>`           | Extracts the error body type from a generated method promise.                     |
| `UnwrapArray<T>`            | Returns the item type when `T` is an array, otherwise returns `T`.                |
| `ExtractDataIfPaginated<T>` | Returns the item type from a common paginated response shape with a `data` array. |
| `SortableKeys<T>`           | Produces valid sort field keys for a response type or paginated response type.    |

Example:

```ts
import type {
  ExtractError,
  ExtractResponse,
  SortableKeys,
} from "typedapi-client-helpers";

import type { Supplier } from "./api/generated/Supplier";

type SupplierResponse = ExtractResponse<ReturnType<Supplier["getSuppliers"]>>;
type SupplierError = ExtractError<ReturnType<Supplier["getSuppliers"]>>;
type SupplierSortKey = SortableKeys<SupplierResponse>;
```

## HTTP types

| Export                 | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `HttpResponse<D, E>`   | Fetch `Response` extended with typed `data` and `error` properties. |
| `RuntimeRequestParams` | Runtime request options object forwarded to generated API methods.  |

`RuntimeRequestParams` is the default request-params type used by `ApiMethodOptions` and `ApiMethodArguments` when a generated `RequestParams` type is not provided explicitly.

## Complete example

```ts
import type {
  ApiErrorHandler,
  ApiMethodOptions,
  ApiSuccessHandler,
  ExtractError,
  ExtractResponse,
} from "typedapi-client-helpers";

import { getSuppliers } from "./api";
import type { Supplier } from "./api/generated/Supplier";
import type { RequestParams } from "./api/generated/http-client";

type SupplierResponse = ExtractResponse<ReturnType<Supplier["getSuppliers"]>>;
type SupplierError = ExtractError<ReturnType<Supplier["getSuppliers"]>>;

type SupplierOptions = ApiMethodOptions<
  SupplierResponse,
  SupplierError,
  RequestParams
>;

const onSuccess: ApiSuccessHandler<SupplierResponse> = (result) => {
  console.log(result.response);
};

const onError: ApiErrorHandler<SupplierResponse> = (result) => {
  console.error(result.error);
};

const options: SupplierOptions = {
  onSuccess,
  onError,
};

await getSuppliers({ pageNumber: 1, pageSize: 25 }, options);
```
