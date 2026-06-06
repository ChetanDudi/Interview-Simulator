namespace InterviewSimulator.Persistence.Sessions;

public sealed class AppFeedbackReport
{
    public Guid     Id                 { get; set; }
    public Guid     SessionId          { get; set; }
    public int      OverallScore       { get; set; }
    public int      TechnicalScore     { get; set; }
    public int      CommunicationScore { get; set; }
    public string   Summary            { get; set; } = string.Empty;
    public DateTime GeneratedAtUtc     { get; set; }

    public List<AppQuestionFeedback> QuestionFeedbacks { get; set; } = [];
}
