using Microsoft.AspNetCore.Mvc;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers
{
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
        public ActionResult<ApiPaginationResponse<SupplierModel>> GetSuppliers(
            [FromQuery] Guid[]? supplierIds,
            [FromQuery] string? companyName,
            [FromQuery] string[]? countryCodes,
            [FromQuery] bool? verified,
            [FromQuery] DateTime? createdFrom,
            [FromQuery] DateTime? createdTo,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 100,
            [FromQuery] string? sortBy = null,
            [FromQuery] SortDirection sortDirection = SortDirection.Default)
        {
            var query = Suppliers.AsEnumerable();

            if (supplierIds is { Length: > 0 })
                query = query.Where(supplier => supplierIds.Contains(supplier.Id));

            if (!string.IsNullOrWhiteSpace(companyName))
                query = query.Where(supplier => supplier.CompanyName.Contains(companyName, StringComparison.OrdinalIgnoreCase));

            if (countryCodes is { Length: > 0 })
                query = query.Where(supplier => countryCodes.Contains(supplier.CountryCode));

            if (verified.HasValue)
                query = query.Where(supplier => supplier.Verified == verified.Value);

            if (createdFrom.HasValue)
                query = query.Where(supplier => supplier.CreatedAt >= createdFrom.Value);

            if (createdTo.HasValue)
                query = query.Where(supplier => supplier.CreatedAt <= createdTo.Value);

            var data = query.ToList();

            return Ok(new ApiPaginationResponse<SupplierModel>
            {
                Data = data,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = data.Count
            });
        }

        [HttpGet("{id}")]
        public ActionResult<SupplierModel> GetSupplierById(Guid id)
        {
            var supplier = Suppliers.FirstOrDefault(supplier => supplier.Id == id);

            if (supplier == null)
                return NotFound();

            return Ok(supplier);
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

            return Ok(supplier);
        }

        [HttpPut("{id}")]
        public ActionResult<SupplierModel> UpdateSupplier(Guid id, SupplierRequest request)
        {
            var supplier = Suppliers.FirstOrDefault(supplier => supplier.Id == id);

            if (supplier == null)
                return NotFound();

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

            if (supplier == null)
                return NotFound();

            supplier.Verified = true;

            return Ok(supplier);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteSupplier(Guid id)
        {
            var supplier = Suppliers.FirstOrDefault(supplier => supplier.Id == id);

            if (supplier == null)
                return NotFound();

            Suppliers.Remove(supplier);

            return Ok();
        }
    }
}