using System.Text.Json;
using InterviewSimulator.Application.Abstractions.AI;
using InterviewSimulator.Application.Abstractions.Sessions;
using InterviewSimulator.Application.Common;
using InterviewSimulator.Application.Sessions.Models;
using InterviewSimulator.Persistence.Db;
using InterviewSimulator.Persistence.Sessions;
using Microsoft.EntityFrameworkCore;

namespace InterviewSimulator.Persistence.Services;

public sealed class SessionService(
    InterviewSimulatorDbContext dbContext,
    IQuestionGenerator          questionGenerator,
    IAnswerEvaluator            answerEvaluator) : ISessionService
{
    // ── Create Session ────────────────────────────────────────────────────────

    public async Task<CreateSessionResult> CreateAsync(Guid userId, Guid resumeId, int questionCount = 8, CancellationToken cancellationToken = default)
    {
        var resume = await dbContext.Resumes
            .FirstOrDefaultAsync(r => r.Id == resumeId && r.UserId == userId, cancellationToken);

        if (resume is null)
            return CreateSessionResult.Failure("Resume not found.");

        if (string.IsNullOrWhiteSpace(resume.ExtractedText))
            return CreateSessionResult.Failure("No text could be extracted from this PDF. Please upload a text-based PDF resume.");

        IReadOnlyList<GeneratedQuestion> generated;
        try
        {
            var clampedCount = Math.Clamp(questionCount, 3, 20);
            generated = await questionGenerator.GenerateAsync(resume.ExtractedText, clampedCount, cancellationToken);
        }
        catch (Exception ex)
        {
            return CreateSessionResult.Failure($"Failed to generate questions: {ex.Message}");
        }

        if (generated.Count == 0)
            return CreateSessionResult.Failure("AI returned no questions. Please try again.");

        var session = new AppInterviewSession
        {
            Id           = Guid.NewGuid(),
            UserId       = userId,
            ResumeId     = resumeId,
            Status       = "InProgress",
            CreatedAtUtc = DateTime.UtcNow
        };

        var questions = generated
            .Select((q, i) => new AppInterviewQuestion
            {
                Id                 = Guid.NewGuid(),
                SessionId          = session.Id,
                QuestionText       = q.Question,
                Category           = q.Category,
                Difficulty         = q.Difficulty,
                OrderIndex         = i,
                QuestionType       = q.QuestionType,
                OptionsJson        = q.Options.Length > 0 ? JsonSerializer.Serialize(q.Options) : null,
                CorrectOptionIndex = q.CorrectOptionIndex
            })
            .ToList();

        session.Questions = questions;

        dbContext.Sessions.Add(session);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreateSessionResult.Success(MapSession(session, resume.OriginalFileName));
    }

    // ── Get Single Session ────────────────────────────────────────────────────

    public async Task<SessionResponse?> GetAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.Sessions
            .Include(s => s.Questions)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session is null) return null;

        var resume = await dbContext.Resumes.FindAsync([session.ResumeId], cancellationToken);
        return MapSession(session, resume?.OriginalFileName ?? string.Empty);
    }

    // ── List User Sessions ────────────────────────────────────────────────────

    public async Task<IReadOnlyCollection<SessionResponse>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var sessions = await dbContext.Sessions
            .Include(s => s.Questions)
            .Include(s => s.FeedbackReport)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var resumeIds = sessions.Select(s => s.ResumeId).Distinct().ToList();
        var resumes   = await dbContext.Resumes
            .Where(r => resumeIds.Contains(r.Id))
            .ToDictionaryAsync(r => r.Id, r => r.OriginalFileName, cancellationToken);

        return sessions
            .Select(s => MapSession(s, resumes.GetValueOrDefault(s.ResumeId, string.Empty)))
            .ToArray();
    }

    // ── Submit Answers & Generate Report ─────────────────────────────────────

    public async Task<ServiceResult> SubmitAnswersAsync(
        Guid userId,
        Guid sessionId,
        IReadOnlyList<AnswerRequest> answers,
        int timeTakenSeconds,
        CancellationToken cancellationToken = default)
    {
        var session = await dbContext.Sessions
            .Include(s => s.Questions)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session is null)          return ServiceResult.Failure("Session not found.");
        if (session.Status == "Completed") return ServiceResult.Failure("This session has already been submitted.");

        // Save answers
        var now = DateTime.UtcNow;
        foreach (var req in answers)
        {
            var question = session.Questions.FirstOrDefault(q => q.Id == req.QuestionId);
            if (question is null) continue;

            dbContext.Answers.Add(new AppInterviewAnswer
            {
                Id             = Guid.NewGuid(),
                QuestionId     = req.QuestionId,
                SessionId      = sessionId,
                AnswerText     = req.AnswerText,
                SubmittedAtUtc = now
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // Build Q&A pairs for evaluation
        var pairs = session.Questions
            .OrderBy(q => q.OrderIndex)
            .Select(q =>
            {
                var answer = answers.FirstOrDefault(a => a.QuestionId == q.Id);
                return new QuestionAnswerPair(q.QuestionText, answer?.AnswerText ?? "(no answer given)");
            })
            .ToArray();

        EvaluationResult eval;
        try
        {
            eval = await answerEvaluator.EvaluateAsync(pairs, cancellationToken);
        }
        catch (Exception ex)
        {
            return ServiceResult.Failure($"Evaluation failed: {ex.Message}");
        }

        // Save report
        var report = new AppFeedbackReport
        {
            Id                 = Guid.NewGuid(),
            SessionId          = sessionId,
            OverallScore       = eval.OverallScore,
            TechnicalScore     = eval.TechnicalScore,
            CommunicationScore = eval.CommunicationScore,
            Summary            = eval.Summary,
            GeneratedAtUtc     = now,
            QuestionFeedbacks  = eval.Feedbacks.Select(f =>
            {
                var q = session.Questions.ElementAtOrDefault(f.QuestionIndex);
                return new AppQuestionFeedback
                {
                    Id          = Guid.NewGuid(),
                    QuestionId  = q?.Id ?? Guid.Empty,
                    Score       = f.Score,
                    Feedback    = f.Feedback,
                    Suggestion  = f.Suggestion,
                    IdealAnswer = f.IdealAnswer
                };
            }).ToList()
        };

        session.Status           = "Completed";
        session.CompletedAtUtc   = now;
        session.TimeTakenSeconds = timeTakenSeconds > 0 ? timeTakenSeconds : null;

        dbContext.FeedbackReports.Add(report);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ServiceResult.Success(sessionId.ToString());
    }

    // ── Get Report ────────────────────────────────────────────────────────────

    public async Task<ReportResponse?> GetReportAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.Sessions
            .Include(s => s.Questions)
            .Include(s => s.FeedbackReport)
                .ThenInclude(r => r!.QuestionFeedbacks)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session?.FeedbackReport is null) return null;

        var answers = await dbContext.Answers
            .Where(a => a.SessionId == sessionId)
            .ToDictionaryAsync(a => a.QuestionId, a => a.AnswerText, cancellationToken);

        return BuildReportResponse(session, answers);
    }

    // ── Share Token ───────────────────────────────────────────────────────────

    public async Task<string> GenerateShareTokenAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.Sessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException("Session not found.");

        if (!string.IsNullOrEmpty(session.ShareToken))
            return session.ShareToken;

        session.ShareToken = Guid.NewGuid().ToString("N");
        await dbContext.SaveChangesAsync(cancellationToken);
        return session.ShareToken;
    }

    public async Task<ReportResponse?> GetReportByShareTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.Sessions
            .Include(s => s.Questions)
            .Include(s => s.FeedbackReport)
                .ThenInclude(r => r!.QuestionFeedbacks)
            .FirstOrDefaultAsync(s => s.ShareToken == token, cancellationToken);

        if (session?.FeedbackReport is null) return null;

        var answers = await dbContext.Answers
            .Where(a => a.SessionId == session.Id)
            .ToDictionaryAsync(a => a.QuestionId, a => a.AnswerText, cancellationToken);


        return BuildReportResponse(session, answers);
    }

    public async Task<InterviewAttemptResponse?> GetQuestionsForAttemptByShareTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        var session = await dbContext.Sessions
            .Include(s => s.Questions)
            .Include(s => s.FeedbackReport)
                .ThenInclude(r => r!.QuestionFeedbacks)
            .FirstOrDefaultAsync(s => s.ShareToken == token, cancellationToken);

        if (session is null) return null;

        var resume = await dbContext.Resumes.FindAsync([session.ResumeId], cancellationToken);

        var idealAnswers = session.FeedbackReport?.QuestionFeedbacks
            .ToDictionary(f => f.QuestionId, f => f.IdealAnswer)
            ?? [];

        return new InterviewAttemptResponse
        {
            SessionId       = session.Id,
            ResumeTitle     = resume?.OriginalFileName ?? "Interview",
            CreatedAtUtc    = session.CreatedAtUtc,
            HasModelAnswers = session.FeedbackReport is not null,
            Questions       = session.Questions
                .OrderBy(q => q.OrderIndex)
                .Select(q => new AttemptQuestion
                {
                    QuestionText       = q.QuestionText,
                    QuestionType       = q.QuestionType,
                    Options            = DeserializeOptions(q.OptionsJson),
                    CorrectOptionIndex = q.CorrectOptionIndex,
                    IdealAnswer        = idealAnswers.GetValueOrDefault(q.Id)
                })
                .ToArray()
        };
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private static ReportResponse BuildReportResponse(AppInterviewSession session, Dictionary<Guid, string> answers)
    {
        var report = session.FeedbackReport!;
        return new ReportResponse
        {
            Id                 = report.Id,
            SessionId          = session.Id,
            OverallScore       = report.OverallScore,
            TechnicalScore     = report.TechnicalScore,
            CommunicationScore = report.CommunicationScore,
            Summary            = report.Summary,
            GeneratedAtUtc     = report.GeneratedAtUtc,
            TimeTakenSeconds   = session.TimeTakenSeconds,
            ShareToken         = session.ShareToken,
            QuestionFeedbacks  = report.QuestionFeedbacks.Select(f =>
            {
                var q = session.Questions.FirstOrDefault(q => q.Id == f.QuestionId);
                return new QuestionFeedbackResponse
                {
                    QuestionId         = f.QuestionId,
                    QuestionText       = q?.QuestionText ?? string.Empty,
                    AnswerText         = answers.GetValueOrDefault(f.QuestionId, string.Empty),
                    Score              = f.Score,
                    Feedback           = f.Feedback,
                    Suggestion         = f.Suggestion,
                    IdealAnswer        = f.IdealAnswer,
                    QuestionType       = q?.QuestionType ?? "ShortAnswer",
                    Options            = DeserializeOptions(q?.OptionsJson),
                    CorrectOptionIndex = q?.CorrectOptionIndex
                };
            }).ToArray()
        };
    }

    private static SessionResponse MapSession(AppInterviewSession s, string resumeFileName) => new()
    {
        Id               = s.Id,
        ResumeId         = s.ResumeId,
        ResumeFileName   = resumeFileName,
        Status           = s.Status,
        CreatedAtUtc     = s.CreatedAtUtc,
        OverallScore     = s.FeedbackReport?.OverallScore,
        TimeTakenSeconds = s.TimeTakenSeconds,
        Questions      = s.Questions
            .OrderBy(q => q.OrderIndex)
            .Select(q => new QuestionResponse
            {
                Id                 = q.Id,
                QuestionText       = q.QuestionText,
                Category           = q.Category,
                Difficulty         = q.Difficulty,
                OrderIndex         = q.OrderIndex,
                QuestionType       = q.QuestionType,
                Options            = DeserializeOptions(q.OptionsJson),
                CorrectOptionIndex = q.CorrectOptionIndex
            })
            .ToArray()
    };

    private static string[] DeserializeOptions(string? json) =>
        string.IsNullOrEmpty(json) ? [] : JsonSerializer.Deserialize<string[]>(json) ?? [];
}
