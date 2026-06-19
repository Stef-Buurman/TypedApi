namespace TypedApiTestProject.Server.Models;

public class EndpointCoverageModel
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? OptionalDescription { get; set; }
    public int Count { get; set; }
    public bool Enabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Tags { get; set; } = [];
    public Dictionary<string, string> Metadata { get; set; } = [];
}
