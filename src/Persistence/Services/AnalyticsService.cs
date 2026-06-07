using InterviewSimulator.Application.Abstractions.Analytics;
using InterviewSimulator.Application.Analytics.Models;
using InterviewSimulator.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace InterviewSimulator.Persistence.Services;

public sealed class AnalyticsService(InterviewSimulatorDbContext dbContext) : IAnalyticsService
{
    public async Task<AnalyticsResponse> GetAsync(Guid userId, CancellationToken ct = default)
    {
        var sessions = await dbContext.Sessions
            .Include(s => s.FeedbackReport)
            .Where(s => s.UserId == userId && s.Status == "Completed" && s.FeedbackReport != null)
            .OrderBy(s => s.CreatedAtUtc)
            .ToListAsync(ct);

        if (sessions.Count == 0)
            return new AnalyticsResponse();

        var resumeIds   = sessions.Select(s => s.ResumeId).Distinct().ToList();
        var resumeNames = await dbContext.Resumes
            .Where(r => resumeIds.Contains(r.Id))
            .ToDictionaryAsync(r => r.Id, r => r.OriginalFileName, ct);

        var history = sessions.Select(s => new ScorePoint
        {
            Date  = s.CreatedAtUtc,
            Score = s.FeedbackReport!.OverallScore,
            Label = s.TargetRole ?? resumeNames.GetValueOrDefault(s.ResumeId, "Interview"),
        }).ToArray();

        var reports          = sessions.Select(s => s.FeedbackReport!).ToList();
        var avgOverall       = reports.Average(r => (double)r.OverallScore);
        var avgTechnical     = reports.Average(r => (double)r.TechnicalScore);
        var avgCommunication = reports.Average(r => (double)r.CommunicationScore);

        return new AnalyticsResponse
        {
            Streak           = ComputeStreak(sessions.Select(s => s.CreatedAtUtc.Date).ToList()),
            TotalInterviews  = sessions.Count,
            AverageScore     = Math.Round(avgOverall, 1),
            BestScore        = reports.Max(r => r.OverallScore),
            AvgTechnical     = Math.Round(avgTechnical, 1),
            AvgCommunication = Math.Round(avgCommunication, 1),
            ScoreHistory     = history,
            WeakAreas        =
            [
                new CategoryScore { Category = "Technical",     Score = (int)Math.Round(avgTechnical) },
                new CategoryScore { Category = "Communication", Score = (int)Math.Round(avgCommunication) },
                new CategoryScore { Category = "Overall",       Score = (int)Math.Round(avgOverall) },
            ],
        };
    }

    private static int ComputeStreak(List<DateTime> dates)
    {
        if (dates.Count == 0) return 0;
        var set    = dates.ToHashSet();
        var streak = 0;
        var day    = DateTime.UtcNow.Date;
        if (!set.Contains(day) && set.Contains(day.AddDays(-1)))
            day = day.AddDays(-1);
        while (set.Contains(day)) { streak++; day = day.AddDays(-1); }
        return streak;
    }
}
