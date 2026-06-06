namespace InterviewSimulator.Persistence.Practice;

public sealed class AppPracticeQuestion
{
    public Guid    Id                 { get; set; }
    public Guid    SessionId          { get; set; }
    public int     OrderIndex         { get; set; }
    public string  QuestionText       { get; set; } = string.Empty;
    public string  QuestionType       { get; set; } = "ShortAnswer";
    public string? OptionsJson        { get; set; }
    public int?    CorrectOptionIndex { get; set; }
    public string  Answer             { get; set; } = string.Empty;

    public AppPracticeSession Session { get; set; } = null!;
}
