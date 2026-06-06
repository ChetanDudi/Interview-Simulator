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
            Use a MIX of question types suited to the candidate's skills:
            - MCQ: Multiple choice with exactly 4 options (theory / concept checks).
            - ShortAnswer: 1-2 sentence factual answer.
            - LongAnswer: Detailed explanation or behavioural question.
            - Coding: Write or analyse code / algorithms.

            Return ONLY a valid JSON array — no markdown, no explanation:
            [
              {
                "question": "...",
                "type": "MCQ|ShortAnswer|LongAnswer|Coding",
                "category": "Technical|Behavioral|Project|Experience",
                "difficulty": "Easy|Medium|Hard",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctOptionIndex": 1
              }
            ]

            Rules:
            - MCQ: options must have exactly 4 items, correctOptionIndex is 0-3.
            - Non-MCQ: options is empty array [], correctOptionIndex is null.
            - For {{count}} questions aim for roughly 30% MCQ, 25% ShortAnswer, 30% LongAnswer, 15% Coding.

            Resume:
            {{resumeText}}
            """;

        var raw  = await llm.CompleteAsync(prompt, cancellationToken);
        var json = StripMarkdown(raw);

        var items = JsonSerializer.Deserialize<List<QuestionDto>>(json, JsonOpts)
            ?? throw new InvalidOperationException("Failed to parse question list from AI response.");

        return items
            .Select(q => new GeneratedQuestion(
                q.Question,
                q.Category,
                q.Difficulty,
                q.Type,
                q.Options ?? [],
                q.CorrectOptionIndex))
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
        public string   Question           { get; init; } = string.Empty;
        public string   Category           { get; init; } = string.Empty;
        public string   Difficulty         { get; init; } = string.Empty;
        public string   Type               { get; init; } = "ShortAnswer";
        public string[] Options            { get; init; } = [];
        public int?     CorrectOptionIndex { get; init; }
    }
}
