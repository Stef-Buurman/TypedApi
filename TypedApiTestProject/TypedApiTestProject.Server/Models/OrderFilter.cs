using TypedApi.Swagger.Models.Filters;

namespace TypedApiTestProject.Server.Models;

public class OrderFilter : PaginationFilter
{
    public Guid[]? OrderIds { get; set; }
    public string? OrderNumber { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? SupplierId { get; set; }
    public int? MinQuantity { get; set; }
    public int? MaxQuantity { get; set; }
    public decimal? MinTotalPrice { get; set; }
    public decimal? MaxTotalPrice { get; set; }
    public DateTime? OrderedFrom { get; set; }
    public DateTime? OrderedTo { get; set; }
    public OrderStatus? Status { get; set; }
    public OrderStatus[]? Statuses { get; set; }
}
