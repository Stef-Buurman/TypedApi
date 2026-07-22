using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.SwaggerGen;
using Microsoft.AspNetCore.Http;



#if NET10_0_OR_GREATER
using Microsoft.OpenApi;
#else
using Microsoft.OpenApi.Models;
#endif

namespace TypedApi.Swagger.Filters;

/// <summary>
/// Ensures validation and unexpected-error responses have concrete ProblemDetails schemas,
/// while preserving all response metadata explicitly declared by the application.
/// </summary>
public sealed class TypedApiErrorResponseOperationFilter : IOperationFilter
{
    void IOperationFilter.Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        operation.Responses ??= new OpenApiResponses();
        AddOrCompleteResponse(operation, context, "400", typeof(HttpValidationProblemDetails), "Validation error");
        AddOrCompleteResponse(operation, context, "500", typeof(ProblemDetails), "Unexpected server error");

        foreach (var responseEntry in operation.Responses.Where(entry => IsErrorStatus(entry.Key)).ToArray())
        {
#if NET10_0_OR_GREATER
            if (responseEntry.Value is not OpenApiResponse response || HasContent(response)) continue;
#else
            var response = responseEntry.Value;
            if (HasContent(response)) continue;
#endif
            var type = responseEntry.Key is "400" or "422" ? typeof(HttpValidationProblemDetails) : typeof(ProblemDetails);
            AddProblemContent(response, context, type);
        }
    }

    private static void AddOrCompleteResponse(
        OpenApiOperation operation,
        OperationFilterContext context,
        string statusCode,
        Type responseType,
        string description)
    {
#if NET10_0_OR_GREATER
        OpenApiResponse response;
        if (!operation.Responses!.TryGetValue(statusCode, out var existingResponse))
        {
            response = new OpenApiResponse { Description = description };
            operation.Responses[statusCode] = response;
        }
        else if (existingResponse is OpenApiResponse concreteResponse)
        {
            response = concreteResponse;
        }
        else
        {
            return;
        }
#else
        if (!operation.Responses!.TryGetValue(statusCode, out var response))
        {
            response = new OpenApiResponse { Description = description };
            operation.Responses[statusCode] = response;
        }
#endif

        if (string.IsNullOrWhiteSpace(response.Description)) response.Description = description;
        if (!HasContent(response)) AddProblemContent(response, context, responseType);
    }

    private static void AddProblemContent(OpenApiResponse response, OperationFilterContext context, Type responseType)
    {
        response.Content ??= new Dictionary<string, OpenApiMediaType>();
        response.Content["application/problem+json"] = new OpenApiMediaType
        {
            Schema = context.SchemaGenerator.GenerateSchema(responseType, context.SchemaRepository)
        };
    }

    private static bool HasContent(OpenApiResponse response) => response.Content is { Count: > 0 };

    private static bool IsErrorStatus(string statusCode)
    {
        if (string.Equals(statusCode, "default", StringComparison.OrdinalIgnoreCase)) return true;
        return int.TryParse(statusCode, out var parsed) && parsed >= 400;
    }
}
