using System.ComponentModel.DataAnnotations;
using System.Reflection;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.SwaggerGen;

#if NET10_0_OR_GREATER
using Microsoft.OpenApi;
#else
using Microsoft.OpenApi.Models;
#endif

namespace TypedApi.Swagger;

/// <summary>
/// Marks non-nullable serialized properties as required while respecting the
/// configured System.Text.Json naming policy and JSON property attributes.
/// </summary>
public sealed class RequireAllPropertiesSchemaFilter : ISchemaFilter
{
    private readonly JsonOptions _jsonOptions;
    private readonly NullabilityInfoContext _nullability = new();

    public RequireAllPropertiesSchemaFilter(IOptions<JsonOptions> jsonOptions)
    {
        _jsonOptions = jsonOptions.Value;
    }

#if NET10_0_OR_GREATER
    void ISchemaFilter.Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema is not OpenApiSchema concreteSchema) return;
        ApplyCore(concreteSchema, context);
    }

    private void ApplyCore(OpenApiSchema schema, SchemaFilterContext context)
#else
    void ISchemaFilter.Apply(OpenApiSchema schema, SchemaFilterContext context)
#endif
    {
        if (schema.Properties is null || context.Type is null) return;
        schema.Required ??= new HashSet<string>();

        foreach (var property in context.Type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (property.GetIndexParameters().Length > 0 || IsAlwaysIgnored(property)) continue;

            var schemaPropertyName = GetSerializedPropertyName(property);
            if (!schema.Properties.TryGetValue(schemaPropertyName, out var propertySchema))
            {
                var matchingName = schema.Properties.Keys.FirstOrDefault(key =>
                    string.Equals(key, schemaPropertyName, StringComparison.OrdinalIgnoreCase));
                if (matchingName is null) continue;
                schemaPropertyName = matchingName;
                propertySchema = schema.Properties[matchingName];
            }

            if (IsOptional(property)) continue;
            schema.Required.Add(schemaPropertyName);

#if NET10_0_OR_GREATER
            if (propertySchema is OpenApiSchema concretePropertySchema
                && concretePropertySchema.Type.HasValue)
            {
                concretePropertySchema.Type =
                    concretePropertySchema.Type.GetValueOrDefault() & ~JsonSchemaType.Null;
            }
#else
            propertySchema.Nullable = false;
#endif
        }
    }

    private string GetSerializedPropertyName(PropertyInfo property)
    {
        var explicitName = property.GetCustomAttribute<JsonPropertyNameAttribute>()?.Name;
        if (!string.IsNullOrWhiteSpace(explicitName)) return explicitName;

        return _jsonOptions.JsonSerializerOptions.PropertyNamingPolicy?.ConvertName(property.Name)
            ?? property.Name;
    }

    private bool IsOptional(PropertyInfo property)
    {
        if (property.GetCustomAttribute<RequiredAttribute>() is not null
            || HasAttribute(property, "System.Text.Json.Serialization.JsonRequiredAttribute"))
        {
            return false;
        }

        if (Nullable.GetUnderlyingType(property.PropertyType) is not null) return true;
        if (property.PropertyType.IsValueType) return false;
        return _nullability.Create(property).WriteState == NullabilityState.Nullable;
    }

    private static bool IsAlwaysIgnored(PropertyInfo property)
    {
        var attribute = property.GetCustomAttribute<JsonIgnoreAttribute>();
        return attribute?.Condition == JsonIgnoreCondition.Always;
    }

    private static bool HasAttribute(MemberInfo member, string fullName) =>
        member.CustomAttributes.Any(attribute => attribute.AttributeType.FullName == fullName);
}
