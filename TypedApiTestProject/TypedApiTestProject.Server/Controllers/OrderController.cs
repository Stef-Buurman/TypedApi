using Microsoft.AspNetCore.Mvc;
using TypedApi.Swagger.Enums;
using TypedApi.Swagger.Models;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers;

[ApiController]
[Route("api/orders")]
public class OrderController : ControllerBase
{
    private static readonly List<OrderModel> Orders =
    [
        new()
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-1001",
            ProductId = Guid.NewGuid(),
            SupplierId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Quantity = 5,
            TotalPrice = 199.75m,
            OrderedAt = DateTime.UtcNow.AddDays(-5),
            Status = OrderStatus.Pending
        },
        new()
        {
            Id = Guid.NewGuid(),
            OrderNumber = "ORD-1002",
            ProductId = Guid.NewGuid(),
            SupplierId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Quantity = 2,
            TotalPrice = 119.90m,
            OrderedAt = DateTime.UtcNow.AddDays(-2),
            Status = OrderStatus.Approved
        }
    ];

    [HttpGet]
    public ActionResult<ApiPaginationSortResponse<OrderModel>> GetOrders([FromQuery] OrderFilter filter)
    {
        var query = Orders.AsEnumerable();

        if (filter.OrderIds is { Length: > 0 })
            query = query.Where(order => filter.OrderIds.Contains(order.Id));

        if (!string.IsNullOrWhiteSpace(filter.OrderNumber))
            query = query.Where(order => order.OrderNumber.Contains(filter.OrderNumber, StringComparison.OrdinalIgnoreCase));

        if (filter.ProductId.HasValue)
            query = query.Where(order => order.ProductId == filter.ProductId.Value);

        if (filter.SupplierId.HasValue)
            query = query.Where(order => order.SupplierId == filter.SupplierId.Value);

        if (filter.MinQuantity.HasValue)
            query = query.Where(order => order.Quantity >= filter.MinQuantity.Value);

        if (filter.MaxQuantity.HasValue)
            query = query.Where(order => order.Quantity <= filter.MaxQuantity.Value);

        if (filter.MinTotalPrice.HasValue)
            query = query.Where(order => order.TotalPrice >= filter.MinTotalPrice.Value);

        if (filter.MaxTotalPrice.HasValue)
            query = query.Where(order => order.TotalPrice <= filter.MaxTotalPrice.Value);

        if (filter.OrderedFrom.HasValue)
            query = query.Where(order => order.OrderedAt >= filter.OrderedFrom.Value);

        if (filter.OrderedTo.HasValue)
            query = query.Where(order => order.OrderedAt <= filter.OrderedTo.Value);

        if (filter.Status.HasValue)
            query = query.Where(order => order.Status == filter.Status.Value);

        if (filter.Statuses is { Length: > 0 })
            query = query.Where(order => filter.Statuses.Contains(order.Status));

        query = (filter.SortBy?.ToLowerInvariant(), filter.SortDirection) switch
        {
            ("ordernumber", SortDirection.Asc) => query.OrderBy(order => order.OrderNumber),
            ("ordernumber", SortDirection.Desc) => query.OrderByDescending(order => order.OrderNumber),
            ("quantity", SortDirection.Asc) => query.OrderBy(order => order.Quantity),
            ("quantity", SortDirection.Desc) => query.OrderByDescending(order => order.Quantity),
            ("totalprice", SortDirection.Asc) => query.OrderBy(order => order.TotalPrice),
            ("totalprice", SortDirection.Desc) => query.OrderByDescending(order => order.TotalPrice),
            ("orderedat", SortDirection.Asc) => query.OrderBy(order => order.OrderedAt),
            ("orderedat", SortDirection.Desc) => query.OrderByDescending(order => order.OrderedAt),
            _ => query
        };

        var totalRecords = query.Count();
        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 500);
        var data = query.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        return Ok(new ApiPaginationSortResponse<OrderModel>
        {
            Data = data,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = data.Count,
            TotalPages = (int)Math.Ceiling(totalRecords / (double)pageSize),
            TotalRecords = totalRecords,
            SortBy = filter.SortBy,
            SortDirection = filter.SortDirection
        });
    }

    [HttpGet("{id}")]
    public ActionResult<OrderModel> GetOrderById(Guid id)
    {
        var order = Orders.FirstOrDefault(order => order.Id == id);
        return order == null ? NotFound() : Ok(order);
    }

    [HttpPost]
    public ActionResult<OrderModel> CreateOrder(OrderRequest request)
    {
        var order = new OrderModel
        {
            Id = Guid.NewGuid(),
            OrderNumber = request.OrderNumber,
            ProductId = request.ProductId,
            SupplierId = request.SupplierId,
            Quantity = request.Quantity,
            TotalPrice = request.TotalPrice,
            OrderedAt = request.OrderedAt,
            Status = request.Status
        };

        Orders.Add(order);
        return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, order);
    }

    [HttpPut("{id}")]
    public ActionResult<OrderModel> UpdateOrder(Guid id, OrderRequest request)
    {
        var order = Orders.FirstOrDefault(order => order.Id == id);
        if (order == null) return NotFound();

        order.OrderNumber = request.OrderNumber;
        order.ProductId = request.ProductId;
        order.SupplierId = request.SupplierId;
        order.Quantity = request.Quantity;
        order.TotalPrice = request.TotalPrice;
        order.OrderedAt = request.OrderedAt;
        order.Status = request.Status;
        return Ok(order);
    }

    [HttpPost("{id}/approve")]
    public ActionResult<OrderModel> ApproveOrder(Guid id)
    {
        var order = Orders.FirstOrDefault(order => order.Id == id);
        if (order == null) return NotFound();

        order.Status = OrderStatus.Approved;
        return Ok(order);
    }

    [HttpPost("{id}/cancel")]
    public ActionResult<OrderModel> CancelOrder(Guid id, [FromQuery] string? reason)
    {
        var order = Orders.FirstOrDefault(order => order.Id == id);
        if (order == null) return NotFound();

        order.Status = OrderStatus.Cancelled;
        return Ok(order);
    }

    [HttpDelete("{id}")]
    public IActionResult DeleteOrder(Guid id)
    {
        var order = Orders.FirstOrDefault(order => order.Id == id);
        if (order == null) return NotFound();

        Orders.Remove(order);
        return NoContent();
    }
}
