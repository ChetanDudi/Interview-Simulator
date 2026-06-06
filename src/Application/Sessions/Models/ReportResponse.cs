namespace InterviewSimulator.Application.Sessions.Models;

public sealed class ReportResponse
{
    public Guid                                  Id                 { get; init; }
    public Guid                                  SessionId          { get; init; }
    public int                                   OverallScore       { get; init; }
    public int                                   TechnicalScore     { get; init; }
    public int                                   CommunicationScore { get; init; }
    public string                                Summary            { get; init; } = string.Empty;
    public DateTime                              GeneratedAtUtc     { get; init; }
    public IReadOnlyList<QuestionFeedbackResponse> QuestionFeedbacks { get; init; } = [];
}
