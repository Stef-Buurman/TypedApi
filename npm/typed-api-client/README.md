# typedapi-client-helpers

Reusable TypeScript helpers for generated typed OpenAPI clients.

## What this package includes

* `typedapi-generate` CLI command
* OpenAPI TypeScript client generation
* Typed API wrapper methods
* Typed query and pagination helpers
* `ApiResult<T>` response wrapper
* Toast helpers using `react-toastify`
* `TypedApiToastProvider`
* `buildQuery` helper for filters, paging, and sorting
* `toFormData` helper for file uploads
* Unauthorized handling for `401` responses
* Sort direction conversion helpers

## Installation

```bash
npm install typedapi-client-helpers
```

This package expects React to already be installed:

```bash
npm install react react-dom react-toastify
```

## Generate API files

Add a script to your project:

```json
{
  "scripts": {
    "generate:api": "typedapi-generate"
  }
}
```

Run:

```bash
npm run generate:api
```

By default, the generator reads Swagger from:

```text
https://localhost:7000/swagger/v1/swagger.json
```

and writes generated files to:

```text
src/api
```

## Configuration

Configure the generator in your `package.json`:

```json
{
  "config": {
    "swaggerUrl": "https://localhost:7000/swagger/v1/swagger.json",
    "swaggerFile": "./swagger.json",
    "apiOutput": "src/api",
    "typedApiUseTypeOnlyImports": true,
    "typedApiUseFilterFormValues": false
  }
}
```

### Available Settings

| Setting                       | Description                                                      | Default                                          |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| `swaggerUrl`                  | URL to the Swagger/OpenAPI document                              | `https://localhost:7000/swagger/v1/swagger.json` |
| `swaggerFile`                 | Local Swagger/OpenAPI file. Overrides `swaggerUrl` when provided | Not set                                          |
| `apiOutput`                   | Output directory for generated files                             | `src/api`                                        |
| `typedApiUseTypeOnlyImports`  | Uses `import type` statements when possible                      | `false`                                          |
| `typedApiUseFilterFormValues` | Generates pagination methods using `FilterFormValues[]`          | `false`                                          |

### Environment Variables

```bash
SWAGGER_URL=https://localhost:7000/swagger/v1/swagger.json npm run generate:api
SWAGGER_FILE=./swagger.json npm run generate:api
API_OUTPUT=src/api npm run generate:api
TYPED_API_USE_TYPE_ONLY_IMPORTS=true npm run generate:api
TYPED_API_USE_FILTER_FORM_VALUES=true npm run generate:api
```

## Usage

Import generated API functions:

```ts
import { getProducts } from "./api";

const result = await getProducts();

if (result.ok) {
    console.log(result.response);
}
```

### Toast Notifications

```ts
await createProduct(product, {
    toastSuccess: {
        title: "Saved",
        message: "Product created successfully."
    },
    toastError: {
        title: "Error",
        message: "Unable to create product."
    }
});
```

Add the provider once in your application:

```tsx
import { TypedApiToastProvider } from "typedapi-client-helpers";

function App() {
    return (
        <>
            <TypedApiToastProvider />
            {/* application */}
        </>
    );
}
```

### File Uploads

```ts
import { toFormData } from "typedapi-client-helpers";

const formData = toFormData({
    file,
    description: "Import file"
});
```

## Recommended Project Setup

```text
src/
├── api/
│   ├── clients/
│   ├── models/
│   └── index.ts
├── pages/
├── components/
└── services/
```

## Notes

Generated files should not be manually modified. Regenerate them whenever the backend OpenAPI specification changes.
