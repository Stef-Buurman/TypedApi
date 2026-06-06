namespace TypedApiTestProject.Server.Models
{
    public class SupplierRequest
    {
        public string CompanyName { get; set; } = "";
        public string ContactEmail { get; set; } = "";
        public string CountryCode { get; set; } = "";
        public bool Verified { get; set; }
    }
}