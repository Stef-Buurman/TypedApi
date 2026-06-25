using Swashbuckle.AspNetCore.SwaggerGen;

#if NET10_0_OR_GREATER
using System.Text.Json.Nodes;
using Microsoft.OpenApi;
#else
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
#endif

namespace TypedApi.Swagger.Filters;

/// <summary>
/// Adds controller and action names separately from the unique OpenAPI operation ID.
/// The TypeScript generator can use this metadata to choose ergonomic frontend method names
/// without making operation IDs non-unique.
/// </summary>
public sealed class TypedApiOperationMetadataFilter : IOperationFilter
{
    public const string ExtensionName = "x-typedapi-operation";

    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        context.ApiDescription.ActionDescriptor.RouteValues.TryGetValue("controller", out var controllerName);
        context.ApiDescription.ActionDescriptor.RouteValues.TryGetValue("action", out var actionName);

        if (string.IsNullOrWhiteSpace(controllerName) && string.IsNullOrWhiteSpace(actionName))
            return;

#if NET10_0_OR_GREATER
        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        operation.Extensions[ExtensionName] = new JsonNodeExtension(new JsonObject
        {
            ["controllerName"] = controllerName,
            ["actionName"] = actionName
        });
#else
        var metadata = new OpenApiObject();
        if (!string.IsNullOrWhiteSpace(controllerName))
            metadata["controllerName"] = new OpenApiString(controllerName);
        if (!string.IsNullOrWhiteSpace(actionName))
            metadata["actionName"] = new OpenApiString(actionName);

        operation.Extensions[ExtensionName] = metadata;
#endif
    }
}
