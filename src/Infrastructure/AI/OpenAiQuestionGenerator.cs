using System.Text.Json;
using InterviewSimulator.Application.Abstractions.AI;

namespace InterviewSimulator.Infrastructure.AI;

public sealed class QuestionGenerator(ILLMService llm) : IQuestionGenerator
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public async Task<IReadOnlyList<GeneratedQuestion>> GenerateAsync(string resumeText, int count = 8, string? targetRole = null, string? sessionType = null, CancellationToken cancellationToken = default)
    {
        var roleInstruction = targetRole is not null
            ? $"Focus the questions specifically for the role: {targetRole}."
            : string.Empty;

        string prompt;

        if (sessionType == "Coding")
        {
            prompt = $$"""
                You are a senior software engineer conducting a coding interview. Based on the resume below, generate exactly {{count}} Data Structures & Algorithms / coding interview questions tailored to the candidate's tech stack and experience.
                {{roleInstruction}}

                IMPORTANT JSON rules — the response will be parsed as JSON so:
                - Do NOT use backslashes inside question text (no \n \t or similar — use plain spaces and line breaks instead)
                - Do NOT wrap the output in markdown code fences
                - All strings must use double quotes only

                Return ONLY a valid JSON array with this exact shape:
                [
                  {
                    "question": "Full problem statement. Example: Input [1,2,3] Output 6. Constraint: O(n) time.",
                    "type": "Coding",
                    "category": "Technical",
                    "difficulty": "Easy|Medium|Hard",
                    "options": [],
                    "correctOptionIndex": null
                  }
                ]

                Include problems on arrays, strings, recursion, trees, graphs, dynamic programming, sorting — matching the candidate's experience level.
                Each question must be self-contained with context, sample inputs/outputs, and constraints — all written as plain text (no code blocks inside the JSON string).

                Resume:
                {{resumeText}}
                """;
        }
        else
        {
            prompt = $$"""
                You are an expert technical interviewer. Analyse the following resume and generate exactly {{count}} interview questions.
                {{roleInstruction}}
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
        }

        var raw  = await llm.CompleteAsync(prompt, cancellationToken);
        var json = JsonSanitizer.ExtractJson(raw, expectArray: true);

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
