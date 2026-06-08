using Microsoft.AspNetCore.Mvc;
using TypedApi.Swagger.Enums;
using TypedApi.Swagger.Models;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class ProductController : ControllerBase
    {
        private static readonly List<ProductModel> Products =
        [
            new()
            {
                Id = Guid.NewGuid(),
                Name = "Laptop Stand",
                Sku = "LAP-STAND-001",
                Price = 39.95m,
                Stock = 25,
                Active = true,
                SupplierId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Name = "USB-C Hub",
                Sku = "USB-HUB-002",
                Price = 59.95m,
                Stock = 12,
                Active = true,
                SupplierId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                CreatedAt = DateTime.UtcNow.AddDays(-4)
            }
        ];

        [HttpGet]
        public ActionResult<ApiPaginationResponse<ProductTableRow>> GetProducts(
            [FromQuery] Guid[]? productIds,
            [FromQuery] string? search,
            [FromQuery] string[]? skus,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] int? minStock,
            [FromQuery] int? maxStock,
            [FromQuery] bool? active,
            [FromQuery] Guid? supplierId,
            [FromQuery] DateTime? createdFrom,
            [FromQuery] DateTime? createdTo,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 100,
            [FromQuery] string? sortBy = null,
            [FromQuery] SortDirection sortDirection = SortDirection.Default)
        {
            var query = Products.AsEnumerable();

            if (productIds is { Length: > 0 })
                query = query.Where(product => productIds.Contains(product.Id));

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(product => product.Name.Contains(search, StringComparison.OrdinalIgnoreCase));

            if (skus is { Length: > 0 })
                query = query.Where(product => skus.Contains(product.Sku));

            if (minPrice.HasValue)
                query = query.Where(product => product.Price >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(product => product.Price <= maxPrice.Value);

            if (minStock.HasValue)
                query = query.Where(product => product.Stock >= minStock.Value);

            if (maxStock.HasValue)
                query = query.Where(product => product.Stock <= maxStock.Value);

            if (active.HasValue)
                query = query.Where(product => product.Active == active.Value);

            if (supplierId.HasValue)
                query = query.Where(product => product.SupplierId == supplierId.Value);

            if (createdFrom.HasValue)
                query = query.Where(product => product.CreatedAt >= createdFrom.Value);

            if (createdTo.HasValue)
                query = query.Where(product => product.CreatedAt <= createdTo.Value);

            var rows = query
                .Select(product => new ProductTableRow
                {
                    Id = product.Id,
                    Name = product.Name,
                    Sku = product.Sku,
                    Price = product.Price,
                    Stock = product.Stock,
                    Active = product.Active
                })
                .ToList();

            return Ok(new ApiPaginationResponse<ProductTableRow>
            {
                Data = rows,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = rows.Count
            });
        }

        [HttpGet("{id}")]
        public ActionResult<ProductModel> GetProductById(Guid id)
        {
            var product = Products.FirstOrDefault(product => product.Id == id);

            if (product == null)
                return NotFound();

            return Ok(product);
        }

        [HttpPost]
        public ActionResult<ProductModel> CreateProduct(ProductRequest request)
        {
            var product = new ProductModel
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Sku = request.Sku,
                Price = request.Price,
                Stock = request.Stock,
                Active = request.Active,
                SupplierId = request.SupplierId,
                CreatedAt = DateTime.UtcNow
            };

            Products.Add(product);

            return Ok(product);
        }

        [HttpPut("{id}")]
        public ActionResult<ProductModel> UpdateProduct(Guid id, ProductRequest request)
        {
            var product = Products.FirstOrDefault(product => product.Id == id);

            if (product == null)
                return NotFound();

            product.Name = request.Name;
            product.Sku = request.Sku;
            product.Price = request.Price;
            product.Stock = request.Stock;
            product.Active = request.Active;
            product.SupplierId = request.SupplierId;

            return Ok(product);
        }

        [HttpPost("{id}/toggle-active")]
        public ActionResult<ProductModel> ToggleProductActive(Guid id)
        {
            var product = Products.FirstOrDefault(product => product.Id == id);

            if (product == null)
                return NotFound();

            product.Active = !product.Active;

            return Ok(product);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteProduct(Guid id)
        {
            var product = Products.FirstOrDefault(product => product.Id == id);

            if (product == null)
                return NotFound();

            Products.Remove(product);

            return Ok();
        }

        [HttpGet("export")]
        public IActionResult ExportProducts(
            [FromQuery] string? search,
            [FromQuery] bool? active,
            [FromQuery] Guid[]? productIds)
        {
            return Ok();
        }
    }
}