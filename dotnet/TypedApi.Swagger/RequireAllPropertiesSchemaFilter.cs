using System;
using System.Collections.Generic;
using System.Reflection;
using Swashbuckle.AspNetCore.SwaggerGen;

#if NET10_0_OR_GREATER
using Microsoft.OpenApi;
#else
using Microsoft.OpenApi.Models;
#endif

namespace TypedApi.Swagger
{
    public class RequireAllPropertiesSchemaFilter : ISchemaFilter
    {
#if NET10_0_OR_GREATER
        public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
#else
public void Apply(OpenApiSchema schema, SchemaFilterContext context)
#endif
        {
            if (schema.Properties == null || context.Type == null)
                return;

#if !NET10_0_OR_GREATER
    if (schema.Required == null)
        schema.Required = new HashSet<string>();
#endif

            foreach (PropertyInfo property in context.Type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                string schemaPropertyName = ToCamelCase(property.Name);

                if (!schema.Properties.TryGetValue(schemaPropertyName, out var propertySchema))
                    continue;

                if (IsNullable(property))
                    continue;

                schema.Required?.Add(schemaPropertyName);

#if !NET10_0_OR_GREATER
        propertySchema.Nullable = false;
#endif
            }
        }

        private static bool IsNullable(PropertyInfo property)
        {
            if (Nullable.GetUnderlyingType(property.PropertyType) != null)
                return true;

            if (!property.PropertyType.GetTypeInfo().IsValueType)
                return IsNullableReferenceType(property);

            return false;
        }

        private static bool IsNullableReferenceType(PropertyInfo property)
        {
            object[] nullableAttributes = property.GetCustomAttributes(false);

            foreach (object attribute in nullableAttributes)
            {
                Type attributeType = attribute.GetType();

                if (attributeType.FullName == "System.Runtime.CompilerServices.NullableAttribute")
                {
                    FieldInfo? flagsField = attributeType.GetField("NullableFlags");

                    if (flagsField != null)
                    {
                        byte[]? flags = flagsField.GetValue(attribute) as byte[];

                        if (flags != null && flags.Length > 0)
                            return flags[0] == 2;
                    }

                    FieldInfo? flagField = attributeType.GetField("NullableFlag");

                    if (flagField != null)
                    {
                        object? value = flagField.GetValue(attribute);

                        if (value is byte flag)
                            return flag == 2;
                    }
                }
            }

            object[] declaringTypeAttributes =
                property.DeclaringType?.GetCustomAttributes(false) ?? Array.Empty<object>();

            foreach (object attribute in declaringTypeAttributes)
            {
                Type attributeType = attribute.GetType();

                if (attributeType.FullName == "System.Runtime.CompilerServices.NullableContextAttribute")
                {
                    FieldInfo? flagField = attributeType.GetField("Flag");

                    if (flagField != null)
                    {
                        object? value = flagField.GetValue(attribute);

                        if (value is byte flag)
                            return flag == 2;
                    }
                }
            }

            return false;
        }

        private static string ToCamelCase(string value)
        {
            if (string.IsNullOrEmpty(value) || !char.IsUpper(value[0]))
                return value;

            return char.ToLowerInvariant(value[0]) + value.Substring(1);
        }
    }
}