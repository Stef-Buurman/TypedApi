# typedapi-client-helpers

A small Fetch runtime and OpenAPI 3 TypeScript generator designed to work with `TypedApi.Swagger` on ASP.NET Core.

## Version 0.3.5 highlights

* Supports `[TypedApiFilterForm]` endpoints through the `x-typedapi-filter-form` OpenAPI extension.
* Generates grouped filter-form arguments containing normal query values and `FilterFormValues`.
* Provides `buildFilterQuery<TQuery>()` for converting filters without adding pagination or sorting.
* Reconstructs opted-in closed .NET generic schemas as reusable TypeScript generics.
* Supports exact generic bindings for direct properties, arrays, collections, and dictionary values.
* Preserves required-but-nullable properties as required `T | null` instead of optional values.
* Generates non-cyclic discriminated unions with literal discriminator fields.
* Consumes readable generic schema IDs such as `ApiPaginationResponseOfProjectModel`.
* Generates method-specific unions from typed `ProblemDetails` error responses.
* Validates TypedApi OpenAPI contract version 2.

## Filter-form endpoints

`TypedApi.Swagger` can mark a non-paginated query endpoint with `[TypedApiFilterForm]`.

The attribute can be placed on the query parameter:

```csharp
[HttpGet("map-items")]
public async Task<ActionResult<IReadOnlyList<MapItemResponse>>> GetMapItems(
    [FromQuery, TypedApiFilterForm] ChargePointMapFilter filter,
    CancellationToken token)
{
    return Ok(await service.GetMapItemsAsync(filter, token));
}
```

It can also be placed on the endpoint:

```csharp
[TypedApiFilterForm]
[HttpGet("map-items")]
public async Task<ActionResult<IReadOnlyList<MapItemResponse>>> GetMapItems(
    [FromQuery] ChargePointMapFilter filter,
    CancellationToken token)
{
    return Ok(await service.GetMapItemsAsync(filter, token));
}
```

Placing the attribute on the query parameter is preferred because it explicitly identifies which parameter represents the filter form.

The generated frontend method groups normal query values and dynamic filters inside one `filterForm` argument:

```ts
export async function chargePointGetMapItems(
  filterForm: {
    query: ChargePointGetMapItemsQueryParams;
    filters?: FilterFormValues<ChargePointGetMapItemsQueryParams>[];
  },
  options: ApiMethodOptions<
    MapItemResponse[],
    HttpValidationProblemDetails | ProblemDetails,
    RequestParams
  > = {},
): Promise<
  ApiResult<
    MapItemResponse[],
    HttpValidationProblemDetails | ProblemDetails
  >
>;
```

Call the generated endpoint with fixed query values and optional filters:

```ts
await chargePointGetMapItems({
  query: {
    west,
    south,
    east,
    north,
    zoom,
  },
  filters: activeFilters,
});
```

The generated implementation merges both sources before sending the request:

```ts
const builtQuery = {
  ...(filterForm.query ?? {}),
  ...buildFilterQuery<ChargePointGetMapItemsQueryParams>(
    filterForm.filters ?? [],
  ),
};
```

Values produced by `buildFilterQuery()` are applied after normal query values. This means an active filter with the same property name overrides the value from `filterForm.query`.

Filter-form endpoints do not automatically add pagination or sorting. Paginated endpoints continue to use `buildQuery()`.

For an endpoint where every query property is optional, the generated argument defaults to an empty object:

```ts
export async function searchItems(
  filterForm: {
    query?: SearchItemsQueryParams;
    filters?: FilterFormValues<SearchItemsQueryParams>[];
  } = {},
  options: ApiMethodOptions<
    SearchResult[],
    ProblemDetails,
    RequestParams
  > = {},
);
```

For endpoints containing required query properties, `filterForm` and `filterForm.query` remain required.

## Generic contracts

With `[TypedApiGeneric]` on a backend wrapper, a closed schema such as `ApiEnvelope<ProjectModel>` becomes one reusable declaration:

```ts
export interface ApiEnvelope<T> {
  data: T;
  relatedItems: T[];
  itemsByKey: Record<string, T>;
}
```

