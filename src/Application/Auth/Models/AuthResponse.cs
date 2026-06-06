namespace InterviewSimulator.Application.Auth.Models;

public sealed class AuthResponse
{
    public required Guid UserId { get; init; }

    public required string Name { get; init; }

    public required string Email { get; init; }

    public required IReadOnlyCollection<string> Roles { get; init; }

    public required string AccessToken { get; init; }

    public required DateTime ExpiresAtUtc { get; init; }
}
