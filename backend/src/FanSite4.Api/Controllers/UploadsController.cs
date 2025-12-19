using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FanSite4.Api.Controllers;

public sealed class UploadImageForm
{
    public IFormFile File { get; set; } = default!;
}

[ApiController]
[Route("api/uploads")]
public sealed class UploadsController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public UploadsController(IWebHostEnvironment env) => _env = env;

    [Authorize]
    [HttpPost("images")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult<object>> UploadImage([FromForm] UploadImageForm form, CancellationToken ct)
    {
        var file = form.File;

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "File is empty." });

        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp", "image/gif"
        };

        if (!allowed.Contains(file.ContentType))
            return BadRequest(new { message = "Only jpg/png/webp/gif are allowed." });

        var uploadsDir = Path.Combine(_env.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext))
            ext = file.ContentType switch
            {
                "image/jpeg" => ".jpg",
                "image/png" => ".png",
                "image/webp" => ".webp",
                "image/gif" => ".gif",
                _ => ".img"
            };

        var fileName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var savePath = Path.Combine(uploadsDir, fileName);

        await using var fs = System.IO.File.Create(savePath);
        await file.CopyToAsync(fs, ct);

        var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
        return Ok(new { url });
    }
}
