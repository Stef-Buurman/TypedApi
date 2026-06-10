# typedapi-client-helpers

Generate a typed TypeScript API client from an OpenAPI/Swagger document and use reusable helpers for API responses, filtering, sorting, pagination, callbacks, and multipart form data.

The generated client uses the native `fetch` API and is created inside your own project, so the generated models and methods remain available for inspection and customization.

## Features

* Generates TypeScript models and API methods from OpenAPI
* Uses the native `fetch` API
* Generates methods grouped by OpenAPI tags
* Creates typed wrapper methods around generated requests
* Returns a consistent `ApiResult<T>`
* Supports success and error callbacks
* Supports custom request parameters and headers
* Supports query parameters, pagination, filtering, and sorting
* Converts upload payloads to `FormData`
* Supports local Swagger files and remote Swagger URLs
* Supports type-only imports
* Works with TypeScript frontend projects such as React, Angular, and Vue

## Installation

```bash
npm install typedapi-client-helpers
```

## Add the generator command

Add the following script to your project's `package.json`:

```json
{
  "scripts": {
    "generate:api": "typedapi-generate"
  }
}
```

You can then generate the API client with:

```bash
npm run generate:api
```

## Configuration

The generator can be configured through the `config` property in your project's `package.json`.

### Generate from a Swagger URL

```json
{
  "scripts": {
    "generate:api": "typedapi-generate"
  },
  "config": {
    "swaggerUrl": "https://localhost:7000/swagger/v1/swagger.json",
    "apiOutput": "src/api",
    "typedApiUseTypeOnlyImports": true,
    "typedApiUseFilterFormValues": false
  }
}
```

### Generate from a local Swagger file

```json
{
  "scripts": {
    "generate:api": "typedapi-generate"
  },
  "config": {
    "swaggerFile": "swagger/openapi.json",
    "apiOutput": "src/api",
    "typedApiUseTypeOnlyImports": true,
    "typedApiUseFilterFormValues": false
  }
}
```

When `swaggerFile` is configured, it takes precedence over `swaggerUrl`.

## Configuration options

| Option                        | Default                                          | Description                                              |
| ----------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `swaggerUrl`                  | `https://localhost:7000/swagger/v1/swagger.json` | URL of the OpenAPI document                              |
| `swaggerFile`                 | —                                                | Path to a local OpenAPI document                         |
| `apiOutput`                   | `src/api`                                        | Directory where the generated API is written             |
| `typedApiUseTypeOnlyImports`  | `false`                                          | Generates `import type` statements for type-only imports |
| `typedApiUseFilterFormValues` | `false`                                          | Generates filter-form arguments for paginated methods    |

## Environment variables

Configuration can also be supplied through environment variables.

| Environment variable               | Description                                              |
| ---------------------------------- | -------------------------------------------------------- |
| `SWAGGER_URL`                      | URL of the OpenAPI document                              |
| `SWAGGER_FILE`                     | Path to a local OpenAPI document                         |
| `API_OUTPUT`                       | Generated API output directory                           |
| `TYPED_API_USE_TYPE_ONLY_IMPORTS`  | Enables type-only imports when set to `true`             |
| `TYPED_API_USE_FILTER_FORM_VALUES` | Enables filter-form method generation when set to `true` |

Example:

```bash
SWAGGER_URL=https://localhost:7000/swagger/v1/swagger.json npm run generate:api
```

Command-line npm configuration is also supported:

```bash
npm run generate:api --swagger-url=https://localhost:7000/swagger/v1/swagger.json
```

```bash
npm run generate:api --swagger-file=swagger/openapi.json
```

```bash
npm run generate:api --api-output=src/api
```

## Generated structure

Running the generator creates an API directory similar to:

```text
src/
└── api/
    ├── generated/
    │   ├── data-contracts.ts
    │   ├── http-client.ts
    │   ├── Product.ts
    │   ├── ProductRoute.ts
    │   ├── Supplier.ts
    │   └── SupplierRoute.ts
    ├── methods/
    │   ├── Product.api.ts
    │   └── Supplier.api.ts
    └── index.ts
```

The `generated` directory contains the client produced from the OpenAPI document.

The `methods` directory contains typed wrapper functions that:

* Handle successful and failed responses
* Return `ApiResult<T>`
* Support success and error callbacks
* Accept custom request parameters
* Convert multipart request objects to `FormData`

## Export the generated API

Create or update `src/api/index.ts` so consumers can import the generated types and methods from one location:

