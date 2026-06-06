namespace InterviewSimulator.Domain.Entities;

public sealed class UserRole
{
    public Guid UserId { get; init; }

    public Guid RoleId { get; init; }
}
