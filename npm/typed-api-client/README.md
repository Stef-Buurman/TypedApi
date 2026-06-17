# typedapi-client-helpers

`typedapi-client-helpers` generates a typed TypeScript API client from an OpenAPI/Swagger document and adds reusable helper types and functions for API results, callbacks, filtering, sorting, request parameters, and multipart uploads.

The package is intended for frontend projects that want a generated API client while still keeping generated files inside their own source tree.

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

By default, the generator first looks for a local `swagger/swagger.json` file in the project where the command is run. If that file is not available, it tries `https://localhost:7000/swagger/v1/swagger.json` and stores a validated backup copy for later runs.

You can also run the command directly:

```bash
npx typedapi-generate
```

## Configuration

Configuration can be supplied in the `config` section of your `package.json`, with environment variables, or with npm command-line arguments.

Configuration is resolved in this order:

1. environment variables;
2. npm command-line config values;
3. the consuming project's `package.json` config;
4. this package's default config values;
5. built-in fallbacks.

### Package configuration

```json
{
  "config": {
    "swaggerUrl": "https://localhost:7000/swagger/v1/swagger.json",
    "swaggerFile": "swagger/openapi.json",
    "typedApiSwaggerBackupFile": "swagger/swagger.backup.json",
    "apiOutput": "src/api",
    "typedApiUseTypeOnlyImports": true,
    "typedApiUseFilterFormValues": false,
    "typedApiDefaultFunctionsPath": "src/defaultApiFunctions",
    "typedApiDefaultSuccessHandler": "handleGoodResult",
    "typedApiDefaultErrorHandler": "handleErrors"
  }
}
```

`swaggerFile` takes precedence over `swaggerUrl` when both are configured.

### OpenAPI input and backup behavior

The generator resolves the OpenAPI/Swagger input as follows:

1. If `swaggerFile` is configured and the file exists, that file is used and copied to the backup file.
2. If `swaggerFile` is configured but missing, the generator uses the backup file when it exists. If no backup exists, generation fails.
3. If `swaggerUrl` is configured, the generator downloads it, validates that the response is JSON, writes it to the backup file, and generates from that backup copy.
4. If `swaggerUrl` is configured but unavailable, the generator uses the backup file when it exists. If no backup exists, generation fails.
5. If neither `swaggerFile` nor `swaggerUrl` is configured, the generator tries `swagger/swagger.json` in the current project.
6. If no local default file exists, the generator tries `https://localhost:7000/swagger/v1/swagger.json` and falls back to the backup file if the URL is unavailable.

The backup prevents a temporary unavailable Swagger endpoint from breaking generation when a valid backup was created earlier.

The backup path is resolved relative to this package root. In local package development, that is the `typed-api-client` folder. In an installed consumer project, it is the installed `typedapi-client-helpers` package folder.

### Configuration options

| Option                          | Default                                          | Description                                                                                                                    |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `swaggerUrl`                    | `https://localhost:7000/swagger/v1/swagger.json` | URL of the OpenAPI/Swagger document. Used when no configured or default local file is available.                               |
| `swaggerFile`                   | none                                             | Local path to an OpenAPI/Swagger document. When set, this is used before `swaggerUrl`.                                         |
| `typedApiSwaggerBackupFile`     | `swagger/swagger.backup.json`                    | Backup file used to store the last valid Swagger document and as a fallback when the configured input is unavailable.          |
| `apiOutput`                     | `src/api`                                        | Directory where the generated API files are written.                                                                           |
| `typedApiUseTypeOnlyImports`    | `false`                                          | Generates `import type` statements for imports that are only used as types.                                                    |
| `typedApiUseFilterFormValues`   | `false`                                          | Generates paginated methods that accept `FilterFormValues[]`, page values, and sort values instead of a prebuilt query object. |
| `typedApiDefaultFunctionsPath`  | `defaultApiFunctions`                            | Import path used by generated method files for shared success and error handlers. Creates the file when it does not exist.     |
| `typedApiDefaultSuccessHandler` | `handleGoodResult`                               | Name of the default success handler function imported into generated methods.                                                  |
| `typedApiDefaultErrorHandler`   | `handleErrors`                                   | Name of the default error handler function imported into generated methods.                                                    |

### Environment variables

| Environment variable                | Description                                        |
| ----------------------------------- | -------------------------------------------------- |
| `SWAGGER_URL`                       | URL of the OpenAPI/Swagger document.               |
| `SWAGGER_FILE`                      | Local path to an OpenAPI/Swagger document.         |
| `TYPED_API_SWAGGER_BACKUP_FILE`     | Path of the Swagger backup file.                   |
| `API_OUTPUT`                        | Directory where generated API files are written.   |
| `TYPED_API_USE_TYPE_ONLY_IMPORTS`   | Enables type-only imports when set to `true`.      |
| `TYPED_API_USE_FILTER_FORM_VALUES`  | Enables filter-form based paginated methods.       |
| `TYPED_API_DEFAULT_FUNCTIONS_PATH`  | Path to the shared default callback handler file.  |
| `TYPED_API_DEFAULT_SUCCESS_HANDLER` | Export name of the shared default success handler. |
| `TYPED_API_DEFAULT_ERROR_HANDLER`   | Export name of the shared default error handler.   |

