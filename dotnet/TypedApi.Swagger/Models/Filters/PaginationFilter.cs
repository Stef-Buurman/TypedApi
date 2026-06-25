using System.ComponentModel.DataAnnotations;
using TypedApi.Swagger.Enums;

namespace TypedApi.Swagger.Models.Filters;

/// <summary>Reusable pagination and sorting query values.</summary>
public class PaginationFilter
{
    /// <summary>The one-based page number.</summary>
    [Range(1, int.MaxValue)]
    public int PageNumber { get; set; } = 1;

    /// <summary>The number of records per page.</summary>
    public virtual int PageSize { get; set; } = 100;

    /// <summary>The response field used for sorting.</summary>
    public virtual string? SortBy { get; set; }

    /// <summary>The requested sort direction.</summary>
    public virtual SortDirection SortDirection { get; set; } = SortDirection.Default;
}
