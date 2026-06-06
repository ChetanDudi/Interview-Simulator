namespace InterviewSimulator.Application.Sessions.Models;

public sealed class QuestionFeedbackResponse
{
    public Guid   QuestionId   { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public string AnswerText   { get; init; } = string.Empty;
    public int    Score        { get; init; }
    public string   Feedback           { get; init; } = string.Empty;
    public string   Suggestion         { get; init; } = string.Empty;
    public string   IdealAnswer        { get; init; } = string.Empty;
    public string   QuestionType       { get; init; } = "ShortAnswer";
    public string[] Options            { get; init; } = [];
    public int?     CorrectOptionIndex { get; init; }
}