Endpoints then use `ApiEnvelope<ProjectModel>` rather than a repeated `ApiEnvelopeOfProjectModel` interface.

Inherited generic wrappers are reconstructed whether Swagger uses `allOf` or emits a flattened schema:

```ts
export type ApiPaginationSortResponse<T> = ApiPaginationResponse<T> & {
  sortBy?: string | null;
  sortDirection: SortDirection;
};
```

## Required and nullable properties

OpenAPI presence and nullability remain separate:

```ts
export interface NullabilityContract {
  requiredText: string;
  requiredNullableText: string | null;
  optionalNullableText?: string | null;
}
```

## Discriminated unions

Serializer discriminator mappings produce narrowing unions without cyclic inheritance:

```ts
export type NotificationModel =
  | EmailNotificationModel
  | SmsNotificationModel;

export type EmailNotificationModel = NotificationModelBase & {
  emailAddress: string;
  kind: "email";
};
```

## Typed errors

When the OpenAPI operation contains typed error response bodies, generated methods expose the union directly:

```ts
ApiResult<
  ProjectModel,
  HttpValidationProblemDetails | ProblemDetails
>
```

## Install

```bash
npm install typedapi-client-helpers@0.3.5
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
└── methods/
    └── Products.api.ts
```

The generator intentionally does not create `src/api/index.ts`.

Import generated methods and contracts directly from their files:

```ts
import { getProducts } from "./api/methods/Product.api";
import type { ProductModel } from "./api/generated/data-contracts";
```

When upgrading from an earlier 0.3.0 build, the next generation removes the old generated `src/api/index.ts`.

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

* `"operationId"` uses the unique OpenAPI operation ID. The controller-prefix setting does not affect this mode.
* `"action"` uses the original ASP.NET controller action name.
* `typedApiPrefixMethodNamesWithController: true` is the default in action mode and prefixes the normalized controller name.
* `typedApiPrefixMethodNamesWithController: false` removes the controller prefix.

For an `OrderController` action named `GetOrderById`:

```text
typedApiPrefixMethodNamesWithController: true  -> orderGetOrderById(...)
typedApiPrefixMethodNamesWithController: false -> getOrderById(...)
```

Operation-specific types follow the selected name:

```text
true  -> OrderGetOrderByIdParams
false -> GetOrderByIdParams
```

Action-name mode requires the matching `TypedApi.Swagger` package, which emits `x-typedapi-operation.actionName`.

When the prefix is enabled, the controller name is read from `x-typedapi-operation.controllerName`, the first OpenAPI tag, or the route.

If disabling the prefix creates duplicate names across controllers, generation stops with a clear collision error. Enable the prefix, rename an action, or use `"operationId"`.

## CI consistency check

```bash
typedapi-generate --check
```

This generates in memory and exits with an error when committed generated files are missing, stale, or different.

Other modes:

```bash
typedapi-generate --strict
typedapi-generate --offline
typedapi-generate --verbose
```

* `--strict` fails instead of using a backup after a Swagger download error.
* `--offline` intentionally generates from the configured Swagger backup.
* `--verbose` prints additional generator diagnostics.

## Generated property names

Generated interface and parameter members lowercase only the first character:

```ts
Files -> files
URLValue -> uRLValue
ProductID -> productID
snake_case -> snake_case
```

The remainder of each property name is preserved.

Generated wire metadata converts local property names back to the exact OpenAPI names for:

* JSON bodies
* Multipart forms
* Query parameters
* Header parameters
* Cookie parameters
* Path parameters

Responses and documented error bodies are converted in the opposite direction.

## Generated method shape

Generated methods keep parameters and request bodies in separate positional groups.

Non-body parameters come first, the body comes second, and request options remain last:

```ts
await updateWarehouse(
  {
    id: requireId(
      context.warehouseId,
      "Warehouse ID",
    ),
  },
  warehouse,
);
```

The generated signature is:

