using System.Text.Json;
using InterviewSimulator.Application.Abstractions.AI;

namespace InterviewSimulator.Infrastructure.AI;

public sealed class BehavioralQuestionGenerator(ILLMService llm) : IBehavioralQuestionGenerator
{
    private static readonly JsonSerializerOptions Opts = new() { PropertyNameCaseInsensitive = true };

    public async Task<IReadOnlyList<BehavioralGeneratedQuestion>> GenerateAsync(
        string topic, int count, CancellationToken ct = default)
    {
        var prompt = $$"""
            Generate exactly {{count}} behavioral interview questions for: {{topic}}.

            Return ONLY a JSON array of objects. No markdown, no explanation:
            [
              {
                "questionText": "Tell me about a time when you ...",
                "starHint": "Situation → Task → Action → Result",
                "category": "Leadership"
              }
            ]

            Categories must be one of: Leadership, Teamwork, Conflict, Achievement, Failure, Adaptability, Communication, Problem-Solving
            Questions must start with: "Tell me about a time when", "Describe a situation where", "Give an example of", "Can you walk me through a time when"
            Make them specific, diverse, and realistic for professional interviews.
            """;

        var raw  = await llm.CompleteAsync(prompt, ct);
        var json = JsonSanitizer.ExtractJson(raw, expectArray: true);

        var dtos = JsonSerializer.Deserialize<BqDto[]>(json, Opts) ?? [];
        return dtos.Select(d => new BehavioralGeneratedQuestion(
            d.QuestionText, d.StarHint, d.Category)).ToArray();
    }

    private sealed class BqDto
    {
        public string QuestionText { get; init; } = string.Empty;
        public string StarHint     { get; init; } = string.Empty;
        public string Category     { get; init; } = string.Empty;
    }
}
