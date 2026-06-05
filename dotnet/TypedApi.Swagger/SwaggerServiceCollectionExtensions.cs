using Microsoft.Extensions.DependencyInjection;

namespace TypedApi.Swagger
{
    public static class SwaggerServiceCollectionExtensions
    {
        public static IServiceCollection AddTypedApiSwagger(this IServiceCollection services)
        {
            services.AddSwaggerGen(options =>
            {
                options.TagActionsBy(api =>
                    new[] { api.GroupName ?? api.ActionDescriptor.RouteValues["controller"] }
                );

                options.CustomOperationIds(apiDesc =>
                    apiDesc.ActionDescriptor.RouteValues["action"]
                );

                options.SchemaFilter<RequireAllPropertiesSchemaFilter>();
            });

            return services;
        }
    }
}