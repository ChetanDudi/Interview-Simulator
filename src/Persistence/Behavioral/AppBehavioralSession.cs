namespace InterviewSimulator.Persistence.Behavioral;

public sealed class AppBehavioralSession
{
    public Guid      Id               { get; set; }
    public Guid      UserId           { get; set; }
    public string    Topic            { get; set; } = string.Empty;
    public string    Status           { get; set; } = "InProgress";
    public DateTime  CreatedAtUtc     { get; set; }
    public DateTime? CompletedAtUtc   { get; set; }
    public int?      TimeTakenSeconds { get; set; }
    public string    QuestionsJson    { get; set; } = "[]";
    public string?   FeedbackJson     { get; set; }
}
