namespace InterviewSimulator.Persistence.Sessions;

public sealed class AppInterviewSession
{
    public Guid      Id              { get; set; }
    public Guid      UserId          { get; set; }
    public Guid      ResumeId        { get; set; }
    /// <summary>"Created" | "InProgress" | "Completed"</summary>
    public string    Status          { get; set; } = "Created";
    public DateTime  CreatedAtUtc    { get; set; }
    public DateTime? CompletedAtUtc  { get; set; }

    public int?      TimeTakenSeconds { get; set; }
    public string?   ShareToken       { get; set; }

    public List<AppInterviewQuestion> Questions      { get; set; } = [];
    public AppFeedbackReport?         FeedbackReport { get; set; }
}
