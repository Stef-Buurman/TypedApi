using Microsoft.AspNetCore.Mvc;
using TypedApi.Swagger.Enums;
using TypedApi.Swagger.Models;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers;

[ApiController]
[Route("api/suppliers")]
public class SupplierController : ControllerBase
{
    private static readonly List<SupplierModel> Suppliers =
    [
        new()
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            CompanyName = "Northwind Supplies",
            ContactEmail = "contact@northwind.test",
            CountryCode = "NL",
            Verified = true,
            CreatedAt = DateTime.UtcNow.AddDays(-30)
        },
        new()
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            CompanyName = "Contoso Wholesale",
            ContactEmail = "sales@contoso.test",
            CountryCode = "DE",
            Verified = false,
            CreatedAt = DateTime.UtcNow.AddDays(-8)
        }
    ];

    [HttpGet]
    public ActionResult<ApiPaginationResponse<SupplierModel>> GetSuppliers([FromQuery] SupplierFilter filter)
    {
        var query = Suppliers.AsEnumerable();

        if (filter.SupplierIds is { Length: > 0 })
            query = query.Where(supplier => filter.SupplierIds.Contains(supplier.Id));

        if (!string.IsNullOrWhiteSpace(filter.CompanyName))
            query = query.Where(supplier => supplier.CompanyName.Contains(filter.CompanyName, StringComparison.OrdinalIgnoreCase));

        if (filter.CountryCodes is { Length: > 0 })
            query = query.Where(supplier => filter.CountryCodes.Contains(supplier.CountryCode));

        if (filter.Verified.HasValue)
            query = query.Where(supplier => supplier.Verified == filter.Verified.Value);

        if (filter.CreatedFrom.HasValue)
            query = query.Where(supplier => supplier.CreatedAt >= filter.CreatedFrom.Value);

        if (filter.CreatedTo.HasValue)
            query = query.Where(supplier => supplier.CreatedAt <= filter.CreatedTo.Value);

        query = (filter.SortBy?.ToLowerInvariant(), filter.SortDirection) switch
        {
            ("companyname", SortDirection.Asc) => query.OrderBy(supplier => supplier.CompanyName),
            ("companyname", SortDirection.Desc) => query.OrderByDescending(supplier => supplier.CompanyName),
            ("countrycode", SortDirection.Asc) => query.OrderBy(supplier => supplier.CountryCode),
            ("countrycode", SortDirection.Desc) => query.OrderByDescending(supplier => supplier.CountryCode),
            ("createdat", SortDirection.Asc) => query.OrderBy(supplier => supplier.CreatedAt),
            ("createdat", SortDirection.Desc) => query.OrderByDescending(supplier => supplier.CreatedAt),
            _ => query
        };

        var totalRecords = query.Count();
        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 500);
        var data = query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new ApiPaginationResponse<SupplierModel>
        {
            Data = data,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = data.Count,
            TotalPages = (int)Math.Ceiling(totalRecords / (double)pageSize),
            TotalRecords = totalRecords
        });
    }

    [HttpGet("{id}")]
    public ActionResult<SupplierModel> GetSupplierById(Guid id)
    {
        var supplier = Suppliers.FirstOrDefault(supplier => supplier.Id == id);
        return supplier == null ? NotFound() : Ok(supplier);
    }

    [HttpPost]
    public ActionResult<SupplierModel> CreateSupplier(SupplierRequest request)
    {
        var supplier = new SupplierModel
        {
            Id = Guid.NewGuid(),
            CompanyName = request.CompanyName,
            ContactEmail = request.ContactEmail,
            CountryCode = request.CountryCode,
            Verified = request.Verified,
            CreatedAt = DateTime.UtcNow
        };

        Suppliers.Add(supplier);
        return CreatedAtAction(nameof(GetSupplierById), new { id = supplier.Id }, supplier);
    }

    [HttpPut("{id}")]
    public ActionResult<SupplierModel> UpdateSupplier(Guid id, SupplierRequest request)
    {
        var supplier = Suppliers.FirstOrDefault(supplier => supplier.Id == id);
        if (supplier == null) return NotFound();

        supplier.CompanyName = request.CompanyName;
        supplier.ContactEmail = request.ContactEmail;
        supplier.CountryCode = request.CountryCode;
        supplier.Verified = request.Verified;
        return Ok(supplier);
    }

    [HttpPost("{id}/verify")]
    public ActionResult<SupplierModel> VerifySupplier(Guid id)
    {
        var supplier = Suppliers.FirstOrDefault(supplier => supplier.Id == id);
        if (supplier == null) return NotFound();

        supplier.Verified = true;
        return Ok(supplier);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteSupplier(Guid id)
    {
        var supplier = Suppliers.FirstOrDefault(supplier => supplier.Id == id);
        if (supplier == null) return NotFound();

        Suppliers.Remove(supplier);
        return NoContent();
    }
}
