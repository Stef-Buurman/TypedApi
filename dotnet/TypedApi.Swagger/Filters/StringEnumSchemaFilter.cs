using System.Reflection;
using System.Runtime.Serialization;
using Swashbuckle.AspNetCore.SwaggerGen;

#if NET10_0_OR_GREATER
using System.Text.Json.Nodes;
using Microsoft.OpenApi;
#else
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
#endif

namespace TypedApi.Swagger.Filters;

/// <summary>Describes enum schemas using the same string values used at runtime.</summary>
public sealed class StringEnumSchemaFilter : ISchemaFilter
{
#if NET10_0_OR_GREATER
    void ISchemaFilter.Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema is not OpenApiSchema concreteSchema) return;
        ApplyCore(concreteSchema, context);
    }

    private static void ApplyCore(OpenApiSchema schema, SchemaFilterContext context)
#else
    void ISchemaFilter.Apply(OpenApiSchema schema, SchemaFilterContext context)
#endif
    {
        var enumType = Nullable.GetUnderlyingType(context.Type) ?? context.Type;
        if (!enumType.IsEnum) return;

#if NET10_0_OR_GREATER
        schema.Type = JsonSchemaType.String;
        schema.Format = null;
        schema.Enum = enumType
            .GetFields(BindingFlags.Public | BindingFlags.Static)
            .Select(field => (JsonNode?)GetSerializedName(field))
            .ToList();
        schema.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        schema.Extensions["x-enumFlags"] = new JsonNodeExtension(JsonValue.Create(enumType.IsDefined(typeof(FlagsAttribute), false))!);
#else
        schema.Type = "string";
        schema.Format = null;
        schema.Enum.Clear();
        foreach (var field in enumType.GetFields(BindingFlags.Public | BindingFlags.Static))
        {
            schema.Enum.Add(new OpenApiString(GetSerializedName(field)));
        }
        schema.Extensions["x-enumFlags"] = new OpenApiBoolean(enumType.IsDefined(typeof(FlagsAttribute), false));
#endif
    }

    private static string GetSerializedName(FieldInfo field)
    {
        var jsonNameAttribute = field.CustomAttributes.FirstOrDefault(attribute =>
            attribute.AttributeType.FullName ==
            "System.Text.Json.Serialization.JsonStringEnumMemberNameAttribute");
        if (jsonNameAttribute?.ConstructorArguments.FirstOrDefault().Value is string jsonName
            && !string.IsNullOrWhiteSpace(jsonName))
        {
            return jsonName;
        }

        var enumMemberName = field.GetCustomAttribute<EnumMemberAttribute>()?.Value;
        return string.IsNullOrWhiteSpace(enumMemberName) ? field.Name : enumMemberName;
    }
}
