using TypedApi.Swagger.Attributes;
using TypedApi.Swagger.Enums;
using TypedApi.Swagger.Interfaces;

namespace TypedApi.Swagger.Models
{
    [TypedApiGeneric]
    public class ApiPaginationSortResponse<T> : ApiPaginationResponse<T>, IApiSortResponse
    {
        public virtual string? SortBy { get; set; }
        public virtual SortDirection SortDirection { get; set; } = SortDirection.Desc;
    }
}