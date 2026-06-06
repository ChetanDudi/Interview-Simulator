using InterviewSimulator.Application.Practice.Models;

namespace InterviewSimulator.Application.Abstractions.Practice;

public interface IPracticeSessionService
{
    Task<PracticeSessionResponse> SaveAsync(Guid userId, string topic, IReadOnlyList<PracticeQuestion> questions, CancellationToken cancellationToken = default);
    Task<PracticeSessionResponse?> GetAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PracticeSessionResponse>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<string> GenerateShareTokenAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<PracticeSessionResponse?> GetByShareTokenAsync(string token, CancellationToken cancellationToken = default);
}
