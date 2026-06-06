namespace InterviewSimulator.Persistence.Sessions;

public sealed class AppInterviewAnswer
{
    public Guid     Id             { get; set; }
    public Guid     QuestionId     { get; set; }
    public Guid     SessionId      { get; set; }
    public string   AnswerText     { get; set; } = string.Empty;
    public DateTime SubmittedAtUtc { get; set; }
}
