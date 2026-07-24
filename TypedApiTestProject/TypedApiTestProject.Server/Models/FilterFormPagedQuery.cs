using TypedApi.Swagger.Models.Filters;

namespace TypedApiTestProject.Server.Models;

public sealed class FilterFormPagedQuery : PaginationFilter
{
    public string? Search { get; set; }
    public int? MinScore { get; set; }
    public int? MaxScore { get; set; }
    public bool? Active { get; set; }
    public string[]? Categories { get; set; }
}
