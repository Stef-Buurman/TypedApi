# TypedApi.Swagger

Reusable Swagger/OpenAPI configuration for ASP.NET Core APIs that are consumed by TypedApi client generation.

## What this package includes

* `AddTypedApiSwagger()`
* `AddTypedApiSwagger(options => { ... })` for custom Swagger configuration
* `AddTypedApiJsonOptions()`
* Required-property schema support
* Enum-as-string schema support
* Automatic operation IDs
* Controller and group-based Swagger tags
* Swagger UI support through the package dependency
* OpenAPI generation improvements for TypedApi client generation

## Installation

```bash
dotnet add package TypedApi.Swagger
```

## Supported frameworks

* .NET 8
* .NET 10

## Quick start

### Program.cs

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

## What AddTypedApiSwagger() configures

```csharp
builder.Services.AddTypedApiSwagger();
```

Features:

* Uses action names as operation IDs
* Uses controller names or group names as Swagger tags
* Detects required properties automatically
* Exposes enums as strings in Swagger schemas
* Generates cleaner OpenAPI specifications

## Custom Swagger configuration

Use the optional callback when you want to add normal Swashbuckle options without registering `AddSwaggerGen()` separately.

```csharp
using Microsoft.OpenApi.Models;
using TypedApi.Swagger;

builder.Services.AddTypedApiSwagger(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "My API",
        Version = "v1",
        Description = "My API documentation"
    });
});
```

## What AddTypedApiJsonOptions() configures

```csharp
builder.Services
    .AddControllers()
    .AddTypedApiJsonOptions();
```

Configures enums to be serialized as strings:

```json
{
  "status": "Approved"
}
```

instead of:

```json
{
  "status": 2
}
```

This ensures generated clients use readable enum values.

## Configuration options

### Enable Swagger only during development

```csharp
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
```

### Custom Swagger route

```csharp
app.UseSwagger(options =>
{
    options.RouteTemplate = "docs/{documentName}/swagger.json";
});

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/docs/v1/swagger.json", "My API");
    options.RoutePrefix = "docs";
});
```

### Group controllers

```csharp
[ApiExplorerSettings(GroupName = "Products")]
public class ProductsController : ControllerBase
{
}
```

Swagger will display all endpoints under the `Products` section.

### Nullable reference types

Enable nullable reference types in your API project:

```xml
<PropertyGroup>
    <Nullable>enable</Nullable>
</PropertyGroup>
```

This improves required-property detection in Swagger schemas.

## Example controller

```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    public ActionResult<List<ProductModel>> GetProducts()
    {
        return Ok(new List<ProductModel>());
    }
}
```

## Usage with TypedApi client generation

Once Swagger is configured and exposed:

```text
https://localhost:7000/swagger/v1/swagger.json
```

The frontend TypedApi generator can use this endpoint to generate a fully typed TypeScript client.

## Notes

This package should be installed in the ASP.NET Core backend project that exposes the OpenAPI specification.

The generated Swagger document is intended to be consumed by the TypedApi TypeScript client generator.
