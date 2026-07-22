using System.Reflection;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.SwaggerGen;
using TypedApi.Swagger.Attributes;
using TypedApi.Swagger.Internal;

#if NET10_0_OR_GREATER
using System.Text.Json.Nodes;
using Microsoft.OpenApi;
#else
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
#endif

namespace TypedApi.Swagger.Filters;

/// <summary>Adds metadata that allows closed generic schemas to become real TypeScript generics.</summary>
public sealed class TypedApiGenericSchemaFilter : ISchemaFilter
{
    public const string ExtensionName = "x-typedapi-generic";
    private readonly JsonOptions _jsonOptions;

    public TypedApiGenericSchemaFilter(IOptions<JsonOptions> jsonOptions)
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
        var type = context.Type;
        if (!type.IsConstructedGenericType) return;

        var definition = type.GetGenericTypeDefinition();
        var attribute = definition.GetCustomAttributes(typeof(TypedApiGenericAttribute), false)
            .OfType<TypedApiGenericAttribute>()
            .FirstOrDefault();
        if (attribute is null) return;

        var parameters = definition.GetGenericArguments();
        var arguments = type.GetGenericArguments();
        var definitionName = string.IsNullOrWhiteSpace(attribute.Name)
            ? TypedApiSchemaId.GetGenericDefinitionName(definition)
            : attribute.Name!;
        var bindings = GetBindings(definition, parameters);
        var genericBase = GetGenericBase(definition);

#if NET10_0_OR_GREATER
        var parameterNodes = new JsonArray();
        foreach (var parameter in parameters) parameterNodes.Add(parameter.Name);

        var argumentNodes = new JsonArray();
        for (var index = 0; index < arguments.Length; index++)
        {
            var argument = arguments[index];
            argumentNodes.Add(new JsonObject
            {
                ["parameter"] = parameters[index].Name,
                ["schemaId"] = TypedApiSchemaId.GetPrimitiveType(argument) is null ? TypedApiSchemaId.Get(argument) : null,
                ["primitive"] = TypedApiSchemaId.GetPrimitiveType(argument)
            });
        }

        var bindingNodes = new JsonArray();
        foreach (var binding in bindings)
        {
            bindingNodes.Add(new JsonObject
            {
                ["parameter"] = binding.Parameter,
                ["path"] = binding.Path
            });
        }

        var metadataNode = new JsonObject
        {
            ["version"] = 1,
            ["definition"] = definitionName,
            ["parameters"] = parameterNodes,
            ["arguments"] = argumentNodes,
            ["bindings"] = bindingNodes
        };
        if (genericBase is not null) metadataNode["base"] = CreateJsonBaseMetadata(genericBase);

        schema.Extensions ??= new Dictionary<string, IOpenApiExtension>();
        schema.Extensions[ExtensionName] = new JsonNodeExtension(metadataNode);
#else
        var parameterArray = new OpenApiArray();
        foreach (var parameter in parameters) parameterArray.Add(new OpenApiString(parameter.Name));

        var argumentArray = new OpenApiArray();
        for (var index = 0; index < arguments.Length; index++)
        {
            var argument = arguments[index];
            var primitive = TypedApiSchemaId.GetPrimitiveType(argument);
            var item = new OpenApiObject
            {
                ["parameter"] = new OpenApiString(parameters[index].Name)
            };
            if (primitive is null) item["schemaId"] = new OpenApiString(TypedApiSchemaId.Get(argument));
            else item["primitive"] = new OpenApiString(primitive);
            argumentArray.Add(item);
        }

        var bindingArray = new OpenApiArray();
        foreach (var binding in bindings)
        {
            bindingArray.Add(new OpenApiObject
            {
                ["parameter"] = new OpenApiString(binding.Parameter),
                ["path"] = new OpenApiString(binding.Path)
            });
        }

        var metadataObject = new OpenApiObject
        {
            ["version"] = new OpenApiInteger(1),
            ["definition"] = new OpenApiString(definitionName),
            ["parameters"] = parameterArray,
            ["arguments"] = argumentArray,
            ["bindings"] = bindingArray
        };
        if (genericBase is not null) metadataObject["base"] = CreateOpenApiBaseMetadata(genericBase);

