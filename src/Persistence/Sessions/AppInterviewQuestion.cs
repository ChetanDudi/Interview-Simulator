namespace InterviewSimulator.Persistence.Sessions;

public sealed class AppInterviewQuestion
{
    public Guid   Id           { get; set; }
    public Guid   SessionId    { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string Category     { get; set; } = string.Empty;
    public string Difficulty   { get; set; } = string.Empty;
    public int    OrderIndex   { get; set; }

    public AppInterviewAnswer? Answer { get; set; }
}
