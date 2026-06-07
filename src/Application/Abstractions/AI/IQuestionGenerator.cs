namespace InterviewSimulator.Application.Abstractions.AI;

public interface IQuestionGenerator
{
    Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(string resumeText, int count = 8, string? targetRole = null, CancellationToken cancellationToken = default);
}

public sealed record GeneratedQuestion(
    string   Question,
    string   Category,
    string   Difficulty,
    string   QuestionType,
    string[] Options,
    int?     CorrectOptionIndex
);
