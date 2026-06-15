# Types

This folder contains public TypeScript helper types used by generated API wrapper methods.

## Callback types

| Export                          | Description                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `ApiSuccessHandler<TResponse>`  | Function type for success callbacks. Receives `ApiSuccessResult<TResponse>`.      |
| `ApiErrorHandler<TResponse>`    | Function type for error callbacks. Receives `ApiErrorResult<TResponse>`.          |
| `ApiMethodCallbacks<TResponse>` | Object shape containing optional `onSuccess`, `onError`, and `params` properties. |

## API method helper types

| Export                      | Description                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `ExtractResponse<T>`        | Extracts the success response body type from a generated method promise.            |
| `ExtractError<T>`           | Extracts the error body type from a generated method promise.                       |
| `UnwrapArray<T>`            | Returns the item type when `T` is an array, otherwise returns `T`.                  |
| `ExtractDataIfPaginated<T>` | Returns the item type from a common paginated response shape with a `data` array.   |
| `SortableKeys<T>`           | Produces valid sort field keys for a response type or paginated response type.      |
| `WithoutRequestParams<T>`   | Removes a trailing optional `RequestParams` from a generated method argument tuple. |

## HTTP types

| Export                 | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `HttpResponse<D, E>`   | Fetch `Response` extended with typed `data` and `error` properties. |
| `RuntimeRequestParams` | Runtime request options object forwarded to generated API methods.  |

## Example

```ts
import type {
  ApiErrorHandler,
  ApiSuccessHandler,
  ExtractResponse,
} from "typedapi-client-helpers";

import { getSuppliers } from "./api";

type SupplierResponse = ExtractResponse<ReturnType<typeof getSuppliers>>;

const onSuccess: ApiSuccessHandler<SupplierResponse> = (result) => {
  console.log(result.response);
};

const onError: ApiErrorHandler<SupplierResponse> = (result) => {
  console.error(result.error);
};
```
