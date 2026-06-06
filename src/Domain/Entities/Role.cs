namespace InterviewSimulator.Domain.Entities;

public sealed class Role
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;
}
