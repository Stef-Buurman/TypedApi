using TypedApi.Swagger.Models.Filters;

namespace TypedApiTestProject.Server.Models;

public class SupplierFilter : PaginationFilter
{
    public Guid[]? SupplierIds { get; set; }
    public string? CompanyName { get; set; }
    public string[]? CountryCodes { get; set; }
    public bool? Verified { get; set; }
    public DateTime? CreatedFrom { get; set; }
    public DateTime? CreatedTo { get; set; }
}
