using TypedApi.Swagger.Models.Filters;

namespace TypedApiTestProject.Server.Models;

public class WarehouseFilter : PaginationFilter
{
    public string? Search { get; set; }
    public string[]? CountryCodes { get; set; }
    public int? MinCapacity { get; set; }
    public int? MaxCapacity { get; set; }
    public bool? IsActive { get; set; }
}
