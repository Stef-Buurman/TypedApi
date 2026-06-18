namespace TypedApi.Swagger.Interfaces
{
    public interface IApiPaginationResponse<T>
    {
        List<T> Data { get; set; }
        int PageNumber { get; set; }
        int PageSize { get; set; }
        int TotalCount { get; set; }
        int TotalPages { get; set; }
        int TotalRecords { get; set; }
    }
}