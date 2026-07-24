# TypedApi.Swagger

Swagger/OpenAPI conventions for ASP.NET Core APIs consumed by `typedapi-client-helpers`.

## Version 0.3.2 highlights

- Reconstructs opted-in closed .NET generic contracts as real TypeScript generics.
- Describes property presence and nullability independently.
- Uses `JsonPolymorphic` and `JsonDerivedType` metadata for discriminated frontend unions.
- Generates readable generic schema IDs such as `ApiPaginationResponseOfProjectModel`.
- Adds concrete `HttpValidationProblemDetails` and `ProblemDetails` response schemas.
- Preserves normal inheritance through OpenAPI `allOf` and polymorphism through `oneOf`.

## Installation

```bash
dotnet add package TypedApi.Swagger --version 0.3.2
```

## Setup

```csharp
using TypedApi.Swagger;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers()
    .AddTypedApiJsonOptions();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddTypedApiSwagger();
```

The optional callback still configures the underlying `SwaggerGenOptions` after the TypedApi defaults:

```csharp
builder.Services.AddTypedApiSwagger(options =>
{
    options.IncludeXmlComments(xmlPath);
});
```

## Filter-form query endpoints

Use `[TypedApiFilterForm]` when a non-paginated query endpoint should expose both a normal query object and `FilterFormValues<TQuery>` in the generated frontend method. The attribute can be placed on the action or directly on its query parameter:

```csharp
using TypedApi.Swagger.Attributes;

[TypedApiFilterForm]
[HttpGet("map-items")]
public async Task<ActionResult<IReadOnlyList<MapItemResponse>>> GetMapItems(
    [FromQuery] ChargePointMapFilter filter,
    CancellationToken token)
{
    var result = await _service.GetMapItemsAsync(filter, token);
    return Ok(result);
}
```

Equivalent parameter-level usage is also supported:

```csharp
public Task<ActionResult<IReadOnlyList<MapItemResponse>>> GetMapItems(
    [FromQuery, TypedApiFilterForm] ChargePointMapFilter filter,
    CancellationToken token)
```

The operation receives `x-typedapi-filter-form` metadata. With `typedapi-client-helpers` 0.3.5, the generated method has this shape:

```ts
chargePointGetMapItems(
  query: ChargePointGetMapItemsParams,
  filters: FilterFormValues<ChargePointGetMapItemsParams>[] = [],
  options = {},
)
```

The normal query object is intended for fixed values such as map bounds and zoom. Filter values override matching query properties when the request query is built. Paginated responses still use automatic `x-typedapi-pagination` detection and the existing paginated method shape.

## Generic frontend contracts

OpenAPI has no reusable generic schema definitions. Mark wrappers whose type parameters affect their JSON shape with `[TypedApiGeneric]`:

```csharp
using TypedApi.Swagger.Attributes;

[TypedApiGeneric]
public sealed class ApiEnvelope<T>
{
    public required T Data { get; set; }
    public List<T> RelatedItems { get; set; } = [];
    public Dictionary<string, T> ItemsByKey { get; set; } = [];
    public required string CorrelationId { get; set; }
}
```

The NuGet package emits `x-typedapi-generic` metadata with exact JSON-pointer bindings. `typedapi-client-helpers` 0.3.5 reconstructs that metadata as:

```ts
export interface ApiEnvelope<T> {
  data: T;
  relatedItems: T[];
  itemsByKey: Record<string, T>;
  correlationId: string;
}
```

`ApiPaginationResponse<T>` and `ApiPaginationSortResponse<T>` are already opted in. The package records both generic property bindings and the generic base relationship, so the frontend produces:

```ts
export type ApiPaginationSortResponse<T> = ApiPaginationResponse<T> & {
  sortBy?: string | null;
  sortDirection: SortDirection;
};
```

This remains true whether Swagger represents inheritance with `allOf` or flattens all inherited properties into the derived schema. Do not add the attribute to a generic type when its type parameters do not affect the serialized contract.

An optional frontend name can be supplied:

```csharp
[TypedApiGeneric("PagedResult")]
public sealed class InternalPagedResponse<T> { }
```

## Requiredness and nullability

Presence and nullability are emitted independently:

```csharp
public sealed class ExampleRequest
{
    public required string RequiredText { get; set; }
    public required string? RequiredNullableText { get; set; }

    [JsonRequired]
    public string? JsonRequiredNullableText { get; set; }

    [Required]
    public string? ValidationRequiredText { get; set; }

    public string? OptionalNullableText { get; set; }
}
```

The generated contract is:

```ts
export interface ExampleRequest {
  requiredText: string;
  requiredNullableText: string | null;
  jsonRequiredNullableText: string | null;
  validationRequiredText: string;
  optionalNullableText?: string | null;
}
```

The package respects the configured System.Text.Json naming policy, `[JsonPropertyName]`, `[JsonIgnore(Condition = JsonIgnoreCondition.Always)]`, nullable reference metadata, nullable value types, `[Required]`, `[JsonRequired]`, and the C# `required` keyword.

## Discriminated polymorphism

Prefer explicit serializer metadata so runtime JSON, OpenAPI, and TypeScript use the same discriminator:

```csharp
[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(EmailNotification), "email")]
[JsonDerivedType(typeof(SmsNotification), "sms")]
public abstract class Notification
{
    public required string Message { get; set; }
}

public sealed class EmailNotification : Notification
{
    public required string EmailAddress { get; set; }
}

public sealed class SmsNotification : Notification
{
    public required string PhoneNumber { get; set; }
}
```

The frontend generator creates a narrowing union:

```ts
export type Notification = EmailNotification | SmsNotification;

export type EmailNotification = NotificationBase & {
  emailAddress: string;
  kind: "email";
};
```

Declared `[JsonDerivedType]` entries are preferred. Assembly scanning remains a fallback for bases without explicit declarations.

## Readable schema IDs

Generic schema IDs use stable readable names:

```text
ApiPaginationResponse<ProjectModel> -> ApiPaginationResponseOfProjectModel
Dictionary<string, ProjectModel>    -> DictionaryOfStringAndProjectModel
```

These IDs make OpenAPI easier to inspect and allow the TypeScript generator to associate closed schemas with their generic definition.

## Typed errors

The operation filter:

- adds a typed `400` response using `HttpValidationProblemDetails` when absent;
- adds a typed `500` response using `ProblemDetails` when absent;
- fills explicit error responses that have a status but no response schema;
- preserves explicitly declared response bodies and descriptions.

Explicit endpoint metadata remains supported:

```csharp
[ProducesResponseType<ProjectResponse>(StatusCodes.Status200OK)]
[ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
public ActionResult<ProjectResponse> GetProject(Guid id) => ...;
```

The generated frontend method can then use:

```ts
ApiResult<ProjectResponse, HttpValidationProblemDetails | ProblemDetails>
```

## Inheritance

`AddTypedApiSwagger()` enables:

```csharp
options.UseAllOfForInheritance();
options.UseOneOfForPolymorphism();
```

Normal base models stay as intersections in TypeScript, while polymorphic base values become unions.

## Contract compatibility

Version 0.3.2 emits root metadata with `x-typedapi.contractVersion = 2`. Pair it with `typedapi-client-helpers` 0.3.5 or newer.

## Supported frameworks

- .NET 8 with Swashbuckle.AspNetCore 8.x
- .NET 10 with Swashbuckle.AspNetCore 10.x
