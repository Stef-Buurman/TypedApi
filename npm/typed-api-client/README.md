# typedapi-client-helpers

`typedapi-client-helpers` generates a typed TypeScript API client from an OpenAPI/Swagger document and adds reusable helper types and functions for API results, callbacks, filtering, sorting, request parameters, and multipart uploads.

The package is meant for frontend projects that want a generated API client while still keeping the generated files inside their own source tree.

## Installation

```bash
npm install typedapi-client-helpers
```

## Basic usage

Add a generator script to your project:

```json
{
  "scripts": {
    "generate:api": "typedapi-generate"
  }
}
```

Run the generator:

```bash
npm run generate:api
```

By default the generator reads the Swagger document from `https://localhost:7000/swagger/v1/swagger.json` and writes the generated API client to `src/api`.

## Configuration

Configuration can be supplied in the `config` section of your `package.json`, with environment variables, or with npm command-line arguments.

### Package configuration

```json
{
  "config": {
    "swaggerUrl": "https://localhost:7000/swagger/v1/swagger.json",
    "swaggerFile": "swagger/openapi.json",
    "apiOutput": "src/api",
    "typedApiUseTypeOnlyImports": true,
    "typedApiUseFilterFormValues": false,
    "typedApiDefaultFunctionsPath": "../../defaultApiFunctions",
    "typedApiDefaultSuccessHandler": "handleGoodResult",
    "typedApiDefaultErrorHandler": "handleErrors"
  }
}
```

`swaggerFile` takes precedence over `swaggerUrl` when both are configured.

### Configuration options

| Option                          | Default                                          | Description                                                                                                                    |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `swaggerUrl`                    | `https://localhost:7000/swagger/v1/swagger.json` | URL of the OpenAPI/Swagger document.                                                                                           |
| `swaggerFile`                   | none                                             | Local path to an OpenAPI/Swagger document. When set, this is used instead of `swaggerUrl`.                                     |
| `apiOutput`                     | `src/api`                                        | Directory where the generated API files are written.                                                                           |
| `typedApiUseTypeOnlyImports`    | `false`                                          | Generates `import type` statements for imports that are only used as types.                                                    |
| `typedApiUseFilterFormValues`   | `false`                                          | Generates paginated methods that accept `FilterFormValues[]`, page values, and sort values instead of a prebuilt query object. |
| `typedApiDefaultFunctionsPath`  | `../../defaultApiFunctions`                      | Import path used by generated method files for shared success and error handlers.                                              |
| `typedApiDefaultSuccessHandler` | `handleGoodResult`                               | Name of the default success handler function imported into generated methods.                                                  |
| `typedApiDefaultErrorHandler`   | `handleErrors`                                   | Name of the default error handler function imported into generated methods.                                                    |

### Environment variables

| Environment variable               | Description                                                     |
| ---------------------------------- | --------------------------------------------------------------- |
| `SWAGGER_URL`                      | URL of the OpenAPI/Swagger document.                            |
| `SWAGGER_FILE`                     | Local path to an OpenAPI/Swagger document.                      |
| `API_OUTPUT`                       | Directory where generated API files are written.                |
| `TYPED_API_USE_TYPE_ONLY_IMPORTS`  | Enables type-only imports when set to `true`.                   |
| `TYPED_API_USE_FILTER_FORM_VALUES` | Enables filter-form based paginated methods when set to `true`. |

Example:

```bash
SWAGGER_URL=https://localhost:7000/swagger/v1/swagger.json npm run generate:api
```

### Command-line npm config

```bash
npm run generate:api --swagger-url=https://localhost:7000/swagger/v1/swagger.json
npm run generate:api --swagger-file=swagger/openapi.json
npm run generate:api --api-output=src/api
```

## Generated structure

Running the generator creates a structure similar to this:

```text
src/
└── api/
    ├── generated/
    │   ├── data-contracts.ts
    │   ├── http-client.ts
    │   ├── Product.ts
    │   └── Supplier.ts
    ├── methods/
    │   ├── Product.api.ts
    │   └── Supplier.api.ts
    └── index.ts
```

| Folder or file           | Description                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `generated/`             | Raw client, models, route classes, and HTTP client generated by `swagger-typescript-api`.                       |
| `methods/`               | Typed wrapper methods generated by this package. These call the raw generated client and return `ApiResult<T>`. |
| `index.ts`               | Barrel file that exports generated contracts, HTTP client types, and wrapper methods.                           |
| `defaultApiFunctions.ts` | Optional shared success and error handlers created when the configured default handler file does not exist.     |

## Calling generated methods

Generated wrapper methods return `ApiResult<T>`.

```ts
import { getSuppliers } from "./api";

const result = await getSuppliers({
  pageNumber: 1,
  pageSize: 25,
});

if (result.ok) {
  console.log(result.response);
} else {
  console.error(result.status, result.error);
}
```

Checking `result.ok` narrows the result automatically.

## Success and error callbacks

Callbacks receive the full result object, not just the raw response or error.

```ts
import type { ApiErrorResult, ApiSuccessResult } from "typedapi-client-helpers";
import { getSuppliers, type SupplierListResponse } from "./api";

function onSuccess(result: ApiSuccessResult<SupplierListResponse>) {
  console.log(result.status, result.response);
}

function onError(result: ApiErrorResult<SupplierListResponse>) {
  console.error(result.status, result.error);
}

await getSuppliers({ pageNumber: 1, pageSize: 25 }, onSuccess, onError);
```

