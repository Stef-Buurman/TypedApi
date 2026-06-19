using TypedApi.Swagger.Interfaces;

namespace TypedApi.Swagger.Models
{
    public class ApiPaginationResponse<T> : IApiPaginationResponse<T>
    {
        public List<T> Data { get; set; } = new();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public int TotalRecords { get; set; }
    }
}