using Microsoft.AspNetCore.Mvc;
using TypedApi.Swagger.Attributes;
using TypedApi.Swagger.Enums;
using TypedApi.Swagger.Models;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers;

[ApiController]
[Route("api/filter-form")]
public sealed class FilterFormController : ControllerBase
{
    private static readonly IReadOnlyList<FilterFormItemModel> Items =
    [
        new()
        {
            Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
            Name = "Amsterdam Alpha",
            Category = "city",
            Score = 10,
            Active = true,
            CreatedAt = new DateTimeOffset(2026, 1, 10, 8, 0, 0, TimeSpan.Zero)
        },
        new()
        {
            Id = Guid.Parse("10000000-0000-0000-0000-000000000002"),
            Name = "Rotterdam Beta",
            Category = "harbour",
            Score = 25,
            Active = false,
            CreatedAt = new DateTimeOffset(2026, 3, 15, 9, 30, 0, TimeSpan.Zero)
        },
        new()
        {
            Id = Guid.Parse("10000000-0000-0000-0000-000000000003"),
            Name = "Utrecht Gamma",
            Category = "city",
            Score = 50,
            Active = true,
            CreatedAt = new DateTimeOffset(2026, 6, 20, 11, 45, 0, TimeSpan.Zero)
        }
    ];

    [TypedApiFilterForm]
    [HttpGet("method-attribute")]
    public ActionResult<FilterFormQuery> GetWithMethodAttribute([FromQuery] FilterFormQuery filter)
    {
        return Ok(filter);
    }

    [HttpGet("parameter-attribute")]
    public ActionResult<FilterFormQuery> GetWithParameterAttribute(
        [FromQuery, TypedApiFilterForm] FilterFormQuery filter)
    {
        return Ok(filter);
    }

    [HttpGet("map-items")]
    public ActionResult<FilterFormMapQuery> GetMapItems(
        [FromQuery, TypedApiFilterForm] FilterFormMapQuery filter)
    {
        return Ok(filter);
    }

    [HttpGet("unmarked")]
    public ActionResult<FilterFormQuery> GetUnmarked([FromQuery] FilterFormQuery filter)
    {
        return Ok(filter);
    }

    // Pagination remains the higher-priority generation mode, even when this
    // attribute is present. This verifies that existing buildQuery generation
    // is not changed by the new opt-in feature.
    [TypedApiFilterForm]
    [HttpGet("paged")]
    public ActionResult<ApiPaginationSortResponse<FilterFormItemModel>> GetPaged(
        [FromQuery] FilterFormPagedQuery filter)
    {
        IEnumerable<FilterFormItemModel> query = Items;

        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(item => item.Name.Contains(filter.Search, StringComparison.OrdinalIgnoreCase));

        if (filter.MinScore.HasValue)
            query = query.Where(item => item.Score >= filter.MinScore.Value);

        if (filter.MaxScore.HasValue)
            query = query.Where(item => item.Score <= filter.MaxScore.Value);

        if (filter.Active.HasValue)
            query = query.Where(item => item.Active == filter.Active.Value);

        if (filter.Categories is { Length: > 0 })
            query = query.Where(item => filter.Categories.Contains(item.Category, StringComparer.OrdinalIgnoreCase));

        query = (filter.SortBy?.ToLowerInvariant(), filter.SortDirection) switch
        {
            ("name", SortDirection.Asc) => query.OrderBy(item => item.Name),
            ("name", SortDirection.Desc) => query.OrderByDescending(item => item.Name),
            ("score", SortDirection.Asc) => query.OrderBy(item => item.Score),
            ("score", SortDirection.Desc) => query.OrderByDescending(item => item.Score),
            _ => query.OrderBy(item => item.Id)
        };

        var totalCount = query.Count();
        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);
        var data = query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new ApiPaginationSortResponse<FilterFormItemModel>
        {
            Data = data,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            SortBy = filter.SortBy,
            SortDirection = filter.SortDirection
        });
    }

    // This deliberately combines path and query parameters. The generator must
    // fall back to its regular request-parameter object instead of producing a
    // filter-form method, because filter-form generation is query-only.
    [TypedApiFilterForm]
    [HttpGet("scope/{scope}")]
    public ActionResult<FilterFormPathResponse> GetMixedPathAndQuery(
        string scope,
        [FromQuery] FilterFormQuery filter)
    {
        return Ok(new FilterFormPathResponse
        {
            Scope = scope,
            Filter = filter
        });
    }

    [HttpGet("header")]
    public ActionResult<FilterFormHeaderResponse> GetHeaderAndQuery(
        [FromHeader(Name = "X-Test-Run")] string testRun,
        [FromQuery] string? search = null)
    {
        return Ok(new FilterFormHeaderResponse
        {
            TestRun = testRun,
            Search = search
        });
    }
}