```ts
export async function updateWarehouse(
  pathParams: UpdateWarehouseParams,
  data: WarehouseRequest,
  options: ApiMethodOptions<
    WarehouseModel,
    ApiHttpError,
    RequestParams
  > = {},
): Promise<ApiResult<WarehouseModel, ApiHttpError>>;
```

Path operations without a body use only the params object:

```ts
await deleteSupplier({
  id: requireId(context.supplierId, "Supplier ID"),
});
```

Body-only operations accept their payload directly:

```ts
await uploadProductFiles({
  files: selectedFiles,
});
```

Regular query-only operations use a `query` argument:

```ts
await searchProducts({
  search: "charger",
  limit: 25,
});
```

Endpoints marked with `x-typedapi-filter-form` use a grouped `filterForm` argument containing `query` and optional `filters` properties:

```ts
await searchMapItems({
  query: {
    west,
    south,
    east,
    north,
    zoom,
  },
  filters: activeFilters,
});
```

Paginated endpoints use their existing filter, page, page-size, and sorting arguments:

```ts
await getProducts(
  activeFilters,
  1,
  100,
  "name",
  SortDirection.Ascending,
);
```

Operations involving headers or cookies without path parameters use `requestParams`.

All generated parameter interfaces are named `OperationNameParams`. Nested `path`, `query`, `headers`, `cookies`, or `body` wrappers are not generated for regular endpoint methods.

Request options are always last:

```ts
await updateWarehouse(pathParams, data, {
  params: {
    signal: abortController.signal,
    timeoutMs: 10_000,
    headers: new Headers({
      Authorization: "Bearer ...",
    }),
  },
  onSuccess: result => {
    console.log(result.response);
  },
  onError: result => {
    console.error(result.error);
  },
});
```

## Filter conversion

Use `buildFilterQuery()` when filters must be converted without adding pagination or sorting:

```ts
const query = buildFilterQuery<ProductQueryParams>(
  activeFilters,
);
```

Use `buildQuery()` for paginated endpoints:

```ts
const query = buildQuery<
  ProductQueryParams,
  ProductTableRow
>(
  activeFilters,
  page,
  pageSize,
  sortBy,
  sortDirection,
);
```

`buildFilterQuery()` supports the same `FilterFormValues` conversion behavior as `buildQuery()`, including:

* Primitive values
* Minimum and maximum values
* Lists
* `OptionValue` values
* Booleans
* Numbers
* Dates
* Strings

It does not add:

* `pageNumber`
* `pageSize`
* `sortBy`
* `sortDirection`

## Typed errors

When the OpenAPI document describes error response bodies, generated methods expose their generated type or union.

When no error schema is documented, the method uses `ApiHttpError` instead of `unknown`:

```ts
const result = await cancelOrder({
  id,
  reason,
});

if (!result.ok) {
  if (result.error.kind === "http") {
    console.error(
      result.error.status,
      result.error.body,
    );
  } else {
    console.error(result.error);
  }
}
```

Structured client errors include:

* Network errors
* Aborted requests
* Timeout errors
* Malformed response errors

Malformed JSON is reported as a structured parse error instead of being cast to the expected response type.

Exceptions thrown by consumer `onSuccess` and `onError` callbacks propagate normally.

## Runtime configuration

```ts
import {
  configureApiClient,
  setSecurityData,
} from "typedapi-client-helpers";

configureApiClient({
  baseUrl: "https://api.example.com",
  timeoutMs: 15_000,
  securityWorker: token =>
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
});

setSecurityData("access-token");
```

The runtime also exports:

* `createApiClient`
* `request`
* `abortRequest`
* `mergeHeaders`
* `toRequestHeaders`
* `toCookieHeader`
* `handleApiResponse`
* `buildFilterQuery`
* `buildQuery`
* `toFormData`

## Backend pairing

Use `TypedApi.Swagger` 0.3.2 or newer on the backend for:

* `[TypedApiFilterForm]`
* Generic reconstruction
* Corrected nullability
* Discriminators
* Readable schema IDs
* Typed default errors

The backend package emits `x-typedapi-filter-form` for opted-in filter endpoints.

It also emits `x-typedapi.contractVersion = 2` for contract compatibility. The generator validates the contract version before replacing generated files.
