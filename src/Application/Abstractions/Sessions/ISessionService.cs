using InterviewSimulator.Application.Common;
using InterviewSimulator.Application.Sessions.Models;

namespace InterviewSimulator.Application.Abstractions.Sessions;

public interface ISessionService
{
    Task<CreateSessionResult>             CreateAsync(Guid userId, Guid resumeId, int questionCount = 8, CancellationToken cancellationToken = default);
    Task<SessionResponse?>                GetAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<SessionResponse>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ServiceResult>                   SubmitAnswersAsync(Guid userId, Guid sessionId, IReadOnlyList<AnswerRequest> answers, int timeTakenSeconds, CancellationToken cancellationToken = default);
    Task<ReportResponse?>                 GetReportAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<string>                          GenerateShareTokenAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default);
    Task<ReportResponse?>                 GetReportByShareTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<InterviewAttemptResponse?>       GetQuestionsForAttemptByShareTokenAsync(string token, CancellationToken cancellationToken = default);
}
