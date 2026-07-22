using Microsoft.AspNetCore.Mvc;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers;

[ApiController]
[Route("api/inheritance")]
public class InheritanceController : ControllerBase
{
    private static readonly Guid OwnerId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid MemberId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid MilestoneId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    [HttpGet("team-member")]
    public ActionResult<TeamMemberModel> GetTeamMember()
    {
        return Ok(CreateOwner());
    }

    [HttpGet("project")]
    public ActionResult<ProjectModel> GetProject()
    {
        return Ok(CreateProject());
    }

    [HttpPost("project")]
    public ActionResult<ProjectModel> EchoProject(ProjectModel project)
    {
        return Ok(project);
    }

    private static ProjectModel CreateProject()
    {
        return new ProjectModel
        {
            Id = ProjectId,
            CreatedBy = "project-service",
            CreatedAt = new DateTimeOffset(2026, 7, 1, 8, 30, 0, TimeSpan.Zero),
            UpdatedBy = "release-manager",
            UpdatedAt = new DateTimeOffset(2026, 7, 20, 14, 15, 0, TimeSpan.Zero),
            IsActive = true,
            Revision = 7,
            Code = "TYPED-API",
            Name = "Typed API test project",
            OwnerId = OwnerId,
            Owner = CreateOwner(),
            Members = [CreateOwner(), CreateMember()],
            Milestones =
            [
                new ProjectMilestoneModel
                {
                    Id = MilestoneId,
                    CreatedBy = "project-service",
                    CreatedAt = new DateTimeOffset(2026, 7, 2, 10, 0, 0, TimeSpan.Zero),
                    UpdatedBy = null,
                    UpdatedAt = null,
                    IsActive = true,
                    Revision = 1,
                    Title = "Verify generated inheritance",
                    DueAt = new DateTimeOffset(2026, 8, 1, 16, 0, 0, TimeSpan.Zero),
                    Completed = false,
                    Notes = "Confirm inherited and nested properties are strongly typed."
                }
            ],
            Budget = 12500.50m,
            PlannedReleaseAt = new DateTimeOffset(2026, 8, 15, 9, 0, 0, TimeSpan.Zero)
        };
    }

    private static TeamMemberModel CreateOwner()
    {
        return new TeamMemberModel
        {
            Id = OwnerId,
            CreatedBy = "identity-service",
            CreatedAt = new DateTimeOffset(2026, 6, 10, 9, 0, 0, TimeSpan.Zero),
            UpdatedBy = "admin-user",
            UpdatedAt = new DateTimeOffset(2026, 7, 10, 11, 45, 0, TimeSpan.Zero),
            IsActive = true,
            Revision = 3,
            DisplayName = "Alex Morgan",
            Email = "alex.morgan@example.com",
            Department = "Engineering"
        };
    }

    private static TeamMemberModel CreateMember()
    {
        return new TeamMemberModel
        {
            Id = MemberId,
            CreatedBy = "identity-service",
            CreatedAt = new DateTimeOffset(2026, 6, 12, 13, 30, 0, TimeSpan.Zero),
            UpdatedBy = null,
            UpdatedAt = null,
            IsActive = true,
            Revision = 1,
            DisplayName = "Jamie Lee",
            Email = "jamie.lee@example.com",
            Department = "Quality Assurance"
        };
    }
}
