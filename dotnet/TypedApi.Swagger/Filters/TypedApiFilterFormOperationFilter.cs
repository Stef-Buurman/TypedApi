using System.Reflection;
using Swashbuckle.AspNetCore.SwaggerGen;
using TypedApi.Swagger.Attributes;

#if NET10_0_OR_GREATER
using System.Text.Json.Nodes;
using Microsoft.OpenApi;
#else
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
#endif

namespace TypedApi.Swagger.Filters;

/// <summary>
/// Adds opt-in filter-form metadata to operations marked with
/// <see cref="TypedApiFilterFormAttribute"/>.
/// </summary>
public sealed class TypedApiFilterFormOperationFilter : IOperationFilter
{
    void IOperationFilter.Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (!HasFilterFormAttribute(context.MethodInfo)) return;

#if NET10_0_OR_GREATER
        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        operation.Extensions["x-typedapi-filter-form"] = new JsonNodeExtension(new JsonObject
        {
            ["enabled"] = true
        });
#else
        operation.Extensions["x-typedapi-filter-form"] = new OpenApiObject
        {
            ["enabled"] = new OpenApiBoolean(true)
        };
#endif
    }

    private static bool HasFilterFormAttribute(MethodInfo methodInfo)
    {
        if (methodInfo.GetCustomAttribute<TypedApiFilterFormAttribute>(inherit: true) is not null)
            return true;

        return methodInfo
            .GetParameters()
            .Any(parameter => parameter.GetCustomAttribute<TypedApiFilterFormAttribute>(inherit: true) is not null);
    }
}
