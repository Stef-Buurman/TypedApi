using Microsoft.AspNetCore.Mvc;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers
{
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
        public ActionResult<ApiPaginationResponse<WarehouseModel>> GetWarehouses(
            [FromQuery] string? search,
            [FromQuery] string[]? countryCodes,
            [FromQuery] int? minCapacity,
            [FromQuery] int? maxCapacity,
            [FromQuery] bool? isActive,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 100,
            [FromQuery] string? sortBy = null,
            [FromQuery] SortDirection sortDirection = SortDirection.Default)
        {
            var query = Warehouses.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(warehouse =>
                    warehouse.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                    warehouse.Code.Contains(search, StringComparison.OrdinalIgnoreCase));

            if (countryCodes is { Length: > 0 })
                query = query.Where(warehouse => countryCodes.Contains(warehouse.CountryCode));

            if (minCapacity.HasValue)
                query = query.Where(warehouse => warehouse.Capacity >= minCapacity.Value);

            if (maxCapacity.HasValue)
                query = query.Where(warehouse => warehouse.Capacity <= maxCapacity.Value);

            if (isActive.HasValue)
                query = query.Where(warehouse => warehouse.IsActive == isActive.Value);

            var data = query.ToList();

            return Ok(new ApiPaginationResponse<WarehouseModel>
            {
                Data = data,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = data.Count
            });
        }

        [HttpGet("{id}")]
        public ActionResult<WarehouseModel> GetWarehouseById(Guid id)
        {
            var warehouse = Warehouses.FirstOrDefault(warehouse => warehouse.Id == id);

            if (warehouse == null)
                return NotFound();

            return Ok(warehouse);
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

            return Ok(warehouse);
        }

        [HttpPut("{id}")]
        public ActionResult<WarehouseModel> UpdateWarehouse(Guid id, WarehouseRequest request)
        {
            var warehouse = Warehouses.FirstOrDefault(warehouse => warehouse.Id == id);

            if (warehouse == null)
                return NotFound();

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

            if (warehouse == null)
                return NotFound();

            Warehouses.Remove(warehouse);

            return Ok();
        }
    }
}