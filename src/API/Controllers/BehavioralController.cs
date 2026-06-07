using InterviewSimulator.Application.Abstractions.Behavioral;
using InterviewSimulator.Application.Behavioral.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InterviewSimulator.API.Controllers;

[ApiController]
[Route("api/behavioral")]
[Authorize]
public sealed class BehavioralController(IBehavioralService behavioralService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBehavioralRequest body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Topic))
            return BadRequest(new { errors = new[] { "Topic is required." } });
        var count = Math.Clamp(body.QuestionCount, 3, 12);
        var result = await behavioralService.CreateAsync(UserId, body.Topic.Trim(), count, ct);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
        => Ok(await behavioralService.GetByUserAsync(UserId, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var result = await behavioralService.GetAsync(UserId, id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, [FromBody] SubmitBehavioralRequest body, CancellationToken ct)
    {
        var result = await behavioralService.SubmitAsync(UserId, id, body.Answers, body.TimeTakenSeconds, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:guid}/report")]
    public async Task<IActionResult> Report(Guid id, CancellationToken ct)
    {
        var result = await behavioralService.GetReportAsync(UserId, id, ct);
        return result is null ? NotFound() : Ok(result);
    }
}

public sealed class CreateBehavioralRequest
{
    public string Topic         { get; init; } = string.Empty;
    public int    QuestionCount { get; init; } = 6;
}
