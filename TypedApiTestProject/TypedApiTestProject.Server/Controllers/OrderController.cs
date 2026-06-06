using Microsoft.AspNetCore.Mvc;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers
{
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
        public ActionResult<ApiPaginationResponse<OrderModel>> GetOrders(
            [FromQuery] Guid[]? orderIds,
            [FromQuery] string? orderNumber,
            [FromQuery] Guid? productId,
            [FromQuery] Guid? supplierId,
            [FromQuery] int? minQuantity,
            [FromQuery] int? maxQuantity,
            [FromQuery] decimal? minTotalPrice,
            [FromQuery] decimal? maxTotalPrice,
            [FromQuery] DateTime? orderedFrom,
            [FromQuery] DateTime? orderedTo,
            [FromQuery] OrderStatus? status,
            [FromQuery] OrderStatus[]? statuses,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 100,
            [FromQuery] string? sortBy = null,
            [FromQuery] SortDirection sortDirection = SortDirection.Default)
        {
            var query = Orders.AsEnumerable();

            if (orderIds is { Length: > 0 })
                query = query.Where(order => orderIds.Contains(order.Id));

            if (!string.IsNullOrWhiteSpace(orderNumber))
                query = query.Where(order => order.OrderNumber.Contains(orderNumber, StringComparison.OrdinalIgnoreCase));

            if (productId.HasValue)
                query = query.Where(order => order.ProductId == productId.Value);

            if (supplierId.HasValue)
                query = query.Where(order => order.SupplierId == supplierId.Value);

            if (minQuantity.HasValue)
                query = query.Where(order => order.Quantity >= minQuantity.Value);

            if (maxQuantity.HasValue)
                query = query.Where(order => order.Quantity <= maxQuantity.Value);

            if (minTotalPrice.HasValue)
                query = query.Where(order => order.TotalPrice >= minTotalPrice.Value);

            if (maxTotalPrice.HasValue)
                query = query.Where(order => order.TotalPrice <= maxTotalPrice.Value);

            if (orderedFrom.HasValue)
                query = query.Where(order => order.OrderedAt >= orderedFrom.Value);

            if (orderedTo.HasValue)
                query = query.Where(order => order.OrderedAt <= orderedTo.Value);

            if (status.HasValue)
                query = query.Where(order => order.Status == status.Value);

            if (statuses is { Length: > 0 })
                query = query.Where(order => statuses.Contains(order.Status));

            var data = query.ToList();

            return Ok(new ApiPaginationResponse<OrderModel>
            {
                Data = data,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = data.Count
            });
        }

        [HttpGet("{id}")]
        public ActionResult<OrderModel> GetOrderById(Guid id)
        {
            var order = Orders.FirstOrDefault(order => order.Id == id);

            if (order == null)
                return NotFound();

            return Ok(order);
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

            return Ok(order);
        }

        [HttpPut("{id}")]
        public ActionResult<OrderModel> UpdateOrder(Guid id, OrderRequest request)
        {
            var order = Orders.FirstOrDefault(order => order.Id == id);

            if (order == null)
                return NotFound();

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

            if (order == null)
                return NotFound();

            order.Status = OrderStatus.Approved;

            return Ok(order);
        }

        [HttpPost("{id}/cancel")]
        public ActionResult<OrderModel> CancelOrder(Guid id, [FromQuery] string? reason)
        {
            var order = Orders.FirstOrDefault(order => order.Id == id);

            if (order == null)
                return NotFound();

            order.Status = OrderStatus.Cancelled;

            return Ok(order);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteOrder(Guid id)
        {
            var order = Orders.FirstOrDefault(order => order.Id == id);

            if (order == null)
                return NotFound();

            Orders.Remove(order);

            return Ok();
        }
    }
}