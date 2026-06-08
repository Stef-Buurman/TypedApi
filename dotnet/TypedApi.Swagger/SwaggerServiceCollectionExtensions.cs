using Microsoft.Extensions.DependencyInjection;
using TypedApi.Swagger.Filters;

#if NET8_0_OR_GREATER
using System.Text.Json.Serialization;
#endif

namespace TypedApi.Swagger;

public static class SwaggerServiceCollectionExtensions
{
    public static IServiceCollection AddTypedApiSwagger(
        this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.TagActionsBy(api =>
                new[]
                {
            api.GroupName
            ?? api.ActionDescriptor.RouteValues["controller"]
                });

            options.CustomOperationIds(api =>
                api.ActionDescriptor.RouteValues["action"]);

            options.SchemaFilter<RequireAllPropertiesSchemaFilter>();
            options.SchemaFilter<StringEnumSchemaFilter>();
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
}