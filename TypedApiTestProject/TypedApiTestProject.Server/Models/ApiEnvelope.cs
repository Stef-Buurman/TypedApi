using TypedApi.Swagger.Attributes;

namespace TypedApiTestProject.Server.Models;

[TypedApiGeneric]
public class ApiEnvelope<T>
{
    public required T Data { get; set; }
    public List<T> RelatedItems { get; set; } = [];
    public Dictionary<string, T> ItemsByKey { get; set; } = [];
    public required string CorrelationId { get; set; }
    public List<string> Warnings { get; set; } = [];
}
