namespace TypedApiTestProject.Server.Models
{
    public class MixedImportUploadRequest
    {
        public List<IFormFile> Files { get; set; } = [];
        public string ImportName { get; set; } = "";
        public bool ValidateOnly { get; set; }
    }
}