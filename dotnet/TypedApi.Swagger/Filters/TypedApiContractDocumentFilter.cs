using System.Reflection;
using Swashbuckle.AspNetCore.SwaggerGen;

#if NET10_0_OR_GREATER
using System.Text.Json.Nodes;
using Microsoft.OpenApi;
#else
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
#endif

namespace TypedApi.Swagger.Filters;

/// <summary>Adds the TypedApi producer and contract version to the OpenAPI root.</summary>
public sealed class TypedApiContractDocumentFilter : IDocumentFilter
{
    public const int ContractVersion = 1;

    void IDocumentFilter.Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var producerVersion = typeof(TypedApiContractDocumentFilter)
            .Assembly
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?
            .InformationalVersion
            .Split('+', 2)[0] ?? "unknown";

#if NET10_0_OR_GREATER
        swaggerDoc.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        swaggerDoc.Extensions["x-typedapi"] = new JsonNodeExtension(new JsonObject
        {
            ["contractVersion"] = ContractVersion,
            ["producer"] = "TypedApi.Swagger",
            ["producerVersion"] = producerVersion
        });
#else
        swaggerDoc.Extensions["x-typedapi"] = new OpenApiObject
        {
            ["contractVersion"] = new OpenApiInteger(ContractVersion),
            ["producer"] = new OpenApiString("TypedApi.Swagger"),
            ["producerVersion"] = new OpenApiString(producerVersion)
        };
#endif
    }
}
