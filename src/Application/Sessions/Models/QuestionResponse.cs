namespace InterviewSimulator.Application.Sessions.Models;

public sealed class QuestionResponse
{
    public Guid   Id           { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public string Category     { get; init; } = string.Empty;
    public string Difficulty   { get; init; } = string.Empty;
    public int    OrderIndex   { get; init; }
}
