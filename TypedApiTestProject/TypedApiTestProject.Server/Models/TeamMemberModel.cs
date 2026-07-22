using TypedApiTestProject.Server.Models.Abstract;

namespace TypedApiTestProject.Server.Models;

public class TeamMemberModel : AuditableModel<TeamMemberModel>
{
    public required string DisplayName { get; set; }
    public required string Email { get; set; }
    public string? Department { get; set; }

    public override bool Equals(TeamMemberModel? other)
    {
        return other != null && Email == other.Email;
    }

    public override string GetCustomKey() => Email;
}