Example:

```bash
SWAGGER_URL=https://localhost:7000/swagger/v1/swagger.json npm run generate:api
```

### Command-line npm config

```bash
npm run generate:api --swagger-url=https://localhost:7000/swagger/v1/swagger.json
npm run generate:api --swagger-file=swagger/openapi.json
npm run generate:api --typed-api-swagger-backup-file=swagger/swagger.backup.json
npm run generate:api --api-output=src/api
npm run generate:api --typed-api-use-filter-form-values=true
npm run generate:api --typed-api-use-type-only-imports=true
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

| Folder or file           | Description                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `generated/`             | Raw client, models, and HTTP client generated by `swagger-typescript-api`. Route type files are removed after generation. |
| `methods/`               | Typed wrapper methods generated by this package. These call the raw generated client and return `ApiResult<T>`.           |
| `index.ts`               | Barrel file that exports generated contracts, HTTP client types, and wrapper methods.                                     |
| `defaultApiFunctions.ts` | Optional shared success and error handlers created when the configured default handler file does not exist.               |

The `generated/` and `methods/` folders are cleaned and recreated each time the generator runs.

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

## Generated method argument order

Generated wrappers preserve the original generated API arguments, remove the raw generated `RequestParams` argument from the public wrapper call, and then add an optional final method options object.

For query methods:

```ts
await getSuppliers(query, {
  onSuccess,
  onError,
  params,
});
```

For query methods without a query object, pass `undefined` as the first argument when you want to provide options:

```ts
await exportPartners(undefined, {
  onError: handleError,
});
```

For non-query methods:

```ts
await updateSupplier(id, body, {
  onSuccess,
  onError,
  params,
});
```

For multipart/form-data methods:

```ts
await uploadSupplierLogo(data, {
  onSuccess,
  onError,
  params,
});
```

For filter-form paginated methods when `typedApiUseFilterFormValues` is enabled:

```ts
await getSuppliers(filters, page, pageSize, sortBy, sortDirection, {
  onSuccess,
  onError,
  params,
});
```

The final options argument uses the `ApiMethodOptions<TResponse, TError, TRequestParams>` shape.

```ts
import type { ApiMethodOptions } from "typedapi-client-helpers";

type GetSuppliersOptions = ApiMethodOptions<
  GetSuppliersResponse,
  GetSuppliersError,
  RequestParams
>;
```

The `params` property is forwarded to the generated HTTP client and can contain values such as headers or other request options. This makes it possible to pass only `onError`, only `onSuccess`, only `params`, or any combination of them.

```ts
await getSuppliers(undefined, {
  onError: handleError,
});
```

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

await getSuppliers(
  { pageNumber: 1, pageSize: 25 },
  {
    onSuccess,
    onError,
  },
);
```

The generated method still returns `ApiResult<T>` after callbacks run.

You can also pass only one callback.

```ts
await getSuppliers(
  { pageNumber: 1, pageSize: 25 },
  {
    onError,
  },
);
```

When default handlers are configured, generated methods use them when no method-specific callback is supplied.

```ts
await getSuppliers(
  { pageNumber: 1, pageSize: 25 },
  {
    onSuccess: customSuccessHandler,
  },
);
```

In this example, the custom success handler is used for success results, and the configured default error handler is still used for error results.

## Default callback handler file

When `typedApiDefaultFunctionsPath` points to a file that does not exist, the generator creates it and adds the configured success and error handler exports.

```ts
import type { ApiErrorResult, ApiSuccessResult } from "typedapi-client-helpers";

export function handleGoodResult<T>(
  _response: ApiSuccessResult<T>,
): void | Promise<void> {
  // Add your default success handling here.
}

export function handleErrors<T>(
  _error: ApiErrorResult<T>,
): void | Promise<void> {
  // Add your default error handling here.
}
```

If the configured file exists but does not export the configured handler names, generated methods are created without default handler imports and a warning is printed.

## Custom request parameters

The method options object can contain request parameters supported by the generated HTTP client.

```ts
const result = await getSuppliers(
  { pageNumber: 1, pageSize: 25 },
  {
    params: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  },
);
```

Request parameters can also be combined with callbacks.

```ts
const result = await getSuppliers(
  { pageNumber: 1, pageSize: 25 },
  {
    onError: handleError,
    params: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  },
);
```

## Query methods without required filters

