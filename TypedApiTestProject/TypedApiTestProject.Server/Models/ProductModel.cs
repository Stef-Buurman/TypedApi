namespace TypedApiTestProject.Server.Models
{
    public class ProductModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public string Sku { get; set; } = "";
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public bool Active { get; set; }
        public Guid SupplierId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}