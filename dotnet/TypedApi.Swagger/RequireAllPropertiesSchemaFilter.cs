using System;
using System.Collections.Generic;
using System.Reflection;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace TypedApi.Swagger
{
    public class RequireAllPropertiesSchemaFilter : ISchemaFilter
    {
        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            if (schema.Properties == null || context.Type == null)
                return;

            if (schema.Required == null)
                schema.Required = new HashSet<string>();

            foreach (PropertyInfo property in context.Type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                string schemaPropertyName = ToCamelCase(property.Name);

                OpenApiSchema propertySchema;
                if (!schema.Properties.TryGetValue(schemaPropertyName, out propertySchema))
                    continue;

                if (IsNullable(property))
                    continue;

                schema.Required.Add(schemaPropertyName);
                propertySchema.Nullable = false;
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
                    FieldInfo flagsField = attributeType.GetField("NullableFlags");

                    if (flagsField != null)
                    {
                        byte[] flags = flagsField.GetValue(attribute) as byte[];

                        if (flags != null && flags.Length > 0)
                            return flags[0] == 2;
                    }

                    FieldInfo flagField = attributeType.GetField("NullableFlag");

                    if (flagField != null)
                    {
                        byte flag = (byte)flagField.GetValue(attribute);
                        return flag == 2;
                    }
                }
            }

            object[] declaringTypeAttributes = property.DeclaringType.GetCustomAttributes(false);

            foreach (object attribute in declaringTypeAttributes)
            {
                Type attributeType = attribute.GetType();

                if (attributeType.FullName == "System.Runtime.CompilerServices.NullableContextAttribute")
                {
                    FieldInfo flagField = attributeType.GetField("Flag");

                    if (flagField != null)
                    {
                        byte flag = (byte)flagField.GetValue(attribute);
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