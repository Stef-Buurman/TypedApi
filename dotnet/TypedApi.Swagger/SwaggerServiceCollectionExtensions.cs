using System.Reflection;
using System.Text;
using System.Text.Json.Serialization;
using System.Globalization;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.Extensions.DependencyInjection;
using Swashbuckle.AspNetCore.SwaggerGen;
using TypedApi.Swagger.Filters;
using TypedApi.Swagger.Internal;

namespace TypedApi.Swagger;

/// <summary>Registers the Swagger conventions required by TypedApi client generation.</summary>
public static class SwaggerServiceCollectionExtensions
{
    /// <summary>
    /// Adds Swagger generation with stable operation IDs, serializer-aware schemas,
    /// string enums, inheritance, polymorphism, and TypedApi contract metadata.
    /// </summary>
    public static IServiceCollection AddTypedApiSwagger(
        this IServiceCollection services,
        Action<SwaggerGenOptions>? configure = null)
    {
        services.AddSwaggerGen(options =>
        {
            options.TagActionsBy(api => new[] { GetSwaggerTag(api) });
            options.CustomOperationIds(GetOperationId);
            options.CustomSchemaIds(TypedApiSchemaId.Get);
            options.SupportNonNullableReferenceTypes();
            options.UseAllOfForInheritance();
            options.UseOneOfForPolymorphism();
            options.SelectSubTypesUsing(GetDerivedTypes);
            options.SelectDiscriminatorNameUsing(GetDiscriminatorName);
            options.SelectDiscriminatorValueUsing(GetDiscriminatorValue);
            options.SchemaFilter<RequireAllPropertiesSchemaFilter>();
            options.SchemaFilter<StringEnumSchemaFilter>();
            options.SchemaFilter<TypedApiGenericSchemaFilter>();
            options.DocumentFilter<TypedApiContractDocumentFilter>();
            options.OperationFilter<TypedApiOperationMetadataFilter>();
            options.OperationFilter<TypedApiPaginationOperationFilter>();
            options.OperationFilter<TypedApiErrorResponseOperationFilter>();
            configure?.Invoke(options);
        });

        return services;
    }

    /// <summary>Configures System.Text.Json to serialize enum values as strings.</summary>
    public static IMvcBuilder AddTypedApiJsonOptions(this IMvcBuilder builder)
    {
        return builder.AddJsonOptions(options =>
        {
            if (!options.JsonSerializerOptions.Converters.Any(converter =>
                    converter is JsonStringEnumConverter))
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            }
        });
    }

    private static IEnumerable<Type> GetDerivedTypes(Type baseType)
    {
        var declaredTypes = baseType
            .GetCustomAttributes<JsonDerivedTypeAttribute>(inherit: false)
            .Select(attribute => attribute.DerivedType)
            .Distinct()
            .ToArray();
        if (declaredTypes.Length > 0) return declaredTypes;

        try
        {
            return baseType.Assembly
                .GetTypes()
                .Where(type => type.IsClass && !type.IsAbstract && type.IsSubclassOf(baseType));
        }
        catch (ReflectionTypeLoadException exception)
        {
            return exception.Types
                .Where(type => type is not null && type.IsClass && !type.IsAbstract && type.IsSubclassOf(baseType))
                .Cast<Type>();
        }
    }

    private static string GetDiscriminatorName(Type baseType)
    {
        var polymorphic = baseType.GetCustomAttribute<JsonPolymorphicAttribute>(inherit: false);
        if (polymorphic is not null)
            return polymorphic.TypeDiscriminatorPropertyName ?? "$type";

        return null!;
    }

    private static string GetDiscriminatorValue(Type subType)
    {
        for (var baseType = subType.BaseType; baseType is not null; baseType = baseType.BaseType)
        {
            var attribute = baseType
                .GetCustomAttributes<JsonDerivedTypeAttribute>(inherit: false)
                .FirstOrDefault(candidate => candidate.DerivedType == subType);
            if (attribute?.TypeDiscriminator is string stringValue) return stringValue;
            if (attribute?.TypeDiscriminator is not null)
                return Convert.ToString(attribute.TypeDiscriminator, CultureInfo.InvariantCulture) ?? subType.Name;
        }

        return subType.Name;
    }

    private static string GetSwaggerTag(ApiDescription api)
    {
        if (!string.IsNullOrWhiteSpace(api.GroupName)) return api.GroupName;

        if (api.ActionDescriptor.RouteValues.TryGetValue("controller", out var controllerName)
            && !string.IsNullOrWhiteSpace(controllerName))
        {
            return controllerName;
        }

        return "Endpoints";
    }

    private static string GetOperationId(ApiDescription api)
    {
        var explicitName = api.ActionDescriptor.AttributeRouteInfo?.Name;
        if (!string.IsNullOrWhiteSpace(explicitName)) return SanitizeIdentifier(explicitName);

        api.ActionDescriptor.RouteValues.TryGetValue("controller", out var controller);
        api.ActionDescriptor.RouteValues.TryGetValue("action", out var action);

        var method = api.HttpMethod ?? "Any";
        var route = api.RelativePath?.Split('?', 2)[0] ?? "Endpoint";
        var parts = new[] { controller, action, method, route }
            .Where(value => !string.IsNullOrWhiteSpace(value));

        return SanitizeIdentifier(string.Join("_", parts));
    }

    private static string SanitizeIdentifier(string value)
    {
        var builder = new StringBuilder(value.Length);
        var previousWasSeparator = false;

        foreach (var character in value)
        {
            if (char.IsLetterOrDigit(character))
            {
                builder.Append(character);
                previousWasSeparator = false;
            }
            else if (!previousWasSeparator && builder.Length > 0)
            {
                builder.Append('_');
                previousWasSeparator = true;
            }
        }

        var result = builder.ToString().Trim('_');
        if (string.IsNullOrEmpty(result)) result = "Endpoint";
        if (char.IsDigit(result[0])) result = $"Endpoint_{result}";
        return result;
    }
}