```ts
export * from "./generated/data-contracts";
export * from "./generated/http-client";

export * from "./methods/Product.api";
export * from "./methods/Supplier.api";
```

The exact method files depend on the tags in your OpenAPI document.

## Calling generated methods

Generated wrapper methods return a typed `ApiResult<T>`.

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

`ApiResult<T>` is a discriminated union:

```ts
type ApiResult<T> =
  | {
      ok: true;
      status: number;
      response: T;
    }
  | {
      ok: false;
      status: number;
      response?: T;
      error: unknown;
    };
```

Checking `result.ok` automatically narrows the result to either the successful or failed response type.

## Success and error callbacks

Generated methods support optional success and error callbacks.

```ts
import { getSuppliers } from "./api";

const result = await getSuppliers(
  {
    pageNumber: 1,
    pageSize: 25,
  },
  async (response) => {
    console.log("Suppliers loaded:", response);
  },
  async (error) => {
    console.error("Unable to load suppliers:", error);
  },
);
```

The method still returns an `ApiResult<T>`, even when callbacks are provided.

## Create and update requests

Body-based API methods keep the argument types generated from the OpenAPI document.

```ts
import { createSupplier } from "./api";

const result = await createSupplier({
  id: "supplier-1",
  name: "Example Supplier",
  active: true,
  countryCode: "NL",
  email: "supplier@example.com",
  rating: 4.5,
});

if (!result.ok) {
  console.error("Supplier creation failed:", result.error);
}
```

Callbacks can be added after the generated API arguments:

```ts
await createSupplier(
  {
    id: "supplier-1",
    name: "Example Supplier",
    active: true,
    countryCode: "NL",
    email: "supplier@example.com",
    rating: 4.5,
  },
  (supplier) => {
    console.log("Created supplier:", supplier);
  },
  (error) => {
    console.error("Creation failed:", error);
  },
);
```

## Custom request parameters

The final argument of a generated wrapper method can contain request configuration supported by the generated HTTP client.

For example, custom headers can be supplied as follows:

```ts
import { getSuppliers } from "./api";

const result = await getSuppliers(
  {
    pageNumber: 1,
    pageSize: 25,
  },
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

Set `typedApiUseFilterFormValues` to `true` to generate paginated methods that accept filter-form values rather than a query object.

```json
{
  "config": {
    "swaggerUrl": "https://localhost:7000/swagger/v1/swagger.json",
    "apiOutput": "src/api",
    "typedApiUseFilterFormValues": true
  }
}
```

A generated paginated method can then be called with filters, pagination, and sorting:

```ts
import type { FilterFormValues } from "typedapi-client-helpers";
import {
  getSuppliers,
  type GetSuppliersQuery,
} from "./api";

const filters: FilterFormValues<GetSuppliersQuery>[] = [
  {
    name: "Supplier name",
    filterName: "name",
    type: "string",
    value: "Example",
    isAList: false,
  },
  {
    name: "Active",
    filterName: "active",
    type: "boolean",
    value: true,
    isAList: false,
  },
];

const result = await getSuppliers(
  filters,
  1,
  25,
  "name",
  "Ascending",
);
```

Empty filter values are ignored automatically.

## Supported filter types

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

A filter configuration uses the following structure:

```ts
interface FilterFormValues<TQuery> {
  name: string;
  filterName: keyof TQuery;
  filterNameMax?: keyof TQuery;
  type: FilterType;
  value:
    | number
    | string
    | Date
    | boolean
    | null
    | OptionValue[]
    | string[];
  maxValue?: number | string | Date | null;
  isAList: boolean;
}
```

## Range filters

Use `filterNameMax` and `maxValue` to create range filters:

```ts
const filters: FilterFormValues<GetSuppliersQuery>[] = [
  {
    name: "Minimum rating",
    filterName: "minimumRating",
    filterNameMax: "maximumRating",
    type: "number",
    value: 3,
    maxValue: 5,
    isAList: false,
  },
];
```

## Option filters

Option-based filters display a name while sending a separate value to the API.

```ts
import type {
  FilterFormValues,
  OptionValue,
} from "typedapi-client-helpers";

const countries: OptionValue[] = [
  {
    name: "Netherlands",
    value: "NL",
  },
  {
    name: "Belgium",
    value: "BE",
  },
];

