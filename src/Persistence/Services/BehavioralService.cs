using System.Text.Json;
using InterviewSimulator.Application.Abstractions.AI;
using InterviewSimulator.Application.Abstractions.Behavioral;
using InterviewSimulator.Application.Behavioral.Models;
using InterviewSimulator.Persistence.Behavioral;
using InterviewSimulator.Persistence.Db;
using Microsoft.EntityFrameworkCore;

namespace InterviewSimulator.Persistence.Services;

public sealed class BehavioralService(
    InterviewSimulatorDbContext     dbContext,
    IBehavioralQuestionGenerator    questionGenerator,
    IAnswerEvaluator                answerEvaluator) : IBehavioralService
{
    private static readonly JsonSerializerOptions Opts = new() { PropertyNameCaseInsensitive = true };

    // ── Create ────────────────────────────────────────────────────────────────

    public async Task<BehavioralSessionResponse> CreateAsync(
        Guid userId, string topic, int questionCount, CancellationToken ct = default)
    {
        var generated = await questionGenerator.GenerateAsync(topic, questionCount, ct);

        var questions = generated.Select((q, i) => new BehavioralQuestionDto
        {
            Id           = Guid.NewGuid().ToString("N"),
            QuestionText = q.QuestionText,
            StarHint     = q.StarHint,
            Category     = q.Category,
            AnswerText   = null,
        }).ToList();

        var session = new AppBehavioralSession
        {
            Id            = Guid.NewGuid(),
            UserId        = userId,
            Topic         = topic,
            Status        = "InProgress",
            CreatedAtUtc  = DateTime.UtcNow,
            QuestionsJson = JsonSerializer.Serialize(questions),
        };

        dbContext.BehavioralSessions.Add(session);
        await dbContext.SaveChangesAsync(ct);

        return MapSession(session, questions);
    }

    // ── Get single ────────────────────────────────────────────────────────────

    public async Task<BehavioralSessionResponse?> GetAsync(Guid userId, Guid sessionId, CancellationToken ct = default)
    {
        var s = await dbContext.BehavioralSessions
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.UserId == userId, ct);
        if (s is null) return null;
        return MapSession(s, Deserialize(s.QuestionsJson));
    }

    // ── List ─────────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<BehavioralSessionResponse>> GetByUserAsync(Guid userId, CancellationToken ct = default)
    {
        var sessions = await dbContext.BehavioralSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(ct);

        return sessions.Select(s => MapSession(s, Deserialize(s.QuestionsJson))).ToArray();
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    public async Task<BehavioralReportResponse?> SubmitAsync(
        Guid userId, Guid sessionId, string[] answers, int timeTakenSeconds, CancellationToken ct = default)
    {
        var session = await dbContext.BehavioralSessions
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.UserId == userId, ct);
        if (session is null || session.Status == "Completed") return null;

        var questions = Deserialize(session.QuestionsJson);

        // Save answers back into questions JSON
        for (var i = 0; i < questions.Count && i < answers.Length; i++)
            questions[i].AnswerText = answers[i];
        session.QuestionsJson = JsonSerializer.Serialize(questions);

        // Evaluate
        var pairs = questions.Select((q, i) =>
            new QuestionAnswerPair(q.QuestionText, answers.Length > i ? answers[i] : "(no answer)")).ToArray();

        var eval = await answerEvaluator.EvaluateAsync(pairs, ct);

        var feedbacks = eval.Feedbacks.Select((f, i) => new BehavioralFeedbackItemDto
        {
            QuestionIndex = i,
            Score         = f.Score,
            Feedback      = f.Feedback,
            Suggestion    = f.Suggestion,
            IdealAnswer   = f.IdealAnswer,
            StarAnalysis  = string.Empty,
        }).ToList();

        var reportDto = new BehavioralReportDto
        {
            OverallScore = eval.OverallScore,
            Summary      = eval.Summary,
            Feedbacks    = feedbacks,
        };

        session.FeedbackJson     = JsonSerializer.Serialize(reportDto);
        session.Status           = "Completed";
        session.CompletedAtUtc   = DateTime.UtcNow;
        session.TimeTakenSeconds = timeTakenSeconds > 0 ? timeTakenSeconds : null;

        await dbContext.SaveChangesAsync(ct);
        return MapReport(session, questions, reportDto);
    }

    // ── Get Report ────────────────────────────────────────────────────────────

    public async Task<BehavioralReportResponse?> GetReportAsync(Guid userId, Guid sessionId, CancellationToken ct = default)
    {
        var session = await dbContext.BehavioralSessions
            .FirstOrDefaultAsync(x => x.Id == sessionId && x.UserId == userId, ct);

        if (session?.FeedbackJson is null) return null;
        var questions  = Deserialize(session.QuestionsJson);
        var reportDto  = JsonSerializer.Deserialize<BehavioralReportDto>(session.FeedbackJson, Opts)!;
        return MapReport(session, questions, reportDto);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static BehavioralSessionResponse MapSession(AppBehavioralSession s, List<BehavioralQuestionDto> q) => new()
    {
        Id               = s.Id,
        Topic            = s.Topic,
        Status           = s.Status,
        CreatedAtUtc     = s.CreatedAtUtc,
        TimeTakenSeconds = s.TimeTakenSeconds,
        Questions        = q.Select(x => new BehavioralQuestion
        {
            Id           = x.Id,
            QuestionText = x.QuestionText,
            StarHint     = x.StarHint,
            Category     = x.Category,
            AnswerText   = x.AnswerText,
        }).ToArray(),
    };

    private static BehavioralReportResponse MapReport(
        AppBehavioralSession s, List<BehavioralQuestionDto> questions, BehavioralReportDto r) => new()
    {
        OverallScore = r.OverallScore,
        Summary      = r.Summary,
        Feedbacks    = r.Feedbacks.Select(f => new BehavioralFeedbackItem
        {
            QuestionIndex = f.QuestionIndex,
            QuestionText  = questions.Count > f.QuestionIndex ? questions[f.QuestionIndex].QuestionText : string.Empty,
            AnswerText    = questions.Count > f.QuestionIndex ? questions[f.QuestionIndex].AnswerText ?? string.Empty : string.Empty,
            Score         = f.Score,
            Feedback      = f.Feedback,
            Suggestion    = f.Suggestion,
            IdealAnswer   = f.IdealAnswer,
            StarAnalysis  = f.StarAnalysis,
        }).ToArray(),
    };

    private List<BehavioralQuestionDto> Deserialize(string json) =>
        JsonSerializer.Deserialize<List<BehavioralQuestionDto>>(json, Opts) ?? [];

    // ── Private DTOs ──────────────────────────────────────────────────────────

    private sealed class BehavioralQuestionDto
    {
        public string  Id           { get; set; } = string.Empty;
        public string  QuestionText { get; set; } = string.Empty;
        public string  StarHint     { get; set; } = string.Empty;
        public string  Category     { get; set; } = string.Empty;
        public string? AnswerText   { get; set; }
    }

    private sealed class BehavioralReportDto
    {
        public int                        OverallScore { get; init; }
        public string                     Summary      { get; init; } = string.Empty;
        public List<BehavioralFeedbackItemDto> Feedbacks { get; init; } = [];
    }

    private sealed class BehavioralFeedbackItemDto
    {
        public int    QuestionIndex { get; init; }
        public int    Score         { get; init; }
        public string Feedback      { get; init; } = string.Empty;
        public string Suggestion    { get; init; } = string.Empty;
        public string IdealAnswer   { get; init; } = string.Empty;
        public string StarAnalysis  { get; init; } = string.Empty;
    }
}
