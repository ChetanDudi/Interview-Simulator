using InterviewSimulator.Application.Abstractions.Practice;
using InterviewSimulator.Application.Abstractions.Sessions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewSimulator.API.Controllers;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public sealed class PublicController(
    ISessionService sessionService,
    IPracticeSessionService practiceSessionService) : ControllerBase
{
    [HttpGet("interview/{token}")]
    public async Task<IActionResult> GetSharedInterview(string token, CancellationToken cancellationToken)
    {
        var report = await sessionService.GetReportByShareTokenAsync(token, cancellationToken);
        return report is null ? NotFound() : Ok(report);
    }

    [HttpGet("practice/{token}")]
    public async Task<IActionResult> GetSharedPractice(string token, CancellationToken cancellationToken)
    {
        var session = await practiceSessionService.GetByShareTokenAsync(token, cancellationToken);
        return session is null ? NotFound() : Ok(session);
    }
}
