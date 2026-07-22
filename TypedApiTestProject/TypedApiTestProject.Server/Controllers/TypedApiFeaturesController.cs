using Microsoft.AspNetCore.Mvc;
using TypedApi.Swagger.Enums;
using TypedApi.Swagger.Models;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers;

[ApiController]
[Route("api/typed-api-features")]
public class TypedApiFeaturesController : ControllerBase
{
    [HttpGet("projects")]
    public ActionResult<ApiPaginationSortResponse<ProjectModel>> GetProjects()
    {
        return Ok(new ApiPaginationSortResponse<ProjectModel>
        {
            Data = [],
            PageNumber = 1,
            PageSize = 25,
            TotalCount = 0,
            TotalPages = 0,
            SortBy = nameof(ProjectModel.Name),
            SortDirection = SortDirection.Asc
        });
    }

    [HttpGet("team-member-envelope")]
    public ActionResult<ApiEnvelope<TeamMemberModel>> GetTeamMemberEnvelope()
    {
        var teamMember = new TeamMemberModel
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            CreatedBy = "feature-controller",
            CreatedAt = new DateTimeOffset(2026, 7, 22, 8, 0, 0, TimeSpan.Zero),
            UpdatedBy = null,
            UpdatedAt = null,
            IsActive = true,
            Revision = 1,
            DisplayName = "Taylor Example",
            Email = "taylor@example.com",
            Department = null
        };

        return Ok(new ApiEnvelope<TeamMemberModel>
        {
            CorrelationId = "typedapi-test-correlation",
            Warnings = ["This response tests direct, collection, and dictionary generic bindings."],
            Data = teamMember,
            RelatedItems = [teamMember],
            ItemsByKey = new Dictionary<string, TeamMemberModel> { ["owner"] = teamMember }
        });
    }

    [HttpGet("nullability")]
    public ActionResult<NullabilityContract> GetNullability()
    {
        return Ok(CreateNullabilityContract());
    }

    [HttpPost("nullability")]
    public ActionResult<NullabilityContract> EchoNullability(NullabilityContract request)
    {
        return Ok(request);
    }

    [HttpGet("notification")]
    public ActionResult<NotificationModel> GetNotification()
    {
        return Ok(new EmailNotificationModel
        {
            Message = "The generated frontend should narrow this union by kind.",
            CreatedAt = new DateTimeOffset(2026, 7, 22, 8, 30, 0, TimeSpan.Zero),
            EmailAddress = "alerts@example.com",
            Subject = "TypedApi discriminator test"
        });
    }

    [HttpPost("notification")]
    public ActionResult<NotificationModel> EchoNotification(NotificationModel request)
    {
        return Ok(request);
    }

    [HttpGet("projects/{id:guid}")]
    [ProducesResponseType<ProjectModel>(StatusCodes.Status200OK)]
    [ProducesResponseType<HttpValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public ActionResult<ProjectModel> GetProjectWithTypedErrors(Guid id)
    {
        if (id == Guid.Empty)
        {
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [nameof(id)] = ["The project ID may not be empty."]
            }));
        }

        return NotFound(new ProblemDetails
        {
            Title = "Project not found",
            Detail = $"No project exists with ID {id}.",
            Status = StatusCodes.Status404NotFound
        });
    }

    private static NullabilityContract CreateNullabilityContract()
    {
        return new NullabilityContract
        {
            RequiredText = "Always present and non-null.",
            RequiredNullableText = null,
            JsonRequiredNullableText = null,
            ValidatedText = "Required by validation and non-null in the API contract.",
            OptionalNullableText = null,
            RequiredCount = 3,
            OptionalCount = null
        };
    }
}
