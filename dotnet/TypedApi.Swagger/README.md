# TypedApi.Swagger

Swagger/OpenAPI conventions for ASP.NET Core APIs consumed by the `typedapi-client-helpers` TypeScript generator.

## Version 0.3.1 highlights

- Adds a root `x-typedapi` contract marker (`contractVersion: 1`).
- Creates stable, sanitized operation IDs from controller, action, method, and route data.
- Emits separate controller/action metadata so the frontend can choose concise controller-action method names without weakening operation-ID uniqueness.
- Respects `JsonSerializerOptions.PropertyNamingPolicy` and `[JsonPropertyName]` when marking required properties.
- Uses `NullabilityInfoContext` instead of compiler-attribute parsing.
- Publishes documented HTTP error schemas for typed client errors.
- Adds `x-typedapi-pagination` metadata to paginated operations.
- Emits string enum values consistently, including `[EnumMember(Value = "...")]` and JSON enum member names.
- Validates page number and page size.
- Preserves .NET inheritance with OpenAPI `allOf`.
- Emits polymorphic base contracts with OpenAPI `oneOf`.
- Automatically discovers concrete subclasses from the base type assembly.

## Installation

```bash
dotnet add package TypedApi.Swagger --version 0.3.1
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

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
app.Run();
```

## Inheritance and polymorphism

`AddTypedApiSwagger()` automatically enables:

```csharp
options.UseAllOfForInheritance();
options.UseOneOfForPolymorphism();
options.SelectSubTypesUsing(...);
```

This preserves normal .NET inheritance in OpenAPI and discovers concrete subclasses from the assembly containing the base type. Referenced property models continue to be emitted as separate schemas. A configuration callback can still be supplied when a project needs additional Swashbuckle options or wants to override these defaults.

## Operation IDs

A named route remains the preferred explicit operation ID:

```csharp
[HttpGet("{id}", Name = "Products_GetById")]
public ActionResult<Product> GetById(int id) => ...;
```

When no route name is supplied, the package derives a sanitized ID from the controller, action, HTTP method, and route. This avoids collisions such as `Get` methods in multiple controllers.

Each operation also receives metadata like:

```json
{
  "x-typedapi-operation": {
    "controllerName": "Warehouses",
    "actionName": "UpdateWarehouse"
  }
}
```

The npm generator can therefore choose its frontend naming style without changing the unique OpenAPI operation ID:

```json
{
  "config": {
    "typedApiMethodNameStyle": "action"
  }
}
```

This produces `updateWarehouse(...)`. Use `"operationId"` to retain the current controller/action/verb/route-derived frontend name.

## JSON property names and required values

Required-property generation follows the configured System.Text.Json naming policy and respects explicit names:

```csharp
public sealed class SearchRequest
{
    [JsonPropertyName("snake_case")]
    public required string SearchText { get; init; }

    public string? OptionalText { get; init; }
}
```

The OpenAPI property remains `snake_case`, and the TypeScript generator preserves that exact wire name.

## Typed error responses

Document error bodies so the TypeScript package can generate typed error unions:

```csharp
[HttpPost]
[ProducesResponseType(typeof(Product), StatusCodes.Status201Created)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
public ActionResult<Product> Create(CreateProductRequest request) => ...;
```

## Pagination

```csharp
using TypedApi.Swagger.Models;
using TypedApi.Swagger.Models.Filters;

[HttpGet]
public ActionResult<ApiPaginationSortResponse<Product>> GetProducts(
    [FromQuery] PaginationFilter filter)
{
    return Ok(new ApiPaginationSortResponse<Product>
    {
        Data = [],
        PageNumber = filter.PageNumber,
        PageSize = filter.PageSize,
        TotalCount = 0,
        TotalPages = 0,
        SortBy = filter.SortBy,
        SortDirection = filter.SortDirection
    });
}
```

`PageNumber` must be at least 1. `TotalRecords` remains available as an obsolete compatibility alias for `TotalCount`.

## Supported frameworks

- .NET 8 with Swashbuckle.AspNetCore 8.x
- .NET 10 with Swashbuckle.AspNetCore 10.x

The generated document is OpenAPI 3.x and is intended for `typedapi-client-helpers` 0.3 or newer.
