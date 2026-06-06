namespace TypedApiTestProject.Server.Models
{
    public class SupplierModel
    {
        public Guid Id { get; set; }
        public string CompanyName { get; set; } = "";
        public string ContactEmail { get; set; } = "";
        public string CountryCode { get; set; } = "";
        public bool Verified { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}