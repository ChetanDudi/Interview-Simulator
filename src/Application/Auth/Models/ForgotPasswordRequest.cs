namespace InterviewSimulator.Application.Auth.Models;

public sealed class ForgotPasswordRequest
{
    public string Email { get; init; } = string.Empty;
}
