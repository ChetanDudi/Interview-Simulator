using InterviewSimulator.Application.Abstractions.Auth;
using InterviewSimulator.Application.Auth.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InterviewSimulator.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, cancellationToken);

        if (!result.Succeeded && !result.RequiresEmailVerification)
            return BadRequest(new { errors = result.Errors });

        return Ok(new
        {
            requiresEmailVerification = true,
            email   = result.UnverifiedEmail,
            message = "A 6-digit verification code has been sent to your email."
        });
    }

    [AllowAnonymous]
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail(VerifyEmailRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.VerifyEmailAsync(request, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        return Ok(result.Response);
    }

    [AllowAnonymous]
    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp(ResendOtpRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.ResendOtpAsync(request, cancellationToken);
        return Ok(new
        {
            secondsUntilResend = result.SecondsUntilResend,
            message            = result.Succeeded ? "Verification code sent." : null,
            errors             = result.Errors.Count > 0 ? result.Errors : null
        });
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);

        if (!result.Succeeded && result.RequiresEmailVerification)
        {
            return Ok(new
            {
                requiresEmailVerification = true,
                email   = result.UnverifiedEmail,
                message = "Please verify your email. A new code has been sent."
            });
        }

        if (!result.Succeeded)
            return Unauthorized(new { errors = result.Errors });

        return Ok(result.Response);
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.ForgotPasswordAsync(request, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        return Ok(new { message = "If that email is registered, a verification code has been sent." });
    }

    [AllowAnonymous]
    [HttpPost("verify-reset-otp")]
    public async Task<IActionResult> VerifyResetOtp(VerifyResetOtpRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.VerifyResetOtpAsync(request, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        return Ok(new { resetToken = result.Data });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.ResetPasswordAsync(request, cancellationToken);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        return Ok(new { message = "Password reset successfully." });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var name   = User.FindFirstValue(ClaimTypes.Name);
        var email  = User.FindFirstValue(ClaimTypes.Email);
        var roles  = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray();

        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        return Ok(new { userId, name, email, roles });
    }
}
