namespace InterviewSimulator.Application.Practice.Models;

public sealed class PracticeQuestion
{
    public string   QuestionText       { get; init; } = string.Empty;
    public string   Answer             { get; init; } = string.Empty;
    public string   QuestionType       { get; init; } = "ShortAnswer";
    public string[] Options            { get; init; } = [];
    public int?     CorrectOptionIndex { get; init; }
}

public sealed class GeneratePracticeRequest
{
    public string Topic { get; init; } = string.Empty;
    public int    Count { get; init; } = 8;
}