        schema.Extensions[ExtensionName] = metadataObject;
#endif
    }

    private GenericBaseMetadata? GetGenericBase(Type definition)
    {
        var baseType = definition.BaseType;
        if (baseType is null || baseType == typeof(object) || !baseType.IsGenericType) return null;

        var baseDefinition = baseType.GetGenericTypeDefinition();
        var attribute = baseDefinition.GetCustomAttributes(typeof(TypedApiGenericAttribute), false)
            .OfType<TypedApiGenericAttribute>()
            .FirstOrDefault();
        if (attribute is null) return null;

        var ownerParameters = definition.GetGenericArguments();
        var baseParameters = baseDefinition.GetGenericArguments();
        var baseArguments = new List<GenericArgumentMetadata>();
        foreach (var argument in baseType.GetGenericArguments())
        {
            var metadata = CreateGenericArgumentMetadata(argument, ownerParameters);
            if (metadata is null) return null;
            baseArguments.Add(metadata);
        }

        var definitionName = string.IsNullOrWhiteSpace(attribute.Name)
            ? TypedApiSchemaId.GetGenericDefinitionName(baseDefinition)
            : attribute.Name!;
        var properties = baseDefinition
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(property => property.GetIndexParameters().Length == 0 && !IsAlwaysIgnored(property))
            .Select(GetSerializedPropertyName)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(property => property, StringComparer.Ordinal)
            .ToArray();

        return new GenericBaseMetadata(
            definitionName,
            baseParameters.Select(parameter => parameter.Name).ToArray(),
            baseArguments,
            properties,
            GetBindings(baseDefinition, baseParameters),
            GetGenericBase(baseDefinition));
    }

    private static GenericArgumentMetadata? CreateGenericArgumentMetadata(
        Type argument,
        IReadOnlyCollection<Type> ownerParameters)
    {
        if (argument.IsGenericParameter && ownerParameters.Contains(argument))
            return new GenericArgumentMetadata(argument.Name, null, null);

        var primitive = TypedApiSchemaId.GetPrimitiveType(argument);
        if (primitive is not null) return new GenericArgumentMetadata(null, primitive, null);
        if (argument.ContainsGenericParameters) return null;
        return new GenericArgumentMetadata(null, null, TypedApiSchemaId.Get(argument));
    }

#if NET10_0_OR_GREATER
    private static JsonObject CreateJsonBaseMetadata(GenericBaseMetadata metadata)
    {
        var parameters = new JsonArray();
        foreach (var parameter in metadata.Parameters) parameters.Add(parameter);

        var arguments = new JsonArray();
        foreach (var argument in metadata.Arguments)
        {
            var node = new JsonObject();
            if (argument.GenericParameter is not null) node["genericParameter"] = argument.GenericParameter;
            else if (argument.Primitive is not null) node["primitive"] = argument.Primitive;
            else if (argument.SchemaId is not null) node["schemaId"] = argument.SchemaId;
            arguments.Add(node);
        }

        var properties = new JsonArray();
        foreach (var property in metadata.Properties) properties.Add(property);

        var bindings = new JsonArray();
        foreach (var binding in metadata.Bindings)
        {
            bindings.Add(new JsonObject
            {
                ["parameter"] = binding.Parameter,
                ["path"] = binding.Path
            });
        }

        var result = new JsonObject
        {
            ["definition"] = metadata.Definition,
            ["parameters"] = parameters,
            ["arguments"] = arguments,
            ["properties"] = properties,
            ["bindings"] = bindings
        };
        if (metadata.Base is not null) result["base"] = CreateJsonBaseMetadata(metadata.Base);
        return result;
    }
