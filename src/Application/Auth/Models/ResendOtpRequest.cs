namespace InterviewSimulator.Application.Auth.Models;

public sealed class ResendOtpRequest
{
    public string Email   { get; init; } = string.Empty;
    /// <summary>Either "EmailVerification" or "PasswordReset".</summary>
    public string Purpose { get; init; } = string.Empty;
}
