namespace TypedApiTestProject.Server.Models
{
    public class WarehouseRequest
    {
        public string Code { get; set; } = "";
        public string Name { get; set; } = "";
        public string City { get; set; } = "";
        public string CountryCode { get; set; } = "";
        public int Capacity { get; set; }
        public bool IsActive { get; set; }
    }
}