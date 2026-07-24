namespace TypedApi.Swagger.Attributes;

/// <summary>
/// Marks an endpoint or query parameter whose query values should be exposed as
/// <c>FilterFormValues&lt;TQuery&gt;</c> by the TypedApi TypeScript generator.
/// </summary>
[AttributeUsage(
    AttributeTargets.Method | AttributeTargets.Parameter,
    Inherited = true,
    AllowMultiple = false)]
public sealed class TypedApiFilterFormAttribute : Attribute
{
}
