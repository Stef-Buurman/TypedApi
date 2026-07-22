using TypedApiTestProject.Server.Models.Abstract;

namespace TypedApiTestProject.Server.Models;

public class ProjectMilestoneModel : AuditableModel<ProjectMilestoneModel>
{
    public required string Title { get; set; }
    public DateTimeOffset DueAt { get; set; }
    public bool Completed { get; set; }
    public string? Notes { get; set; }

    public override bool Equals(ProjectMilestoneModel? other)
    {
        return other != null && Title == other.Title && DueAt == other.DueAt;
    }

    public override string GetCustomKey() => $"{Title}|{DueAt:O}";
}
