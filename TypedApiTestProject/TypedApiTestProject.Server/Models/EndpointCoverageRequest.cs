namespace TypedApiTestProject.Server.Models;

public class EndpointCoverageRequest
{
    public string Name { get; set; } = "";
    public string? OptionalDescription { get; set; }
    public int Count { get; set; }
    public bool Enabled { get; set; }
    public List<string> Tags { get; set; } = [];
}
