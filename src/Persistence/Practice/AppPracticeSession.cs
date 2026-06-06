namespace InterviewSimulator.Persistence.Practice;

public sealed class AppPracticeSession
{
    public Guid      Id           { get; set; }
    public Guid      UserId       { get; set; }
    public string    Topic        { get; set; } = string.Empty;
    public DateTime  CreatedAtUtc { get; set; }
    public string?   ShareToken   { get; set; }

    public List<AppPracticeQuestion> Questions { get; set; } = [];
}
