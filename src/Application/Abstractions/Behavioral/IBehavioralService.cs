using InterviewSimulator.Application.Behavioral.Models;

namespace InterviewSimulator.Application.Abstractions.Behavioral;

public interface IBehavioralService
{
    Task<BehavioralSessionResponse>              CreateAsync(Guid userId, string topic, int questionCount, CancellationToken ct = default);
    Task<BehavioralSessionResponse?>             GetAsync(Guid userId, Guid sessionId, CancellationToken ct = default);
    Task<IReadOnlyList<BehavioralSessionResponse>> GetByUserAsync(Guid userId, CancellationToken ct = default);
    Task<BehavioralReportResponse?>              SubmitAsync(Guid userId, Guid sessionId, string[] answers, int timeTakenSeconds, CancellationToken ct = default);
    Task<BehavioralReportResponse?>              GetReportAsync(Guid userId, Guid sessionId, CancellationToken ct = default);
}
