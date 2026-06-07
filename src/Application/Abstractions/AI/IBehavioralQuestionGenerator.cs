namespace InterviewSimulator.Application.Abstractions.AI;

public sealed record BehavioralGeneratedQuestion(
    string QuestionText,
    string StarHint,
    string Category);

public interface IBehavioralQuestionGenerator
{
    Task<IReadOnlyList<BehavioralGeneratedQuestion>> GenerateAsync(
        string topic, int count, CancellationToken ct = default);
}
