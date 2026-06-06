namespace InterviewSimulator.Application.Auth.Models;

public sealed class VerifyResetOtpRequest
{
    public string Email { get; init; } = string.Empty;
    public string Otp   { get; init; } = string.Empty;
}
