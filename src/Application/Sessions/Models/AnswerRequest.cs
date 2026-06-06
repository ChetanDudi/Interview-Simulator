namespace InterviewSimulator.Application.Sessions.Models;

public sealed class AnswerRequest
{
    public Guid   QuestionId { get; init; }
    public string AnswerText { get; init; } = string.Empty;
}