const filters: FilterFormValues<GetSuppliersQuery>[] = [
  {
    name: "Countries",
    filterName: "countryCodes",
    type: "OptionValue",
    value: countries,
    isAList: true,
  },
];
```

The generator sends the values `"NL"` and `"BE"` rather than the display names.

## Using `buildQuery` directly

The `buildQuery` helper can also be used without generated filter-form methods.

```ts
import {
  buildQuery,
  type FilterFormValues,
} from "typedapi-client-helpers";

interface ProductQuery {
  name?: string;
  minimumPrice?: number;
  maximumPrice?: number;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

const filters: FilterFormValues<ProductQuery>[] = [
  {
    name: "Name",
    filterName: "name",
    type: "string",
    value: "Laptop",
    isAList: false,
  },
  {
    name: "Price",
    filterName: "minimumPrice",
    filterNameMax: "maximumPrice",
    type: "number",
    value: 500,
    maxValue: 1500,
    isAList: false,
  },
];

const query = buildQuery<ProductQuery>(
  filters,
  1,
  25,
  "name",
  "Ascending",
);
```

The result is equivalent to:

```ts
{
  name: "Laptop",
  minimumPrice: 500,
  maximumPrice: 1500,
  pageNumber: 1,
  pageSize: 25,
  sortBy: "name",
  sortDirection: "Ascending"
}
```

## Sorting helpers

The package includes helpers for converting between UI sort states and API sort directions.

```ts
import {
  getSortDirectionFromSortType,
  getSortTypeFromSortDirection,
} from "typedapi-client-helpers";

const apiDirection =
  getSortDirectionFromSortType("Neutral");

// "Default"

const uiSortType =
  getSortTypeFromSortDirection("Descending");

// "Descending"
```

Supported UI sort states are:

```ts
type SortType =
  | "Default"
  | "Neutral"
  | "Ascending"
  | "Descending";
```

`Neutral` is a UI-only state and is converted to `Default` before it is sent to the API.

## File uploads

Multipart methods are detected during generation. Their payloads are converted to `FormData` automatically.

```ts
import { uploadDocument } from "./api";

const result = await uploadDocument({
  file: selectedFile,
  description: "Supplier contract",
});
```

The `toFormData` helper supports:

* `File`
* `Blob`
* Arrays of files or values
* Strings
* Numbers
* Booleans
* Nested objects

Nested objects are serialized as JSON strings.

You can also use the helper directly:

```ts
import { toFormData } from "typedapi-client-helpers";

const formData = toFormData({
  file: selectedFile,
  tags: ["contract", "supplier"],
  metadata: {
    department: "Purchasing",
  },
});
```

## Handling HTTP responses directly

The `handleApiResponse` helper can wrap any compatible generated HTTP request:

```ts
import {
  handleApiResponse,
  type HttpResponse,
} from "typedapi-client-helpers";

interface Product {
  id: string;
  name: string;
}

async function requestProduct(): Promise<
  HttpResponse<Product>
> {
  // Return a compatible generated HTTP response.
  throw new Error("Implement request");
}

const result = await handleApiResponse(
  () => requestProduct(),
  {
    onSuccess: (product) => {
      console.log(product);
    },
    onError: (error) => {
      console.error(error);
    },
  },
);
```

The response body is parsed as JSON when the response content type contains `application/json`. Empty responses, including HTTP `204` responses, return `undefined`.

## Regenerating the client

Run the generator whenever the OpenAPI document changes:

```bash
npm run generate:api
```

The existing generated and method directories inside the configured API output are replaced during generation. Keep custom application code outside those generated directories.

## Recommended workflow

1. Start the backend API.
2. Confirm that its OpenAPI document is available.
3. Run the API generator.
4. Build or start the frontend application.

Example:

```bash
npm run generate:api
npm run dev
```

## Package exports

The package exports the following reusable types and helpers:

```ts
import {
  buildQuery,
  getSortDirectionFromSortType,
  getSortTypeFromSortDirection,
  handleApiResponse,
  sortTypes,
  toFormData,
} from "typedapi-client-helpers";

import type {
  ApiErrorHandler,
  ApiMethodCallbacks,
  ApiResult,
  ApiSuccessHandler,
  FilterFormValues,
  FilterType,
  HttpResponse,
  OptionValue,
  SortType,
} from "typedapi-client-helpers";
```

Generated API models and methods are written into your project and should be imported from your configured API output directory:

```ts
import {
  createSupplier,
  getSuppliers,
  type SupplierModel,
} from "./api";
```

## TypeScript

The package includes generated declaration files and can be used directly in TypeScript projects.

```ts
import type {
  ApiResult,
  FilterFormValues,
  SortType,
} from "typedapi-client-helpers";
```
