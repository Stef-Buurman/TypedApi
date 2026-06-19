using System.Text;
using Microsoft.AspNetCore.Mvc;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers;

[ApiController]
[Route("api/endpoint-coverage")]
public class EndpointCoverageController : ControllerBase
{
    private static readonly EndpointCoverageModel Sample = new()
    {
        Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        Name = "Coverage sample",
        OptionalDescription = null,
        Count = 3,
        Enabled = true,
        CreatedAt = DateTime.UtcNow,
        Tags = ["openapi", "typed-client"],
        Metadata = new Dictionary<string, string>
        {
            ["source"] = "test-project",
            ["purpose"] = "endpoint-coverage"
        }
    };

    [HttpGet("object")]
    public ActionResult<EndpointCoverageModel> GetObject()
    {
        return Ok(Sample);
    }

    [HttpGet("array")]
    public ActionResult<List<EndpointCoverageModel>> GetArray()
    {
        return Ok(new List<EndpointCoverageModel> { Sample });
    }

    [HttpGet("primitive")]
    public ActionResult<int> GetPrimitive()
    {
        return Ok(42);
    }

    [HttpGet("dictionary")]
    public ActionResult<Dictionary<string, int>> GetDictionary()
    {
        return Ok(new Dictionary<string, int>
        {
            ["active"] = 2,
            ["inactive"] = 1
        });
    }

    [HttpGet("text")]
    [Produces("text/plain")]
    public ContentResult GetText()
    {
        return Content("plain-text-response", "text/plain");
    }

    [HttpGet("download")]
    [Produces("application/octet-stream")]
    public FileContentResult DownloadFile()
    {
        return File(
            Encoding.UTF8.GetBytes("typed-api-file-response"),
            "application/octet-stream",
            "typed-api-sample.txt");
    }

    [HttpGet("{id}/details")]
    public ActionResult<EndpointCoverageModel> GetPathAndQuery(
        Guid id,
        [FromQuery] bool includeMetadata = false,
        [FromQuery] string? culture = null)
    {
        return Ok(new EndpointCoverageModel
        {
            Id = id,
            Name = $"Details ({culture ?? "default"})",
            Count = 1,
            Enabled = true,
            CreatedAt = DateTime.UtcNow,
            Tags = ["path", "query"],
            Metadata = includeMetadata
                ? new Dictionary<string, string> { ["included"] = "true" }
                : []
        });
    }

    [HttpPost("json")]
    public ActionResult<EndpointCoverageModel> PostJson(EndpointCoverageRequest request)
    {
        return Created(string.Empty, ToModel(request));
    }

    [HttpPost("primitive-body")]
    public ActionResult<string> PostPrimitiveBody([FromBody] string value)
    {
        return Ok(value);
    }

    [HttpPost("url-encoded")]
    [Consumes("application/x-www-form-urlencoded")]
    public ActionResult<EndpointCoverageModel> PostUrlEncoded([FromForm] UrlEncodedRequest request)
    {
        return Ok(new EndpointCoverageModel
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Count = request.Count,
            Enabled = request.Enabled,
            CreatedAt = DateTime.UtcNow
        });
    }

    [HttpPost("accepted")]
    [ProducesResponseType<EndpointCoverageModel>(StatusCodes.Status202Accepted)]
    public ActionResult<EndpointCoverageModel> PostAccepted(EndpointCoverageRequest request)
    {
        return Accepted(ToModel(request));
    }

    [HttpPatch("{id}")]
    public ActionResult<EndpointCoverageModel> PatchJson(Guid id, EndpointCoveragePatchRequest request)
    {
        return Ok(new EndpointCoverageModel
        {
            Id = id,
            Name = request.Name ?? Sample.Name,
            OptionalDescription = Sample.OptionalDescription,
            Count = request.Count ?? Sample.Count,
            Enabled = request.Enabled ?? Sample.Enabled,
            CreatedAt = Sample.CreatedAt,
            Tags = Sample.Tags,
            Metadata = Sample.Metadata
        });
    }

    [HttpDelete("{id}/no-content")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult DeleteNoContent(Guid id)
    {
        return NoContent();
    }

    private static EndpointCoverageModel ToModel(EndpointCoverageRequest request)
    {
        return new EndpointCoverageModel
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            OptionalDescription = request.OptionalDescription,
            Count = request.Count,
            Enabled = request.Enabled,
            CreatedAt = DateTime.UtcNow,
            Tags = request.Tags,
            Metadata = []
        };
    }
}
