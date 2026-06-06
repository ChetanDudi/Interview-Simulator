namespace InterviewSimulator.Application.Resumes.Models;

public sealed class ResumeResponse
{
    public Guid     Id               { get; init; }
    public string   OriginalFileName { get; init; } = string.Empty;
    public long     FileSizeBytes    { get; init; }
    public DateTime UploadedAtUtc    { get; init; }
    public string   Status           { get; init; } = string.Empty;
}
