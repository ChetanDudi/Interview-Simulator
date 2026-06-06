namespace InterviewSimulator.Application.Sessions.Models;

public sealed class QuestionResponse
{
    public Guid   Id           { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public string   Category           { get; init; } = string.Empty;
    public string   Difficulty         { get; init; } = string.Empty;
    public int      OrderIndex         { get; init; }
    public string   QuestionType       { get; init; } = "ShortAnswer";
    public string[] Options            { get; init; } = [];
    public int?     CorrectOptionIndex { get; init; }
}