Some generated API methods require a query object at the raw generated client level, even when all query properties are optional.

The wrapper methods allow the query argument to be omitted. Internally, they pass an empty object to the raw generated method.

```ts
await exportPartners();
```

is handled like:

```ts
await exportPartners({});
```

When you want to pass options but no query, pass `undefined` as the first argument.

```ts
await exportPartners(undefined, {
  onError: handleError,
});
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

You can also pass method options as the final argument.

```ts
const result = await getSuppliers(filters, 1, 25, "name", "Ascending", {
  onError: handleError,
  params: {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
});
```

Empty filter values are ignored by `buildQuery`.

## Multipart uploads

Generated methods that need multipart bodies use `toFormData` internally. You can also use it directly:

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

| Export                     | Description                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `FilterType`               | Union of supported filter input types used by generated filter-form methods.                |
| `OptionValue`              | Option object with a display `name` and submitted `value`.                                  |
| `FilterFormValues<TQuery>` | Configuration object for one filter field mapped to a query property.                       |
| `SortType`                 | UI sort state: Default, Neutral, Ascending, or Descending.                                  |
| `SortDirection`            | Sort direction value accepted by generated query objects. Supports string or number values. |
| `ApiSortDirection`         | Sort direction values accepted by the generated API: Default, Ascending, or Descending.     |
| `sortTypes`                | Constant list of all supported UI sort states.                                              |

### Callback and method types

| Export                                                | Description                                                                                                     |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `ApiSuccessHandler<TResponse>`                        | Callback type for successful API results. Receives `ApiSuccessResult<TResponse>`.                               |
| `ApiErrorHandler<TResponse>`                          | Callback type for failed API results. Receives `ApiErrorResult<TResponse>`.                                     |
| `ApiMethodCallbacks<TResponse>`                       | Backwards-compatible object shape containing optional `onSuccess`, `onError`, and `params` properties.          |
| `ApiMethodOptions<TResponse, TError, TRequestParams>` | Final options object used by generated wrapper methods. Contains optional `onSuccess`, `onError`, and `params`. |
| `ApiMethodArguments<TMethod, TRequestParams>`         | Gets the original generated method argument tuple without the trailing raw `RequestParams` argument.            |
| `ExtractResponse<T>`                                  | Extracts the response body type from a generated method promise.                                                |
| `ExtractError<T>`                                     | Extracts the error body type from a generated method promise.                                                   |
| `UnwrapArray<T>`                                      | Extracts the item type from an array, otherwise keeps the original type.                                        |
| `ExtractDataIfPaginated<T>`                           | Extracts the item type from a `{ data?: T[] }` paginated response.                                              |
| `SortableKeys<T>`                                     | Produces keys that can be used as sortable fields for a response type.                                          |
| `WithoutRequestParams<T>`                             | Removes a trailing optional `RequestParams` argument from a generated method argument tuple.                    |

### HTTP types

| Export                 | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `HttpResponse<D, E>`   | Extended fetch `Response` with typed `data` and `error` properties. |
| `RuntimeRequestParams` | Runtime request options object forwarded to generated API methods.  |

### Utility functions

| Export                             | Description                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `buildQuery<TQuery, TSortModel>()` | Builds a query object from filter form values, page values, and sort values.                         |
| `extractArgsCallbacksAndParams()`  | Backwards-compatible helper for older generated files that used positional callbacks.                |
| `extractArgsToastsAndParams()`     | Backwards-compatible extractor for wrapper arguments with success/error handlers and request params. |
| `handleApiResponse()`              | Executes a generated API call and converts the response or thrown error into `ApiResult<T>`.         |
| `HandleApiResponseOptions<T>`      | Options object for passing success and error callbacks to `handleApiResponse`.                       |
| `getSortTypeFromSortDirection()`   | Converts an API sort direction into a UI `SortType`.                                                 |
| `getSortDirectionFromSortType()`   | Converts a UI `SortType` into an API sort direction.                                                 |
| `toFormData()`                     | Converts an object payload into `FormData`.                                                          |

### Default callback handler template

These functions are not exported from the package root by default. They are the names used in the generated default handler file when `typedApiDefaultFunctionsPath`, `typedApiDefaultSuccessHandler`, and `typedApiDefaultErrorHandler` are configured.

| Generated export        | Description                                                                                            |
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

## Build the package

```bash
npm run build
```

## Generate an API client while developing this package

```bash
npm run generate:api
```

## Notes

Generated files inside `src/api` and `dist/api` depend on the Swagger document used during generation. Their exact method names and model names will change when the OpenAPI document changes.

Generated route type files ending in `Route.ts` are removed from the generated output.

The Swagger backup file is updated only after the generator has validated that the source content is JSON. This helps avoid replacing a valid backup with an HTML error page or another invalid response.
