using InterviewSimulator.Application.Abstractions.Sessions;
using InterviewSimulator.Application.Sessions.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InterviewSimulator.API.Controllers;

[ApiController]
[Route("api/sessions")]
[Authorize]
public sealed class SessionsController(ISessionService sessionService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSessionRequest body, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await sessionService.CreateAsync(userId.Value, body.ResumeId, body.QuestionCount, body.TargetRole, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        return Ok(result.Session);
    }

    [HttpGet]
    public async Task<IActionResult> GetMySessions(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var sessions = await sessionService.GetByUserAsync(userId.Value, cancellationToken);
        return Ok(sessions);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var session = await sessionService.GetAsync(userId.Value, id, cancellationToken);
        if (session is null) return NotFound();

        return Ok(session);
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, [FromBody] SubmitAnswersRequest body, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var result = await sessionService.SubmitAnswersAsync(userId.Value, id, body.Answers, body.TimeTakenSeconds, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        return Ok(new { sessionId = id });
    }

    [HttpPost("{id:guid}/share")]
    public async Task<IActionResult> Share(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var token = await sessionService.GenerateShareTokenAsync(userId.Value, id, cancellationToken);
            return Ok(new { token, shareUrl = $"/shared/interview/{token}" });
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id:guid}/report")]
    public async Task<IActionResult> GetReport(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();

        var report = await sessionService.GetReportAsync(userId.Value, id, cancellationToken);
        if (report is null) return NotFound();

        return Ok(report);
    }

    private Guid? GetUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}

public sealed class CreateSessionRequest
{
    public Guid    ResumeId      { get; init; }
    public int     QuestionCount { get; init; } = 8;
    public string? TargetRole    { get; init; }
}

public sealed class SubmitAnswersRequest
{
    public List<AnswerRequest> Answers          { get; init; } = [];
    public int                 TimeTakenSeconds { get; init; }
}
