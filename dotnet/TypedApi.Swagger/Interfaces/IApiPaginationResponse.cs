namespace TypedApi.Swagger.Interfaces;

/// <summary>Common response contract for paginated endpoints.</summary>
public interface IApiPaginationResponse<T>
{
    List<T> Data { get; set; }
    int PageNumber { get; set; }
    int PageSize { get; set; }
    int TotalCount { get; set; }
    int TotalPages { get; set; }

    [Obsolete("Use TotalCount. TotalRecords is retained as a compatibility alias.")]
    int TotalRecords { get; set; }
}
