using TypedApi.Swagger.Interfaces;

namespace TypedApi.Swagger.Models;

/// <summary>Paginated response data and paging metadata.</summary>
public class ApiPaginationResponse<T> : IApiPaginationResponse<T>
{
    public List<T> Data { get; set; } = new();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }

    [Obsolete("Use TotalCount. TotalRecords is retained as a compatibility alias.")]
    public int TotalRecords
    {
        get => TotalCount;
        set => TotalCount = value;
    }
}
