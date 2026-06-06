using InterviewSimulator.Application.Abstractions.Practice;
using InterviewSimulator.Application.Practice.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InterviewSimulator.API.Controllers;

[ApiController]
[Route("api/practice")]
[Authorize]
public sealed class PracticeController(IPracticeService practiceService) : ControllerBase
{
    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromBody] GeneratePracticeRequest body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(body.Topic))
            return BadRequest(new { errors = new[] { "Topic is required." } });

        try
        {
            var count     = Math.Clamp(body.Count, 3, 20);
            var questions = await practiceService.GenerateAsync(body.Topic.Trim(), count, cancellationToken);
            return Ok(questions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { errors = new[] { ex.Message } });
        }
    }
}
