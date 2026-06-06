using System.Text.Json;
using InterviewSimulator.Application.Abstractions.Practice;
using InterviewSimulator.Application.Practice.Models;
using InterviewSimulator.Persistence.Db;
using InterviewSimulator.Persistence.Practice;
using Microsoft.EntityFrameworkCore;

namespace InterviewSimulator.Persistence.Services;

public sealed class PracticeSessionService(InterviewSimulatorDbContext dbContext) : IPracticeSessionService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public async Task<PracticeSessionResponse> SaveAsync(
        Guid userId, string topic, IReadOnlyList<PracticeQuestion> questions,
        CancellationToken cancellationToken = default)
    {
        var session = new AppPracticeSession
        {
            Id           = Guid.NewGuid(),
            UserId       = userId,
            Topic        = topic,
            CreatedAtUtc = DateTime.UtcNow,
            Questions    = questions.Select((q, i) => new AppPracticeQuestion
            {
                Id                 = Guid.NewGuid(),
                OrderIndex         = i,
                QuestionText       = q.QuestionText,
                QuestionType       = q.QuestionType,
                OptionsJson        = q.Options.Length > 0 ? JsonSerializer.Serialize(q.Options) : null,
                CorrectOptionIndex = q.CorrectOptionIndex,
                Answer             = q.Answer
            }).ToList()
        };

        dbContext.PracticeSessions.Add(session);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MapSession(session);
    }

    public async Task<PracticeSessionResponse?> GetAsync(
        Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.PracticeSessions
            .Include(s => s.Questions)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);
        return session is null ? null : MapSession(session);
    }

    public async Task<IReadOnlyList<PracticeSessionResponse>> GetByUserAsync(
        Guid userId, CancellationToken cancellationToken = default)
    {
        var sessions = await dbContext.PracticeSessions
            .Include(s => s.Questions)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(cancellationToken);
        return sessions.Select(MapSession).ToArray();
    }

    public async Task<string> GenerateShareTokenAsync(
        Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.PracticeSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Practice session not found.");

        if (!string.IsNullOrEmpty(session.ShareToken))
            return session.ShareToken;

        session.ShareToken = Guid.NewGuid().ToString("N");
        await dbContext.SaveChangesAsync(cancellationToken);
        return session.ShareToken;
    }

    public async Task<PracticeSessionResponse?> GetByShareTokenAsync(
        string token, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.PracticeSessions
            .Include(s => s.Questions)
            .FirstOrDefaultAsync(s => s.ShareToken == token, cancellationToken);
        return session is null ? null : MapSession(session);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static PracticeSessionResponse MapSession(AppPracticeSession s) => new()
    {
        Id           = s.Id,
        Topic        = s.Topic,
        CreatedAtUtc = s.CreatedAtUtc,
        ShareToken   = s.ShareToken,
        Questions    = s.Questions
            .OrderBy(q => q.OrderIndex)
            .Select(q => new PracticeQuestion
            {
                QuestionText       = q.QuestionText,
                QuestionType       = q.QuestionType,
                Options            = DeserializeOptions(q.OptionsJson),
                CorrectOptionIndex = q.CorrectOptionIndex,
                Answer             = q.Answer
            })
            .ToArray()
    };

    private static string[] DeserializeOptions(string? json) =>
        string.IsNullOrEmpty(json) ? [] : JsonSerializer.Deserialize<string[]>(json, JsonOpts) ?? [];
}
