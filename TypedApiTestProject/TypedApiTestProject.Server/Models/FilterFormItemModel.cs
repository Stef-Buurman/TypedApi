namespace TypedApiTestProject.Server.Models;

public sealed class FilterFormItemModel
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Category { get; set; }
    public int Score { get; set; }
    public bool Active { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
