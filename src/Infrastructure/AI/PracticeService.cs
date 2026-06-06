using System.Text.Json;
using InterviewSimulator.Application.Abstractions.AI;
using InterviewSimulator.Application.Abstractions.Practice;
using InterviewSimulator.Application.Practice.Models;

namespace InterviewSimulator.Infrastructure.AI;

public sealed class PracticeService(ILLMService llm) : IPracticeService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public async Task<IReadOnlyList<PracticeQuestion>> GenerateAsync(string topic, int count, CancellationToken cancellationToken = default)
    {
        var prompt = $$"""
            You are an expert interviewer. Generate exactly {{count}} practice Q&A pairs on the topic: "{{topic}}".
            Use a mix of question types (MCQ, ShortAnswer, LongAnswer, Coding).

            Return ONLY a valid JSON array — no markdown, no explanation:
            [
              {
                "questionText": "...",
                "answer": "Complete, detailed answer. For Coding include working code with explanation.",
                "type": "MCQ|ShortAnswer|LongAnswer|Coding",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctOptionIndex": 1
              }
            ]

            Rules:
            - MCQ: exactly 4 options, correctOptionIndex is 0-3. Answer explains WHY it's correct.
            - Coding: answer includes working code with line-by-line explanation.
            - Non-MCQ: options is empty array [], correctOptionIndex is null.
            - Aim for roughly 30% MCQ, 25% ShortAnswer, 30% LongAnswer, 15% Coding.
            """;

        var raw  = await llm.CompleteAsync(prompt, cancellationToken);
        var json = StripMarkdown(raw);

        var items = JsonSerializer.Deserialize<List<PracticeDto>>(json, JsonOpts)
            ?? throw new InvalidOperationException("Failed to parse practice questions from AI response.");

        return items.Select(q => new PracticeQuestion
        {
            QuestionText       = q.QuestionText,
            Answer             = q.Answer,
            QuestionType       = q.Type,
            Options            = q.Options ?? [],
            CorrectOptionIndex = q.CorrectOptionIndex
        }).ToArray();
    }

    private static string StripMarkdown(string raw)
    {
        var text = raw.Trim();
        if (!text.StartsWith("```")) return text;
        var lines = text.Split('\n');
        return string.Join('\n', lines.Skip(1).TakeWhile(l => !l.TrimStart().StartsWith("```"))).Trim();
    }

    private sealed class PracticeDto
    {
        public string   QuestionText       { get; init; } = string.Empty;
        public string   Answer             { get; init; } = string.Empty;
        public string   Type               { get; init; } = "ShortAnswer";
        public string[] Options            { get; init; } = [];
        public int?     CorrectOptionIndex { get; init; }
    }
}
