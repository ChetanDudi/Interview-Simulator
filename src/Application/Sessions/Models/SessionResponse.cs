namespace InterviewSimulator.Application.Sessions.Models;

public sealed class SessionResponse
{
    public Guid                           Id             { get; init; }
    public Guid                           ResumeId       { get; init; }
    public string                         ResumeFileName { get; init; } = string.Empty;
    public string                         Status         { get; init; } = string.Empty;
    public DateTime                       CreatedAtUtc   { get; init; }
    public int?                           OverallScore   { get; init; }
    public IReadOnlyList<QuestionResponse> Questions     { get; init; } = [];
}
