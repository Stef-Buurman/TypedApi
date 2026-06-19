using Microsoft.AspNetCore.Mvc;
using TypedApi.Swagger.Enums;
using TypedApi.Swagger.Models;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers;

[ApiController]
[Route("api/warehouses")]
public class WarehouseController : ControllerBase
{
    private static readonly List<WarehouseModel> Warehouses =
    [
        new()
        {
            Id = Guid.NewGuid(),
            Code = "AMS-01",
            Name = "Amsterdam Main Warehouse",
            City = "Amsterdam",
            CountryCode = "NL",
            Capacity = 10000,
            IsActive = true
        },
        new()
        {
            Id = Guid.NewGuid(),
            Code = "BER-01",
            Name = "Berlin Distribution Center",
            City = "Berlin",
            CountryCode = "DE",
            Capacity = 7500,
            IsActive = true
        }
    ];

    [HttpGet]
    public ActionResult<ApiPaginationResponse<WarehouseModel>> GetWarehouses([FromQuery] WarehouseFilter filter)
    {
        var query = Warehouses.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(warehouse =>
                warehouse.Name.Contains(filter.Search, StringComparison.OrdinalIgnoreCase) ||
                warehouse.Code.Contains(filter.Search, StringComparison.OrdinalIgnoreCase));

        if (filter.CountryCodes is { Length: > 0 })
            query = query.Where(warehouse => filter.CountryCodes.Contains(warehouse.CountryCode));

        if (filter.MinCapacity.HasValue)
            query = query.Where(warehouse => warehouse.Capacity >= filter.MinCapacity.Value);

        if (filter.MaxCapacity.HasValue)
            query = query.Where(warehouse => warehouse.Capacity <= filter.MaxCapacity.Value);

        if (filter.IsActive.HasValue)
            query = query.Where(warehouse => warehouse.IsActive == filter.IsActive.Value);

        query = (filter.SortBy?.ToLowerInvariant(), filter.SortDirection) switch
        {
            ("code", SortDirection.Asc) => query.OrderBy(warehouse => warehouse.Code),
            ("code", SortDirection.Desc) => query.OrderByDescending(warehouse => warehouse.Code),
            ("name", SortDirection.Asc) => query.OrderBy(warehouse => warehouse.Name),
            ("name", SortDirection.Desc) => query.OrderByDescending(warehouse => warehouse.Name),
            ("capacity", SortDirection.Asc) => query.OrderBy(warehouse => warehouse.Capacity),
            ("capacity", SortDirection.Desc) => query.OrderByDescending(warehouse => warehouse.Capacity),
            _ => query
        };

        var totalRecords = query.Count();
        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 500);
        var data = query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new ApiPaginationResponse<WarehouseModel>
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
    public ActionResult<WarehouseModel> GetWarehouseById(Guid id)
    {
        var warehouse = Warehouses.FirstOrDefault(warehouse => warehouse.Id == id);
        return warehouse == null ? NotFound() : Ok(warehouse);
    }

    [HttpPost]
    public ActionResult<WarehouseModel> CreateWarehouse(WarehouseRequest request)
    {
        var warehouse = new WarehouseModel
        {
            Id = Guid.NewGuid(),
            Code = request.Code,
            Name = request.Name,
            City = request.City,
            CountryCode = request.CountryCode,
            Capacity = request.Capacity,
            IsActive = request.IsActive
        };

        Warehouses.Add(warehouse);
        return CreatedAtAction(nameof(GetWarehouseById), new { id = warehouse.Id }, warehouse);
    }

    [HttpPut("{id}")]
    public ActionResult<WarehouseModel> UpdateWarehouse(Guid id, WarehouseRequest request)
    {
        var warehouse = Warehouses.FirstOrDefault(warehouse => warehouse.Id == id);
        if (warehouse == null) return NotFound();

        warehouse.Code = request.Code;
        warehouse.Name = request.Name;
        warehouse.City = request.City;
        warehouse.CountryCode = request.CountryCode;
        warehouse.Capacity = request.Capacity;
        warehouse.IsActive = request.IsActive;
        return Ok(warehouse);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteWarehouse(Guid id)
    {
        var warehouse = Warehouses.FirstOrDefault(warehouse => warehouse.Id == id);
        if (warehouse == null) return NotFound();

        Warehouses.Remove(warehouse);
        return NoContent();
    }
}