#else
    private static OpenApiObject CreateOpenApiBaseMetadata(GenericBaseMetadata metadata)
    {
        var parameters = new OpenApiArray();
        foreach (var parameter in metadata.Parameters) parameters.Add(new OpenApiString(parameter));

        var arguments = new OpenApiArray();
        foreach (var argument in metadata.Arguments)
        {
            var item = new OpenApiObject();
            if (argument.GenericParameter is not null)
                item["genericParameter"] = new OpenApiString(argument.GenericParameter);
            else if (argument.Primitive is not null)
                item["primitive"] = new OpenApiString(argument.Primitive);
            else if (argument.SchemaId is not null)
                item["schemaId"] = new OpenApiString(argument.SchemaId);
            arguments.Add(item);
        }

        var properties = new OpenApiArray();
        foreach (var property in metadata.Properties) properties.Add(new OpenApiString(property));

        var bindings = new OpenApiArray();
        foreach (var binding in metadata.Bindings)
        {
            bindings.Add(new OpenApiObject
            {
                ["parameter"] = new OpenApiString(binding.Parameter),
                ["path"] = new OpenApiString(binding.Path)
            });
        }

        var result = new OpenApiObject
        {
            ["definition"] = new OpenApiString(metadata.Definition),
            ["parameters"] = parameters,
            ["arguments"] = arguments,
            ["properties"] = properties,
            ["bindings"] = bindings
        };
        if (metadata.Base is not null) result["base"] = CreateOpenApiBaseMetadata(metadata.Base);
        return result;
    }
