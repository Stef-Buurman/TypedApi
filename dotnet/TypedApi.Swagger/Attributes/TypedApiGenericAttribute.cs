namespace TypedApi.Swagger.Attributes;

/// <summary>
/// Marks a generic API contract whose closed OpenAPI schemas should be reconstructed
/// as one generic TypeScript declaration by the TypedApi client generator.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct | AttributeTargets.Interface, Inherited = false)]
public sealed class TypedApiGenericAttribute : Attribute
{
    public TypedApiGenericAttribute(string? name = null)
    {
        Name = name;
    }

    /// <summary>Optional frontend generic name. The CLR generic type name is used when omitted.</summary>
    public string? Name { get; }
}
