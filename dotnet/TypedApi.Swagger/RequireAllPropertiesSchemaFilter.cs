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
/// Describes JSON presence requirements and nullability independently, using nullable
/// reference metadata, the C# required keyword, and serializer/validation attributes.
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
        if (context.Type is null) return;

        foreach (var property in context.Type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (property.GetIndexParameters().Length > 0 || IsAlwaysIgnored(property)) continue;

            var serializedName = GetSerializedPropertyName(property);
            var schemaProperty = FindProperty(schema, serializedName);
            if (schemaProperty is null) continue;

            if (IsRequired(property))
            {
                schemaProperty.Value.Owner.Required ??= new HashSet<string>();
                schemaProperty.Value.Owner.Required.Add(schemaProperty.Value.Name);
            }

            SetAllowsNull(schemaProperty.Value.Schema, AllowsNull(property));
        }
    }

#if NET10_0_OR_GREATER
    private static SchemaProperty? FindProperty(OpenApiSchema schema, string propertyName)
    {
        if (schema.Properties is not null)
        {
            var matchingName = schema.Properties.Keys.FirstOrDefault(key =>
                string.Equals(key, propertyName, StringComparison.OrdinalIgnoreCase));
            if (matchingName is not null)
                return new SchemaProperty(schema, matchingName, schema.Properties[matchingName]);
        }

        if (schema.AllOf is null) return null;
        foreach (var item in schema.AllOf)
        {
            if (item is not OpenApiSchema concreteItem) continue;
            var result = FindProperty(concreteItem, propertyName);
            if (result is not null) return result;
        }

        return null;
    }
#else
    private static SchemaProperty? FindProperty(OpenApiSchema schema, string propertyName)
    {
        if (schema.Properties is not null)
        {
            var matchingName = schema.Properties.Keys.FirstOrDefault(key =>
                string.Equals(key, propertyName, StringComparison.OrdinalIgnoreCase));
            if (matchingName is not null)
                return new SchemaProperty(schema, matchingName, schema.Properties[matchingName]);
        }

        if (schema.AllOf is null) return null;
        foreach (var item in schema.AllOf)
        {
            var result = FindProperty(item, propertyName);
            if (result is not null) return result;
        }

        return null;
    }
#endif

    private string GetSerializedPropertyName(PropertyInfo property)
    {
        var explicitName = property.GetCustomAttribute<JsonPropertyNameAttribute>()?.Name;
        if (!string.IsNullOrWhiteSpace(explicitName)) return explicitName;

        return _jsonOptions.JsonSerializerOptions.PropertyNamingPolicy?.ConvertName(property.Name)
            ?? property.Name;
    }

    private bool IsRequired(PropertyInfo property)
    {
        if (property.GetCustomAttribute<RequiredAttribute>() is not null
            || HasAttribute(property, "System.Text.Json.Serialization.JsonRequiredAttribute")
            || HasAttribute(property, "System.Runtime.CompilerServices.RequiredMemberAttribute"))
        {
            return true;
        }

        return !AllowsNull(property);
    }

    private bool AllowsNull(PropertyInfo property)
    {
        if (property.GetCustomAttribute<RequiredAttribute>() is not null) return false;
        if (Nullable.GetUnderlyingType(property.PropertyType) is not null) return true;
        if (property.PropertyType.IsValueType) return false;
        return _nullability.Create(property).WriteState == NullabilityState.Nullable;
    }

#if NET10_0_OR_GREATER
    private static void SetAllowsNull(IOpenApiSchema propertySchema, bool allowsNull)
    {
        if (propertySchema is not OpenApiSchema concreteSchema || !concreteSchema.Type.HasValue) return;
        concreteSchema.Type = allowsNull
            ? concreteSchema.Type.GetValueOrDefault() | JsonSchemaType.Null
            : concreteSchema.Type.GetValueOrDefault() & ~JsonSchemaType.Null;
    }

    private readonly record struct SchemaProperty(OpenApiSchema Owner, string Name, IOpenApiSchema Schema);
#else
    private static void SetAllowsNull(OpenApiSchema propertySchema, bool allowsNull)
    {
        propertySchema.Nullable = allowsNull;
    }

    private readonly record struct SchemaProperty(OpenApiSchema Owner, string Name, OpenApiSchema Schema);
#endif

    private static bool IsAlwaysIgnored(PropertyInfo property)
    {
        var attribute = property.GetCustomAttribute<JsonIgnoreAttribute>();
        return attribute?.Condition == JsonIgnoreCondition.Always;
    }

    private static bool HasAttribute(MemberInfo member, string fullName) =>
        member.CustomAttributes.Any(attribute => attribute.AttributeType.FullName == fullName);
}
