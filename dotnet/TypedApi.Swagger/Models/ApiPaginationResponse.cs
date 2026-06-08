using System.Collections.Generic;

namespace TypedApi.Swagger.Models
{
    public class ApiPaginationResponse<T>
    {
        public List<T> Data { get; set; } = [];
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
    }
}