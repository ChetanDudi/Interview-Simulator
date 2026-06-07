using InterviewSimulator.Application.Abstractions.Resumes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InterviewSimulator.API.Controllers;

[ApiController]
[Route("api/resumes")]
[Authorize]
public sealed class ResumesController(IResumeService resumeService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        await using var stream = file.OpenReadStream();
        var result = await resumeService.UploadAsync(userId.Value, file.FileName, stream, file.Length, cancellationToken);

        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        return Ok(result.Resume);
    }

    [HttpGet]
    public async Task<IActionResult> GetMyResumes(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var resumes = await resumeService.GetByUserAsync(userId.Value, cancellationToken);
        return Ok(resumes);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await resumeService.DeleteAsync(userId.Value, id, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        return NoContent();
    }

    [HttpPost("{id:guid}/review")]
    public async Task<IActionResult> Review(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var result = await resumeService.ReviewAsync(userId.Value, id, cancellationToken);
            if (result is null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/job-match")]
    public async Task<IActionResult> JobMatch(Guid id, [FromBody] JobMatchRequest body, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var result = await resumeService.MatchJobAsync(userId.Value, id, body.JobDescription, cancellationToken);
            if (result is null) return NotFound();
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/cover-letter")]
    public async Task<IActionResult> CoverLetter(Guid id, [FromBody] JobMatchRequest body, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var result = await resumeService.GenerateCoverLetterAsync(userId.Value, id, body.JobDescription, cancellationToken);
            if (result is null) return NotFound();
            return Ok(new { coverLetter = result });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private Guid? GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}

public sealed class JobMatchRequest
{
    public string JobDescription { get; init; } = string.Empty;
}
