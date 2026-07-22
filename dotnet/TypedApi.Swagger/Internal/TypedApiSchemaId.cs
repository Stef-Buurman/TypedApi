namespace TypedApi.Swagger.Internal;

internal static class TypedApiSchemaId
{
    public static string Get(Type type)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;

        if (type.IsArray)
            return $"{Get(type.GetElementType()!)}Array";

        if (!type.IsGenericType)
            return Sanitize(type.Name);

        var definitionName = RemoveGenericArity(type.GetGenericTypeDefinition().Name);
        var arguments = string.Join("And", type.GetGenericArguments().Select(Get));
        return $"{Sanitize(definitionName)}Of{arguments}";
    }

    public static string GetGenericDefinitionName(Type genericTypeDefinition)
    {
        return Sanitize(RemoveGenericArity(genericTypeDefinition.Name));
    }

    public static string? GetPrimitiveType(Type type)
    {
        type = Nullable.GetUnderlyingType(type) ?? type;

        if (type == typeof(string) || type == typeof(char) || type == typeof(Guid)
            || type == typeof(DateTime) || type == typeof(DateTimeOffset)
            || type == typeof(DateOnly) || type == typeof(TimeOnly) || type == typeof(TimeSpan))
            return "string";

        if (type == typeof(bool)) return "boolean";

        if (type.IsPrimitive || type == typeof(decimal))
            return "number";

        return null;
    }

    private static string RemoveGenericArity(string name)
    {
        var index = name.IndexOf('`');
        return index < 0 ? name : name[..index];
    }

    private static string Sanitize(string value)
    {
        return value.Replace("+", string.Empty).Replace(".", string.Empty);
    }
}
