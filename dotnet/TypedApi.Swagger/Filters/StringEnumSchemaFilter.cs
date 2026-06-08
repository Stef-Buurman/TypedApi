using System;
using Swashbuckle.AspNetCore.SwaggerGen;

#if NET10_0_OR_GREATER
using System.Collections.Generic;
using System.Text.Json.Nodes;
using Microsoft.OpenApi;
#else
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
#endif

namespace TypedApi.Swagger.Filters;

public sealed class StringEnumSchemaFilter : ISchemaFilter
{
#if NET10_0_OR_GREATER
    public void Apply(
        IOpenApiSchema schema,
        SchemaFilterContext context)
    {
        var enumType =
            Nullable.GetUnderlyingType(context.Type)
            ?? context.Type;

        if (!enumType.IsEnum)
        {
            return;
        }

        // In Microsoft.OpenApi 2.x, the interface is read-only for
        // several properties. Mutate the concrete schema instance.
        if (schema is not OpenApiSchema openApiSchema)
        {
            return;
        }

        openApiSchema.Type = JsonSchemaType.String;
        openApiSchema.Format = null;
        openApiSchema.Enum = new List<JsonNode>();

        foreach (var name in Enum.GetNames(enumType))
        {
            openApiSchema.Enum.Add(name);
        }
    }
#else
    public void Apply(
        OpenApiSchema schema,
        SchemaFilterContext context)
    {
        var enumType =
            Nullable.GetUnderlyingType(context.Type)
            ?? context.Type;

        if (!enumType.IsEnum)
        {
            return;
        }

        schema.Type = "string";
        schema.Format = null;
        schema.Enum.Clear();

        foreach (var name in Enum.GetNames(enumType))
        {
            schema.Enum.Add(new OpenApiString(name));
        }
    }
#endif
}