The generated method still returns `ApiResult<T>` after callbacks run.

## Custom request parameters

The final wrapper argument can contain request parameters supported by the generated HTTP client.

```ts
const result = await getSuppliers(
  { pageNumber: 1, pageSize: 25 },
  undefined,
  undefined,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);
```

## Filter-form generation

Set `typedApiUseFilterFormValues` to `true` to generate paginated methods that accept filter form values.

```json
{
  "config": {
    "typedApiUseFilterFormValues": true
  }
}
```

Example:

```ts
import type { FilterFormValues } from "typedapi-client-helpers";
import { getSuppliers, type GetSuppliersQuery } from "./api";

const filters: FilterFormValues<GetSuppliersQuery>[] = [
  {
    name: "Supplier name",
    filterName: "name",
    type: "string",
    value: "Example",
    isAList: false,
  },
];

const result = await getSuppliers(filters, 1, 25, "name", "Ascending");
```

Empty filter values are ignored by `buildQuery`.

## Multipart uploads

Generated methods that need multipart bodies can use `toFormData` internally. You can also use it directly:

```ts
import { toFormData } from "typedapi-client-helpers";

const body = toFormData({
  name: "Manual",
  file,
  tags: ["docs", "public"],
});
```

Arrays are appended as repeated fields, files keep their filename, primitives become strings, and nested objects are JSON-stringified.

## Public API reference

### Result types

| Export                | Description                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| `ApiResult<T>`        | Discriminated union returned by generated wrapper methods. Contains either a success branch or an error branch. |
| `ApiSuccessResult<T>` | Success-only branch of `ApiResult<T>`. Useful for success callbacks and helper functions.                       |
| `ApiErrorResult<T>`   | Error-only branch of `ApiResult<T>`. Useful for error callbacks and helper functions.                           |

### Filter and sort types

| Export                     | Description                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `FilterType`               | Union of supported filter input types: number, date, string, timespan, boolean, boolean-button, and OptionValue. |
| `OptionValue`              | Option object with a display `name` and submitted `value`.                                                       |
| `FilterFormValues<TQuery>` | Configuration object for one filter field mapped to a query property.                                            |
| `SortType`                 | UI sort state: Default, Neutral, Ascending, or Descending.                                                       |
| `SortDirection`            | Sort direction value accepted by generated query objects. Supports string or number values.                      |
| `ApiSortDirection`         | Sort direction values accepted by the generated API: Default, Ascending, or Descending.                          |
| `sortTypes`                | Constant list of all supported UI sort states.                                                                   |

### Callback and method types

| Export                          | Description                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `ApiSuccessHandler<TResponse>`  | Callback type for successful API results.                                                    |
| `ApiErrorHandler<TResponse>`    | Callback type for failed API results.                                                        |
| `ApiMethodCallbacks<TResponse>` | Object shape for optional success callback, error callback, and request params.              |
| `ExtractResponse<T>`            | Extracts the response body type from a generated method promise.                             |
| `ExtractError<T>`               | Extracts the error body type from a generated method promise.                                |
| `UnwrapArray<T>`                | Extracts the item type from an array, otherwise keeps the original type.                     |
| `ExtractDataIfPaginated<T>`     | Extracts the item type from a `{ data?: T[] }` paginated response.                           |
| `SortableKeys<T>`               | Produces keys that can be used as sortable fields for a response type.                       |
| `WithoutRequestParams<T>`       | Removes a trailing optional `RequestParams` argument from a generated method argument tuple. |

### HTTP types

| Export                 | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `HttpResponse<D, E>`   | Extended fetch `Response` with typed `data` and `error` properties. |
| `RuntimeRequestParams` | Runtime request options object forwarded to generated API methods.  |

### Utility functions

| Export                             | Description                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `buildQuery<TQuery, TSortModel>()` | Builds a query object from filter form values, page values, and sort values.                                     |
| `extractArgsCallbacksAndParams()`  | Splits wrapper arguments into original API arguments, success callback, error callback, and request params.      |
| `extractArgsToastsAndParams()`     | Backwards-compatible alias-style extractor for wrapper arguments with success/error handlers and request params. |
| `handleApiResponse()`              | Executes a generated API call and converts the response or thrown error into `ApiResult<T>`.                     |
| `getSortTypeFromSortDirection()`   | Converts an API sort direction into a UI `SortType`.                                                             |
| `getSortDirectionFromSortType()`   | Converts a UI `SortType` into an API sort direction.                                                             |
| `toFormData()`                     | Converts an object payload into `FormData`.                                                                      |

### Default callback functions

| Export                  | Description                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `handleGoodResult<T>()` | Default success handler template created for generated projects. It can be customized by the consumer. |
| `handleErrors<T>()`     | Default error handler template created for generated projects. It can be customized by the consumer.   |

## Folder documentation

Additional README files are included in these folders:

| File                       | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| `src/interfaces/README.md` | Documents exported interfaces and result/filter/sort types. |
| `src/types/README.md`      | Documents helper types used by generated wrapper methods.   |
| `src/utils/README.md`      | Documents runtime helper functions.                         |
| `scripts/README.md`        | Documents the API generator script.                         |
| `bin/README.md`            | Documents the command-line entry point.                     |

## Build the package

```bash
npm run build
```

## Generate an API client while developing this package

```bash
npm run generate:api
```

## Notes

Generated files inside `src/api` and `dist/api` depend on the Swagger document used during generation. Their exact method names, model names, and route files will change when the OpenAPI document changes.
