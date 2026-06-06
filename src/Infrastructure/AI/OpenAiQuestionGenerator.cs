using System.Text.Json;
using InterviewSimulator.Application.Abstractions.AI;

namespace InterviewSimulator.Infrastructure.AI;

public sealed class QuestionGenerator(ILLMService llm) : IQuestionGenerator
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public async Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(string resumeText, int count = 8, CancellationToken cancellationToken = default)
    {
        var prompt = $$"""
            You are an expert technical interviewer. Analyse the following resume and generate exactly {{count}} interview questions.
            Return ONLY a valid JSON array — no markdown, no explanation — with this exact schema:
            [
              {"question":"...", "category":"Technical|Behavioral|Project|Experience", "difficulty":"Easy|Medium|Hard"}
            ]

            Resume:
            {{resumeText}}
            """;

        var raw  = await llm.CompleteAsync(prompt, cancellationToken);
        var json = StripMarkdown(raw);

        var items = JsonSerializer.Deserialize<List<QuestionDto>>(json, JsonOpts)
            ?? throw new InvalidOperationException("Failed to parse question list from AI response.");

        return items
            .Select(q => new GeneratedQuestion(q.Question, q.Category, q.Difficulty))
            .ToArray();
    }

    private static string StripMarkdown(string raw)
    {
        var text = raw.Trim();
        if (!text.StartsWith("```")) return text;
        var lines = text.Split('\n');
        return string.Join('\n', lines.Skip(1).TakeWhile(l => !l.TrimStart().StartsWith("```"))).Trim();
    }

    private sealed class QuestionDto
    {
        public string Question   { get; init; } = string.Empty;
        public string Category   { get; init; } = string.Empty;
        public string Difficulty { get; init; } = string.Empty;
    }
}
