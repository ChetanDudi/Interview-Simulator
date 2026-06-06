namespace InterviewSimulator.Domain.Entities;

public sealed class User
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public DateTime CreatedAtUtc { get; init; }
}
