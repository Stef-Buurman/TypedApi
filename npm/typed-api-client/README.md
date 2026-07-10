# typedapi-client-helpers

A small Fetch runtime and OpenAPI 3 TypeScript generator designed to work with `TypedApi.Swagger` on ASP.NET Core.

## Version 0.3 highlights

- Lowercases only the first character of generated TypeScript members while preserving exact OpenAPI names on the wire.
- Sanitizes operation IDs and rejects duplicates before writing output.
- Can name frontend functions from either the unique OpenAPI operation ID or the original ASP.NET controller action name.
- Supports path, query, header, cookie, and request-body inputs in the same operation.
- Resolves local OpenAPI references for schemas, parameters, request bodies, and responses.
- Supports `allOf` composition with local properties.
- Generates typed unions for documented non-success responses.
- Produces `index.ts` and `typedapi.manifest.json`.
- Writes generated output transactionally, with a Windows-safe in-place fallback when directory renames are blocked by editors or file watchers.
- Adds `--check`, `--strict`, `--offline`, and `--verbose` CLI modes.
- Improves cancellation, timeouts, header merging, SSR safety, and malformed-response handling.

## Install

```bash
npm install typedapi-client-helpers@0.3.0
```

The generator expects an OpenAPI 3.x document. Swagger 2.0 documents are rejected with a clear error.

## Configure generation

Add settings to the consuming application's `package.json`:

```json
{
  "scripts": {
    "generate:api": "typedapi-generate",
    "check:api": "typedapi-generate --check"
  },
  "config": {
    "swaggerUrl": "https://localhost:7000/swagger/v1/swagger.json",
    "apiOutput": "src/api",
    "typedApiSwaggerBackupFile": "swagger/swagger.backup.json",
    "typedApiDownloadTimeoutMs": 15000,
    "typedApiCleanOutput": true,
    "typedApiGenerateMissingOperationIds": false,
    "typedApiMethodNameStyle": "operationId",
    "typedApiPrefixMethodNamesWithController": true
  }
}
```

Run:

```bash
npm run generate:api
```

Generated output contains:

```text
src/api/
├── generated/
│   ├── data-contracts.ts
│   └── http-client.ts
├── methods/
│   └── Products.api.ts
├── index.ts
└── typedapi.manifest.json
```

The Swagger backup belongs to the consuming project, not this npm package.

## Frontend method names

Choose the source of generated function names with `typedApiMethodNameStyle`:

```json
{
  "config": {
    "typedApiMethodNameStyle": "action",
    "typedApiPrefixMethodNamesWithController": true
  }
}
```

- `"operationId"` uses the unique OpenAPI operation ID. The controller-prefix setting does not affect this mode.
- `"action"` uses the original ASP.NET controller action name.
- `typedApiPrefixMethodNamesWithController: true` is the default in action mode and prefixes the normalized controller name.
- `typedApiPrefixMethodNamesWithController: false` removes the controller prefix.

For an `OrderController` action named `GetOrderById`:

```text
typedApiPrefixMethodNamesWithController: true  -> orderGetOrderById(...)
typedApiPrefixMethodNamesWithController: false -> getOrderById(...)
```

Operation-specific types follow the selected name too:

```text
true  -> OrderGetOrderByIdParams
false -> GetOrderByIdParams
```

Action-name mode requires the matching `TypedApi.Swagger` package, which emits `x-typedapi-operation.actionName`. When the prefix is enabled, the controller name is read from `x-typedapi-operation.controllerName`, the first OpenAPI tag, or the route. If disabling the prefix creates duplicate names across controllers, generation stops with a clear collision error; enable the prefix, rename an action, or use `"operationId"`.


## CI consistency check

```bash
typedapi-generate --check
```

This generates in memory and exits with an error when committed generated files are missing, stale, or different.

Other modes:

```bash
typedapi-generate --strict   # fail instead of using a backup after a download error
typedapi-generate --offline  # intentionally generate from the backup
typedapi-generate --verbose  # print additional diagnostics
```


## Generated property names

Generated interface and parameter members lowercase **only the first character**:

```ts
Files -> files
URLValue -> uRLValue
ProductID -> productID
snake_case -> snake_case
```

The rest of each name is left unchanged. Generated wire metadata converts these local names back to the exact OpenAPI names for JSON, multipart forms, query parameters, headers, cookies, and path parameters. Responses and documented error bodies are converted in the opposite direction.

## Generated method shape

Generated methods keep parameters and request bodies as separate positional groups. Non-body parameters come first, the body comes second, and request options remain last:

```ts
await updateWarehouse(
  { id: requireId(context.warehouseId, "Warehouse ID") },
  warehouse,
);
```

The generated signature is:

```ts
export async function updateWarehouse(
  pathParams: UpdateWarehouseParams,
  data: WarehouseRequest,
  options: ApiMethodOptions<WarehouseModel, unknown, RequestParams> = {},
): Promise<ApiResult<WarehouseModel, unknown>>;
```

Path operations without a body use only the params object:

```ts
await deleteSupplier({ id: requireId(context.supplierId, "Supplier ID") });
```

Body-only operations accept their payload directly:

```ts
await uploadProductFiles({ files: selectedFiles });
```

Query-only operations use a `query` argument. Operations involving headers or cookies without path parameters use `requestParams`. All generated parameter interfaces are named `OperationNameParams`; nested `path`, `query`, `headers`, `cookies`, or `body` wrappers are not generated.

Request options are always last:

```ts
await updateWarehouse(pathParams, data, {
  params: {
    signal: abortController.signal,
    timeoutMs: 10_000,
    headers: new Headers({ Authorization: "Bearer ..." }),
  },
  onSuccess: result => console.log(result.response),
  onError: result => console.error(result.error),
});
```

## Typed errors

When the OpenAPI document describes error response bodies, generated methods expose their union:

```ts
const result = await createProduct(body);

if (!result.ok) {
  // Documented backend error type or a TypedApi client error:
  // network, aborted, or parse.
  console.error(result.error);
}
```

Malformed JSON is reported as a structured parse error instead of being cast to the expected response type. Consumer callback exceptions are allowed to propagate and are not disguised as API failures.

## Runtime configuration

```ts
import { configureApiClient, setSecurityData } from "typedapi-client-helpers";

configureApiClient({
  baseUrl: "https://api.example.com",
  timeoutMs: 15_000,
  securityWorker: token => token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : undefined
});

setSecurityData("access-token");
```

The runtime also exports `createApiClient`, `request`, `abortRequest`, `mergeHeaders`, `toRequestHeaders`, `toCookieHeader`, `handleApiResponse`, `buildQuery`, `toFormData`, `toWireValue`, and `fromWireValue`.

## Backend pairing

Use `TypedApi.Swagger` 0.3 or newer on the backend. It emits `x-typedapi.contractVersion = 1`, unique operation IDs, serializer-aware property names, and explicit pagination metadata. The generator validates the contract version before replacing generated files.
