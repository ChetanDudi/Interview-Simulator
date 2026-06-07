using InterviewSimulator.Application.Analytics.Models;

namespace InterviewSimulator.Application.Abstractions.Analytics;

public interface IAnalyticsService
{
    Task<AnalyticsResponse> GetAsync(Guid userId, CancellationToken cancellationToken = default);
}
