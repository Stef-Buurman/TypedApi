namespace TypedApiTestProject.Server.Models
{
    public class UploadResult
    {
        public int FileCount { get; set; }
        public List<string> FileNames { get; set; } = [];
        public string Message { get; set; } = "";
    }
}