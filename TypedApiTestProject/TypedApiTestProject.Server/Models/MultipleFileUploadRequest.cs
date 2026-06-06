namespace TypedApiTestProject.Server.Models
{
    public class MultipleFileUploadRequest
    {
        public List<IFormFile> Files { get; set; } = [];
    }
}