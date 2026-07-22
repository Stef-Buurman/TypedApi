using TypedApiTestProject.Server.Models.Abstract;

namespace TypedApiTestProject.Server.Models;

public class ProjectModel : AuditableModel<ProjectModel>
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public Guid OwnerId { get; set; }
    public required TeamMemberModel Owner { get; set; }
    public List<TeamMemberModel> Members { get; set; } = [];
    public List<ProjectMilestoneModel> Milestones { get; set; } = [];
    public decimal Budget { get; set; }
    public DateTimeOffset PlannedReleaseAt { get; set; }

    public override bool Equals(ProjectModel? other)
    {
        return other != null && Code == other.Code;
    }

    public override string GetCustomKey() => Code;
}
