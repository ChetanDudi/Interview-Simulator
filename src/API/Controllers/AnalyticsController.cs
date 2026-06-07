using InterviewSimulator.Application.Abstractions.Analytics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InterviewSimulator.API.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public sealed class AnalyticsController(IAnalyticsService analyticsService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return Ok(await analyticsService.GetAsync(userId, ct));
    }
}
