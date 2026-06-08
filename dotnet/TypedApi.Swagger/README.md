# TypedApi.Swagger

A reusable Swagger configuration package for ASP.NET Core APIs that work seamlessly with TypedApi client generation.

## What this package includes

* `AddTypedApiSwagger()`
* `AddTypedApiJsonOptions()`
* Required-property schema support
* Enum-as-string schema support
* Automatic operation IDs
* Controller and group-based Swagger tags
* OpenAPI generation improvements for TypedApi client generation

## Installation

```bash
dotnet add package TypedApi.Swagger
```

## Supported Frameworks

* .NET Standard 2.0
* .NET 8
* .NET 10

## Quick Start

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

## What AddTypedApiSwagger() Configures

```csharp
builder.Services.AddTypedApiSwagger();
```

Features:

* Uses action names as operation IDs
* Uses controller names or group names as Swagger tags
* Detects required properties automatically
* Exposes enums as strings in Swagger schemas
* Generates cleaner OpenAPI specifications

## What AddTypedApiJsonOptions() Configures

```csharp
builder.Services
    .AddControllers()
    .AddTypedApiJsonOptions();
```

Configures:

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

## Configuration Options

### Enable Swagger Only During Development

```csharp
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
```

### Custom Swagger Route

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

### Custom API Information

```csharp
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "My API",
        Version = "v1",
        Description = "My API documentation"
    });
});

builder.Services.AddTypedApiSwagger();
```

### Group Controllers

```csharp
[ApiExplorerSettings(GroupName = "Products")]
public class ProductsController : ControllerBase
{
}
```

Swagger will display all endpoints under the `Products` section.

### Nullable Reference Types

Enable nullable reference types:

```xml
<PropertyGroup>
    <Nullable>enable</Nullable>
</PropertyGroup>
```

This improves required-property detection in Swagger schemas.

## Example Controller

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

## Recommended Setup

```text
MyApi
├── Controllers
├── Models
├── Services
├── Program.cs
└── appsettings.json
```

## appsettings.json Example

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

## Usage with TypedApi Client Generation

Once Swagger is configured and exposed:

```text
https://localhost:7000/swagger/v1/swagger.json
```

The frontend TypedApi generator can use this endpoint to generate a fully typed TypeScript client.

## Notes

This package should be installed in the ASP.NET Core backend project that exposes the OpenAPI specification.

The generated Swagger document is intended to be consumed by the TypedApi TypeScript client generator.
