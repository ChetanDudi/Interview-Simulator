namespace InterviewSimulator.Application.Behavioral.Models;

public sealed class BehavioralSessionResponse
{
    public Guid                 Id               { get; init; }
    public string               Topic            { get; init; } = string.Empty;
    public string               Status           { get; init; } = string.Empty;
    public DateTime             CreatedAtUtc     { get; init; }
    public int?                 TimeTakenSeconds { get; init; }
    public BehavioralQuestion[] Questions        { get; init; } = [];
}

public sealed class BehavioralQuestion
{
    public string  Id           { get; init; } = string.Empty;
    public string  QuestionText { get; init; } = string.Empty;
    public string  StarHint     { get; init; } = string.Empty;
    public string  Category     { get; init; } = string.Empty;
    public string? AnswerText   { get; init; }
}

public sealed class BehavioralReportResponse
{
    public int                      OverallScore { get; init; }
    public string                   Summary      { get; init; } = string.Empty;
    public BehavioralFeedbackItem[] Feedbacks    { get; init; } = [];
}

public sealed class BehavioralFeedbackItem
{
    public int    QuestionIndex { get; init; }
    public string QuestionText  { get; init; } = string.Empty;
    public string AnswerText    { get; init; } = string.Empty;
    public int    Score         { get; init; }
    public string Feedback      { get; init; } = string.Empty;
    public string Suggestion    { get; init; } = string.Empty;
    public string IdealAnswer   { get; init; } = string.Empty;
    public string StarAnalysis  { get; init; } = string.Empty;
}

public sealed class SubmitBehavioralRequest
{
    public string[] Answers         { get; init; } = [];
    public int      TimeTakenSeconds { get; init; }
}
