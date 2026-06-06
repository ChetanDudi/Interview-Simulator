namespace InterviewSimulator.Application.Abstractions.Auth;

public interface IJwtTokenGenerator
{
    GeneratedToken GenerateToken(
        Guid userId,
        string email,
        string name,
        IReadOnlyCollection<string> roles);
}
