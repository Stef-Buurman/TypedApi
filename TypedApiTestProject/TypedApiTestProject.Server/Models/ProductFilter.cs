using TypedApi.Swagger.Models.Filters;

namespace TypedApiTestProject.Server.Models;

public class ProductFilter : PaginationFilter
{
    public Guid[]? ProductIds { get; set; }
    public string? Search { get; set; }
    public string[]? Skus { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? MinStock { get; set; }
    public int? MaxStock { get; set; }
    public bool? Active { get; set; }
    public Guid? SupplierId { get; set; }
    public DateTime? CreatedFrom { get; set; }
    public DateTime? CreatedTo { get; set; }
}
