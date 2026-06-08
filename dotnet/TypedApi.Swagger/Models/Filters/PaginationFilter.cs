using TypedApi.Swagger.Enums;

namespace TypedApi.Swagger.Models.Filters
{
    public class PaginationFilter
    {
        public int PageNumber { get; set; } = 1;
        public virtual int PageSize { get; set; } = 100;
        public virtual string? SortBy { get; set; } = null;
        public virtual SortDirection SortDirection { get; set; } = SortDirection.Default;
    }
}