#endif

    private IReadOnlyList<GenericBinding> GetBindings(Type definition, IReadOnlyCollection<Type> parameters)
    {
        var parameterNames = parameters.ToDictionary(parameter => parameter, parameter => parameter.Name);
        var bindings = new List<GenericBinding>();

        foreach (var property in definition.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            if (property.GetIndexParameters().Length > 0 || IsAlwaysIgnored(property)) continue;
            var propertyName = GetSerializedPropertyName(property);
            var propertyType = ResolvePropertyType(definition, property);
            AddBindings(propertyType, $"/properties/{EscapeJsonPointer(propertyName)}", parameterNames, bindings);
        }

        return bindings
            .DistinctBy(binding => (binding.Parameter, binding.Path))
            .OrderBy(binding => binding.Path, StringComparer.Ordinal)
            .ThenBy(binding => binding.Parameter, StringComparer.Ordinal)
            .ToArray();
    }

    private static Type ResolvePropertyType(Type genericDefinition, PropertyInfo property)
    {
        var declaringType = property.DeclaringType;
        if (declaringType is null || declaringType == genericDefinition) return property.PropertyType;

        var declaringDefinition = declaringType.IsGenericType
            ? declaringType.GetGenericTypeDefinition()
            : declaringType;
        var constructedDeclaringType = FindConstructedType(genericDefinition, declaringDefinition);
        if (constructedDeclaringType is null || !declaringDefinition.IsGenericTypeDefinition)
            return property.PropertyType;

        var substitutions = declaringDefinition
            .GetGenericArguments()
            .Zip(constructedDeclaringType.GetGenericArguments(), (parameter, argument) => (parameter, argument))
            .ToDictionary(item => item.parameter, item => item.argument);

        return SubstituteGenericParameters(property.PropertyType, substitutions);
    }

    private static Type? FindConstructedType(Type type, Type targetDefinition)
    {
        for (var current = type; current is not null; current = current.BaseType)
        {
            var currentDefinition = current.IsGenericType ? current.GetGenericTypeDefinition() : current;
            if (currentDefinition == targetDefinition) return current;
        }

        return type.GetInterfaces().FirstOrDefault(candidate =>
        {
            var candidateDefinition = candidate.IsGenericType ? candidate.GetGenericTypeDefinition() : candidate;
            return candidateDefinition == targetDefinition;
        });
    }

    private static Type SubstituteGenericParameters(Type type, IReadOnlyDictionary<Type, Type> substitutions)
    {
        if (substitutions.TryGetValue(type, out var replacement)) return replacement;

        if (type.IsArray)
        {
            var elementType = SubstituteGenericParameters(type.GetElementType()!, substitutions);
            return type.GetArrayRank() == 1 ? elementType.MakeArrayType() : elementType.MakeArrayType(type.GetArrayRank());
        }

        if (type.IsByRef)
            return SubstituteGenericParameters(type.GetElementType()!, substitutions).MakeByRefType();

        if (type.IsPointer)
            return SubstituteGenericParameters(type.GetElementType()!, substitutions).MakePointerType();

        if (!type.IsGenericType) return type;

        var arguments = type.GetGenericArguments()
            .Select(argument => SubstituteGenericParameters(argument, substitutions))
            .ToArray();
        return type.GetGenericTypeDefinition().MakeGenericType(arguments);
    }

    private static void AddBindings(
        Type type,
        string path,
        IReadOnlyDictionary<Type, string> parameterNames,
        ICollection<GenericBinding> bindings)
    {
        if (type.IsGenericParameter && parameterNames.TryGetValue(type, out var parameterName))
        {
            bindings.Add(new GenericBinding(parameterName, path));
            return;
        }

        if (type.IsArray)
        {
            AddBindings(type.GetElementType()!, $"{path}/items", parameterNames, bindings);
            return;
        }

        if (!type.IsGenericType) return;

        var definition = type.GetGenericTypeDefinition();
        var arguments = type.GetGenericArguments();
        if (definition == typeof(Nullable<>))
        {
            AddBindings(arguments[0], path, parameterNames, bindings);
            return;
        }

        if (TryGetDictionaryValueType(type, out var valueType))
        {
            AddBindings(valueType, $"{path}/additionalProperties", parameterNames, bindings);
            return;
        }

        if (TryGetEnumerableElementType(type, out var elementType))
        {
            AddBindings(elementType, $"{path}/items", parameterNames, bindings);
        }
    }

    private static bool TryGetDictionaryValueType(Type type, out Type valueType)
    {
        var dictionaryType = GetConstructedInterface(type, typeof(IDictionary<,>))
            ?? GetConstructedInterface(type, typeof(IReadOnlyDictionary<,>));
        if (dictionaryType is null)
        {
            valueType = null!;
            return false;
        }

        valueType = dictionaryType.GetGenericArguments()[1];
        return true;
    }

    private static bool TryGetEnumerableElementType(Type type, out Type elementType)
    {
        var enumerableType = GetConstructedInterface(type, typeof(IEnumerable<>));
        if (enumerableType is null || type == typeof(string))
        {
            elementType = null!;
            return false;
        }

        elementType = enumerableType.GetGenericArguments()[0];
        return true;
    }

    private static Type? GetConstructedInterface(Type type, Type genericDefinition)
    {
        if (type.IsGenericType && type.GetGenericTypeDefinition() == genericDefinition) return type;
        return type.GetInterfaces().FirstOrDefault(candidate =>
            candidate.IsGenericType && candidate.GetGenericTypeDefinition() == genericDefinition);
    }

    private string GetSerializedPropertyName(PropertyInfo property)
    {
        var explicitName = property.GetCustomAttribute<JsonPropertyNameAttribute>()?.Name;
        if (!string.IsNullOrWhiteSpace(explicitName)) return explicitName;
        return _jsonOptions.JsonSerializerOptions.PropertyNamingPolicy?.ConvertName(property.Name) ?? property.Name;
    }

    private static bool IsAlwaysIgnored(PropertyInfo property)
    {
        var attribute = property.GetCustomAttribute<JsonIgnoreAttribute>();
        return attribute?.Condition == JsonIgnoreCondition.Always;
    }

    private static string EscapeJsonPointer(string value) => value.Replace("~", "~0").Replace("/", "~1");

    private sealed record GenericArgumentMetadata(string? GenericParameter, string? Primitive, string? SchemaId);

    private sealed record GenericBaseMetadata(
        string Definition,
        IReadOnlyList<string> Parameters,
        IReadOnlyList<GenericArgumentMetadata> Arguments,
        IReadOnlyList<string> Properties,
        IReadOnlyList<GenericBinding> Bindings,
        GenericBaseMetadata? Base);

    private sealed record GenericBinding(string Parameter, string Path);
}
