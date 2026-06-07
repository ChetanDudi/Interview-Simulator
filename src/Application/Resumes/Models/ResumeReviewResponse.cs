namespace InterviewSimulator.Application.Resumes.Models;

public sealed class ResumeReviewResponse
{
    public int            OverallScore      { get; init; }
    public string         Summary           { get; init; } = string.Empty;
    public ReviewSection  SummarySection    { get; init; } = new();
    public ReviewSection  ExperienceSection { get; init; } = new();
    public ReviewSection  SkillsSection     { get; init; } = new();
    public ReviewSection  EducationSection  { get; init; } = new();
    public string[]       TopStrengths      { get; init; } = [];
    public string[]       CriticalGaps      { get; init; } = [];
    public int            AtsScore          { get; init; }
    public string[]       AtsTips           { get; init; } = [];
}

public sealed class ReviewSection
{
    public int      Score       { get; init; }
    public string   Feedback    { get; init; } = string.Empty;
    public string[] Suggestions { get; init; } = [];
}
