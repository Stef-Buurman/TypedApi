using System.ComponentModel.DataAnnotations;

namespace TypedApiTestProject.Server.Models.Abstract;

public abstract class AuditableModel<T> where T : class
{
    [Key]
    public Guid Id { get; set; }
    public required string CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public bool IsActive { get; set; }
    public int Revision { get; set; }

    public abstract bool Equals(T? other);

    public override bool Equals(object? obj)
    {
        return obj is T other && Equals(other);
    }

    public abstract string GetCustomKey();

    public override int GetHashCode()
    {
        return HashCode.Combine(GetCustomKey());
    }
}
