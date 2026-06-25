using Swashbuckle.AspNetCore.SwaggerGen;
using TypedApi.Swagger.Interfaces;

#if NET10_0_OR_GREATER
using System.Text.Json.Nodes;
using Microsoft.OpenApi;
#else
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
#endif

namespace TypedApi.Swagger.Filters;

/// <summary>Marks paginated endpoints so the TypeScript generator need not infer them by type name.</summary>
public sealed class TypedApiPaginationOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var isPaginated = context.ApiDescription.SupportedResponseTypes
            .Select(response => response.Type)
            .Any(ImplementsPaginationResponse);
        if (!isPaginated) return;

#if NET10_0_OR_GREATER
        operation.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        operation.Extensions["x-typedapi-pagination"] = new JsonNodeExtension(new JsonObject
        {
            ["pageProperty"] = FindParameter(operation, "pageNumber") ?? "pageNumber",
            ["pageSizeProperty"] = FindParameter(operation, "pageSize") ?? "pageSize",
            ["sortProperty"] = FindParameter(operation, "sortBy") ?? "sortBy",
            ["directionProperty"] = FindParameter(operation, "sortDirection") ?? "sortDirection",
            ["dataProperty"] = "data"
        });
#else
        operation.Extensions["x-typedapi-pagination"] = new OpenApiObject
        {
            ["pageProperty"] = new OpenApiString(FindParameter(operation, "pageNumber") ?? "pageNumber"),
            ["pageSizeProperty"] = new OpenApiString(FindParameter(operation, "pageSize") ?? "pageSize"),
            ["sortProperty"] = new OpenApiString(FindParameter(operation, "sortBy") ?? "sortBy"),
            ["directionProperty"] = new OpenApiString(FindParameter(operation, "sortDirection") ?? "sortDirection"),
            ["dataProperty"] = new OpenApiString("data")
        };
#endif
    }

    private static string? FindParameter(OpenApiOperation operation, string expectedName) =>
        operation.Parameters?
            .Select(parameter => parameter.Name)
            .FirstOrDefault(name => string.Equals(name, expectedName, StringComparison.OrdinalIgnoreCase));

    private static bool ImplementsPaginationResponse(Type? type)
    {
        if (type is null) return false;
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IApiPaginationResponse<>))
            return true;
        return type.GetInterfaces().Any(@interface =>
            @interface.IsGenericType
            && @interface.GetGenericTypeDefinition() == typeof(IApiPaginationResponse<>));
    }
}
