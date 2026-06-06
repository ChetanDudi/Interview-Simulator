namespace InterviewSimulator.Application.Practice.Models;

public sealed class PracticeSessionResponse
{
    public Guid     Id           { get; init; }
    public string   Topic        { get; init; } = string.Empty;
    public DateTime CreatedAtUtc { get; init; }
    public string?  ShareToken   { get; init; }
    public IReadOnlyList<PracticeQuestion> Questions { get; init; } = [];
}
