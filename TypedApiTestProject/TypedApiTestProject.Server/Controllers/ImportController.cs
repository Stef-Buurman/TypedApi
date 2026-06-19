using Microsoft.AspNetCore.Mvc;
using TypedApiTestProject.Server.Models;

namespace TypedApiTestProject.Server.Controllers
{
    [ApiController]
    [Route("api/imports")]
    public class ImportController : ControllerBase
    {
        [HttpPost("products")]
        [RequestSizeLimit(419_430_400)]
        public ActionResult<UploadResult> UploadProductFiles([FromForm] List<IFormFile> Files)
        {
            return Ok(new UploadResult
            {
                FileCount = Files.Count,
                FileNames = Files.Select(file => file.FileName).ToList(),
                Message = "Product files uploaded successfully."
            });
        }

        [HttpPost("supplier")]
        [RequestSizeLimit(419_430_400)]
        public ActionResult<UploadResult> UploadSupplierFile([FromForm] SingleFileUploadRequest request)
        {
            return Ok(new UploadResult
            {
                FileCount = request.File == null ? 0 : 1,
                FileNames = request.File == null ? [] : [request.File.FileName],
                Message = "Supplier file uploaded successfully."
            });
        }

        [HttpPost("mixed")]
        [RequestSizeLimit(419_430_400)]
        public ActionResult<UploadResult> UploadMixedImport([FromForm] MixedImportUploadRequest request)
        {
            return Ok(new UploadResult
            {
                FileCount = request.Files.Count,
                FileNames = request.Files.Select(file => file.FileName).ToList(),
                Message = $"Import '{request.ImportName}' received. ValidateOnly={request.ValidateOnly}"
            });
        }
    }
}