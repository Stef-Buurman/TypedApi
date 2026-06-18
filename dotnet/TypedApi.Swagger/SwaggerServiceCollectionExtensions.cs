using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.Extensions.DependencyInjection;
using Swashbuckle.AspNetCore.SwaggerGen;
using TypedApi.Swagger.Filters;

#if NET8_0_OR_GREATER
using System.Text.Json.Serialization;
#endif

namespace TypedApi.Swagger;

public static class SwaggerServiceCollectionExtensions
{
    public static IServiceCollection AddTypedApiSwagger(
        this IServiceCollection services,
        Action<SwaggerGenOptions>? configure = null)
    {
        services.AddSwaggerGen(options =>
        {
            options.TagActionsBy(api => new[] { GetSwaggerTag(api) });

            options.CustomOperationIds(GetOperationId);

            options.SchemaFilter<RequireAllPropertiesSchemaFilter>();
            options.SchemaFilter<StringEnumSchemaFilter>();

            configure?.Invoke(options);
        });

        return services;
    }

#if NET8_0_OR_GREATER
    public static IMvcBuilder AddTypedApiJsonOptions(
        this IMvcBuilder builder)
    {
        return builder.AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(
                new JsonStringEnumConverter());
        });
    }
#endif

    private static string GetSwaggerTag(ApiDescription api)
    {
        if (!string.IsNullOrWhiteSpace(api.GroupName))
        {
            return api.GroupName;
        }

        if (api.ActionDescriptor.RouteValues.TryGetValue("controller", out var controllerName)
            && !string.IsNullOrWhiteSpace(controllerName))
        {
            return controllerName;
        }

        return "Endpoints";
    }

    private static string? GetOperationId(ApiDescription api)
    {
        if (api.ActionDescriptor.RouteValues.TryGetValue("action", out var actionName)
            && !string.IsNullOrWhiteSpace(actionName))
        {
            return actionName;
        }

        return null;
    }
}
