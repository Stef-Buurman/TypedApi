namespace TypedApiTestProject.Server.Models
{
    public class SingleFileUploadRequest
    {
        public IFormFile File { get; set; } = null!;
    }
}