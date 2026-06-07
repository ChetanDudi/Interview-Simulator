namespace InterviewSimulator.Application.Analytics.Models;

public sealed class AnalyticsResponse
{
    public int         Streak           { get; init; }
    public int         TotalInterviews  { get; init; }
    public double?     AverageScore     { get; init; }
    public int?        BestScore        { get; init; }
    public double?     AvgTechnical     { get; init; }
    public double?     AvgCommunication { get; init; }
    public ScorePoint[]    ScoreHistory { get; init; } = [];
    public CategoryScore[] WeakAreas    { get; init; } = [];
}

public sealed class ScorePoint
{
    public DateTime Date  { get; init; }
    public int      Score { get; init; }
    public string   Label { get; init; } = string.Empty;
}

public sealed class CategoryScore
{
    public string Category { get; init; } = string.Empty;
    public int    Score    { get; init; }
}
