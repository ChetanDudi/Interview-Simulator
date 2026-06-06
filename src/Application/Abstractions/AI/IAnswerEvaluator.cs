namespace InterviewSimulator.Application.Abstractions.AI;

public interface IAnswerEvaluator
{
    Task<EvaluationResult> EvaluateAsync(IReadOnlyList<QuestionAnswerPair> pairs, CancellationToken cancellationToken = default);
}

public sealed record QuestionAnswerPair(string Question, string Answer);

public sealed class EvaluationResult
{
    public int                           OverallScore       { get; init; }
    public int                           TechnicalScore     { get; init; }
    public int                           CommunicationScore { get; init; }
    public string                        Summary            { get; init; } = string.Empty;
    public IReadOnlyList<QuestionEval>   Feedbacks          { get; init; } = [];
}

public sealed class QuestionEval
{
    public int    QuestionIndex { get; init; }
    public int    Score         { get; init; }
    public string Feedback      { get; init; } = string.Empty;
    public string Suggestion    { get; init; } = string.Empty;
    public string IdealAnswer   { get; init; } = string.Empty;
}
