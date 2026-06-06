namespace InterviewSimulator.Persistence.Sessions;

public sealed class AppQuestionFeedback
{
    public Guid   Id         { get; set; }
    public Guid   ReportId   { get; set; }
    public Guid   QuestionId { get; set; }
    public int    Score      { get; set; }
    public string Feedback   { get; set; } = string.Empty;
    public string Suggestion { get; set; } = string.Empty;
}
