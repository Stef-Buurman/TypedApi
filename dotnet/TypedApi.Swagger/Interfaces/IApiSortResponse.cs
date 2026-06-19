using TypedApi.Swagger.Enums;

namespace TypedApi.Swagger.Interfaces
{
    public interface IApiSortResponse
    {
        string? SortBy { get; set; }
        SortDirection SortDirection { get; set; }
    }
}