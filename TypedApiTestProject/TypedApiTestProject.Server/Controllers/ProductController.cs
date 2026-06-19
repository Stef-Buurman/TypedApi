using Microsoft.AspNetCore.Mvc;
using TypedApi.Swagger.Enums;
using TypedApi.Swagger.Models;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers;

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
    public ActionResult<ApiPaginationSortResponse<ProductTableRow>> GetProducts(
        [FromQuery] ProductFilter filter)
    {
        var query = Products.AsEnumerable();

        if (filter.ProductIds is { Length: > 0 })
            query = query.Where(product => filter.ProductIds.Contains(product.Id));

        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(product => product.Name.Contains(filter.Search, StringComparison.OrdinalIgnoreCase));

        if (filter.Skus is { Length: > 0 })
            query = query.Where(product => filter.Skus.Contains(product.Sku));

        if (filter.MinPrice.HasValue)
            query = query.Where(product => product.Price >= filter.MinPrice.Value);

        if (filter.MaxPrice.HasValue)
            query = query.Where(product => product.Price <= filter.MaxPrice.Value);

        if (filter.MinStock.HasValue)
            query = query.Where(product => product.Stock >= filter.MinStock.Value);

        if (filter.MaxStock.HasValue)
            query = query.Where(product => product.Stock <= filter.MaxStock.Value);

        if (filter.Active.HasValue)
            query = query.Where(product => product.Active == filter.Active.Value);

        if (filter.SupplierId.HasValue)
            query = query.Where(product => product.SupplierId == filter.SupplierId.Value);

        if (filter.CreatedFrom.HasValue)
            query = query.Where(product => product.CreatedAt >= filter.CreatedFrom.Value);

        if (filter.CreatedTo.HasValue)
            query = query.Where(product => product.CreatedAt <= filter.CreatedTo.Value);

        query = (filter.SortBy?.ToLowerInvariant(), filter.SortDirection) switch
        {
            ("name", SortDirection.Asc) => query.OrderBy(product => product.Name),
            ("name", SortDirection.Desc) => query.OrderByDescending(product => product.Name),
            ("price", SortDirection.Asc) => query.OrderBy(product => product.Price),
            ("price", SortDirection.Desc) => query.OrderByDescending(product => product.Price),
            ("stock", SortDirection.Asc) => query.OrderBy(product => product.Stock),
            ("stock", SortDirection.Desc) => query.OrderByDescending(product => product.Stock),
            ("createdat", SortDirection.Asc) => query.OrderBy(product => product.CreatedAt),
            ("createdat", SortDirection.Desc) => query.OrderByDescending(product => product.CreatedAt),
            _ => query
        };

        var totalRecords = query.Count();
        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 500);
        var rows = query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
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

        return Ok(new ApiPaginationSortResponse<ProductTableRow>
        {
            Data = rows,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = rows.Count,
            TotalPages = (int)Math.Ceiling(totalRecords / (double)pageSize),
            TotalRecords = totalRecords,
            SortBy = filter.SortBy,
            SortDirection = filter.SortDirection
        });
    }

    [HttpGet("sort-state")]
    public ActionResult<ApiSortResponse> GetProductSortState(
        [FromQuery] string? sortBy,
        [FromQuery] SortDirection sortDirection = SortDirection.Default)
    {
        return Ok(new ApiSortResponse
        {
            SortBy = sortBy,
            SortDirection = sortDirection
        });
    }

    [HttpGet("{id}")]
    public ActionResult<ProductModel> GetProductById(Guid id)
    {
        var product = Products.FirstOrDefault(product => product.Id == id);
        return product == null ? NotFound() : Ok(product);
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
        if (product == null) return NotFound();

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
        if (product == null) return NotFound();

        product.Active = !product.Active;
        return Ok(product);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteProduct(Guid id)
    {
        var product = Products.FirstOrDefault(product => product.Id == id);
        if (product == null) return NotFound();

        Products.Remove(product);
        return NoContent();
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
