using InterviewSimulator.Application.Abstractions.Practice;
using InterviewSimulator.Application.Practice.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InterviewSimulator.API.Controllers;

[ApiController]
[Route("api/practice")]
[Authorize]
public sealed class PracticeController(
    IPracticeService practiceService,
    IPracticeSessionService practiceSessionService) : ControllerBase
{
    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GeneratePracticeRequest body, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(body.Topic))
            return BadRequest(new { errors = new[] { "Topic is required." } });

        try
        {
            var count     = Math.Clamp(body.Count, 3, 20);
            var questions = await practiceService.GenerateAsync(body.Topic.Trim(), count, cancellationToken);
            var session   = await practiceSessionService.SaveAsync(userId.Value, body.Topic.Trim(), questions, cancellationToken);
            return Ok(session);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { errors = new[] { ex.Message } });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetMySessions(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var sessions = await practiceSessionService.GetByUserAsync(userId.Value, cancellationToken);
        return Ok(sessions);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var session = await practiceSessionService.GetAsync(userId.Value, id, cancellationToken);
        return session is null ? NotFound() : Ok(session);
    }

    [HttpPost("{id:guid}/share")]
    public async Task<IActionResult> Share(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var token = await practiceSessionService.GenerateShareTokenAsync(userId.Value, id, cancellationToken);
            return Ok(new { token, shareUrl = $"/shared/practice/{token}" });
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    private Guid? GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
