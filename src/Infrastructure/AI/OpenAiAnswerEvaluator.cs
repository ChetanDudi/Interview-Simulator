using System.Text;
using System.Text.Json;
using InterviewSimulator.Application.Abstractions.AI;

namespace InterviewSimulator.Infrastructure.AI;

public sealed class AnswerEvaluator(ILLMService llm) : IAnswerEvaluator
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public async Task<EvaluationResult> EvaluateAsync(IReadOnlyList<QuestionAnswerPair> pairs, CancellationToken cancellationToken = default)
    {
        var qaList = new StringBuilder();
        for (var i = 0; i < pairs.Count; i++)
            qaList.AppendLine($"Q{i + 1}: {pairs[i].Question}\nA{i + 1}: {pairs[i].Answer}\n");

        var prompt = $$"""
            You are an expert interviewer evaluating candidate answers. Analyse each Q&A pair.
            Return ONLY a valid JSON object — no markdown, no explanation:
            {
              "overallScore": 0-100,
              "technicalScore": 0-100,
              "communicationScore": 0-100,
              "summary": "2-3 sentence overall assessment.",
              "questionFeedbacks": [
                {
                  "questionIndex": 0,
                  "score": 0-10,
                  "feedback": "What was good or lacking in this answer.",
                  "suggestion": "Specific way to improve this answer."
                }
              ]
            }

            Questions and Answers:
            {{qaList}}
            """;

        var raw  = await llm.CompleteAsync(prompt, cancellationToken);
        var json = StripMarkdown(raw);

        var dto = JsonSerializer.Deserialize<EvalDto>(json, JsonOpts)
            ?? throw new InvalidOperationException("Failed to parse evaluation from AI response.");

        return new EvaluationResult
        {
            OverallScore       = dto.OverallScore,
            TechnicalScore     = dto.TechnicalScore,
            CommunicationScore = dto.CommunicationScore,
            Summary            = dto.Summary,
            Feedbacks          = dto.QuestionFeedbacks
                .Select(f => new QuestionEval
                {
                    QuestionIndex = f.QuestionIndex,
                    Score         = f.Score,
                    Feedback      = f.Feedback,
                    Suggestion    = f.Suggestion
                })
                .ToArray()
        };
    }

    private static string StripMarkdown(string raw)
    {
        var text = raw.Trim();
        if (!text.StartsWith("```")) return text;
        var lines = text.Split('\n');
        return string.Join('\n', lines.Skip(1).TakeWhile(l => !l.TrimStart().StartsWith("```"))).Trim();
    }

    private sealed class EvalDto
    {
        public int                    OverallScore       { get; init; }
        public int                    TechnicalScore     { get; init; }
        public int                    CommunicationScore { get; init; }
        public string                 Summary            { get; init; } = string.Empty;
        public List<FeedbackDto>      QuestionFeedbacks  { get; init; } = [];
    }

    private sealed class FeedbackDto
    {
        public int    QuestionIndex { get; init; }
        public int    Score         { get; init; }
        public string Feedback      { get; init; } = string.Empty;
        public string Suggestion    { get; init; } = string.Empty;
    }
}
