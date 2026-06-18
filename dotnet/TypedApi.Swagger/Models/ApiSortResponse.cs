using TypedApi.Swagger.Enums;
using TypedApi.Swagger.Interfaces;

namespace TypedApi.Swagger.Models
{
    public class ApiSortResponse: IApiSortResponse
    {
        public virtual string? SortBy { get; set; }
        public virtual SortDirection SortDirection { get; set; } = SortDirection.Desc;
    }
}