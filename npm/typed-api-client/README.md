# typedapi-client-helpers

`typedapi-client-helpers` generates a typed TypeScript fetch client from an OpenAPI/Swagger document and adds reusable helper types and functions for API results, callbacks, filtering, sorting, request parameters, and multipart uploads.

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

By default, the generator first looks for a local `swagger/swagger.json` file in the project where the command is run. If that file is not available, it tries `https://localhost:7000/swagger/v1/swagger.json` and stores a validated backup copy inside this package for later runs.

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
    "typedApiCleanOutput": true,
    "typedApiModuleNameFirstTag": true,
    "typedApiUseTypeOnlyImports": true,
    "typedApiDefaultFunctionsPath": "src/defaultApiFunctions",
    "typedApiDefaultSuccessHandler": "handleGoodResult",
    "typedApiDefaultErrorHandler": "handleErrors",
    "typedApiDefaultResponseAsSuccess": false,
    "typedApiGenerateUnionEnums": false,
    "typedApiEnumNamesAsValues": false,
    "typedApiBaseUrl": "https://localhost:7000"
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

The backup file is always package-owned: `swagger/swagger.backup.json` inside `typedapi-client-helpers`. Consumers do not need to add or configure a backup file in their own project.

### Configuration options

| Option                             | Default                                          | Description                                                                                                    |
| ---------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `swaggerUrl`                       | `https://localhost:7000/swagger/v1/swagger.json` | URL of the OpenAPI/Swagger document. Used when no configured or default local file is available.               |
| `swaggerFile`                      | none                                             | Local path to an OpenAPI/Swagger document. When set, this is used before `swaggerUrl`.                         |
| `apiOutput`                        | `src/api`                                        | Directory where the generated API files are written.                                                           |
| `typedApiCleanOutput`              | `true`                                           | Cleans generated API output before writing the new files.                                                      |
| `typedApiModuleNameFirstTag`       | `true`                                           | Groups operations by their first OpenAPI tag, creating one controller file per tag.                            |
| `typedApiUseTypeOnlyImports`       | `true`                                           | Generates `import type` statements for imports that are only used as types. Set to `false` for normal imports. |
| `typedApiDefaultFunctionsPath`     | `src/defaultApiFunctions`                        | Path to the project file that exports the shared default API success and error handlers. Created when missing. |
| `typedApiDefaultSuccessHandler`    | `handleGoodResult`                               | Export name of the default success handler imported into generated method files.                               |
| `typedApiDefaultErrorHandler`      | `handleErrors`                                   | Export name of the default error handler imported into generated method files.                                 |
| `typedApiDefaultResponseAsSuccess` | `false`                                          | Uses the OpenAPI `default` response as a success response when no 2xx response is available.                   |
| `typedApiGenerateUnionEnums`       | `false`                                          | Generates enum schemas as string-literal union types instead of `as const` enum-like objects.               |
| `typedApiEnumNamesAsValues`        | `false`                                          | When OpenAPI uses `x-enumNames`, uses those names as enum/union values instead of only as object keys.   |
| `typedApiBaseUrl`                  | first OpenAPI server URL                         | Overrides the generated HTTP client's default `baseUrl`.                                                       |

### Environment variables

| Environment variable                    | Description                                                  |
| --------------------------------------- | ------------------------------------------------------------ |
| `SWAGGER_URL`                           | URL of the OpenAPI/Swagger document.                         |
| `SWAGGER_FILE`                          | Local path to an OpenAPI/Swagger document.                   |
| `API_OUTPUT`                            | Directory where generated API files are written.             |
| `TYPED_API_CLEAN_OUTPUT`                | Cleans generated API output when set to `true`.              |
| `TYPED_API_MODULE_NAME_FIRST_TAG`       | Groups operations by first OpenAPI tag when set to `true`.   |
| `TYPED_API_USE_TYPE_ONLY_IMPORTS`       | Enables type-only imports when set to `true`.                |
| `TYPED_API_DEFAULT_FUNCTIONS_PATH`      | Path to the shared default handler file.                     |
| `TYPED_API_DEFAULT_SUCCESS_HANDLER`     | Export name of the default success handler.                  |
| `TYPED_API_DEFAULT_ERROR_HANDLER`       | Export name of the default error handler.                    |
| `TYPED_API_DEFAULT_RESPONSE_AS_SUCCESS` | Allows the OpenAPI `default` response to be used as success. |
| `TYPED_API_GENERATE_UNION_ENUMS`        | Generates enum schemas as union types when set to `true`.    |
| `TYPED_API_ENUM_NAMES_AS_VALUES`        | Generates enum-like literal values when set to `true`.       |
| `TYPED_API_BASE_URL`                    | Overrides the generated HTTP client's default base URL.      |

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
npm run generate:api --typed-api-use-type-only-imports=true
npm run generate:api --typed-api-module-name-first-tag=true
npm run generate:api --typed-api-generate-union-enums=true
```

## Generated structure

Running the generator creates a structure similar to this:

```text
src/
└── api/
    ├── generated/
    │   ├── data-contracts.ts
    │   └── http-client.ts
    ├── methods/
    │   ├── Product.api.ts
    │   └── Supplier.api.ts
    └── index.ts
```

| Folder or file                | Description                                                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generated/data-contracts.ts` | TypeScript models, request parameter types, const enum-like objects, and multipart payload interfaces generated from the OpenAPI schema.                                               |
| `generated/http-client.ts`    | Function-based fetch client with request params, security worker support, custom fetch support, cancellation tokens, and content formatting. It does not generate a class.             |
| `methods/*.api.ts`            | One generated file per controller/tag. These files export plain functions such as `getProducts`, `createProduct`, and `uploadProductFiles`; there are no generated controller classes. |
| `index.ts`                    | Barrel file that exports contracts, HTTP client utilities, and callable methods.                                                                                                       |

The generated `generated/` folder, `methods/` folder, old `controllers/` folder, and `index.ts` are cleaned each time the generator runs.

The `generated/` and `methods/` folders are cleaned and recreated each time the generator runs.

## Calling generated methods

Generated method files export plain functions that can be called directly. The wrapper return type stays `ApiResult<T>`, so existing UI code can keep using `result.ok`, `result.status`, `result.response`, and `result.error`.

```ts
import {
  getProducts,
  getProductById,
  updateProduct,
} from "./api/methods/Product.api";

const products = await getProducts([], 1, 25);
const product = await getProductById({ id: "..." });
await updateProduct(
  { id: "..." },
  { name: "Updated", sku: "SKU-1", price: 10, stock: 5, active: true },
);
```

The generated method signatures stay close to the existing callable wrappers:

```ts
getProducts(filters?, page?, pageSize?, sortBy?, sortDirection?, options?);
getProductById({ id }, options?);
updateProduct({ id }, data, options?);
uploadProductFile(data, options?);
```

`options.params` is the generated `RequestParams` type and is forwarded directly to the fetch client.

### Default success and error handlers

Generated method files import default handlers from `typedApiDefaultFunctionsPath` when that file exports the configured handler names. With the package defaults, the generator uses `src/defaultApiFunctions.ts` and creates it automatically when it is missing.

```ts
export function handleGoodResult<T>(
  response: ApiSuccessResult<T>,
): void | Promise<void> {
  // default success behavior
}

export function handleErrors<T>(
  error: ApiErrorResult<T>,
): void | Promise<void> {
  // default error behavior
}
```

You can override the path or export names from the consuming project's `package.json` without changing generated method signatures.
