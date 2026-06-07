namespace InterviewSimulator.Application.Sessions.Models;

public sealed class InterviewAttemptResponse
{
    public Guid                           SessionId       { get; init; }
    public string                         ResumeTitle     { get; init; } = string.Empty;
    public DateTime                       CreatedAtUtc    { get; init; }
    public bool                           HasModelAnswers { get; init; }
    public IReadOnlyList<AttemptQuestion> Questions       { get; init; } = [];
}

public sealed class AttemptQuestion
{
    public string   QuestionText       { get; init; } = string.Empty;
    public string   QuestionType       { get; init; } = string.Empty;
    public string[] Options            { get; init; } = [];
    public int?     CorrectOptionIndex { get; init; }
    public string?  IdealAnswer        { get; init; }
}
