namespace InterviewSimulator.Application.Resumes.Models;

public sealed class JobMatchResponse
{
    public int      MatchPercentage { get; init; }
    public string   Summary         { get; init; } = string.Empty;
    public string[] PresentKeywords { get; init; } = [];
    public string[] MissingKeywords { get; init; } = [];
    public string[] Highlights      { get; init; } = [];
    public string[] GapAnalysis     { get; init; } = [];
    public string[] Recommendations { get; init; } = [];
}
