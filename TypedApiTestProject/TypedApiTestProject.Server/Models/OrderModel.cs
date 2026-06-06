namespace TypedApiTestProject.Server.Models
{
    public class OrderModel
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; } = "";
        public Guid ProductId { get; set; }
        public Guid SupplierId { get; set; }
        public int Quantity { get; set; }
        public decimal TotalPrice { get; set; }
        public DateTime OrderedAt { get; set; }
        public OrderStatus Status { get; set; }
    }
}