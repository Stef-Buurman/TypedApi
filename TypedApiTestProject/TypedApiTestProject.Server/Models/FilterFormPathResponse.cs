namespace TypedApiTestProject.Server.Models;

public sealed class FilterFormPathResponse
{
    public required string Scope { get; set; }
    public required FilterFormQuery Filter { get; set; }
}
