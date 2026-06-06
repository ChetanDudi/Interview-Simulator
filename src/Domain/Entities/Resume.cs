namespace InterviewSimulator.Domain.Entities;

public sealed class Resume
{
    public Guid     Id               { get; init; }
    public Guid     UserId           { get; init; }
    public string   OriginalFileName { get; init; } = string.Empty;
    public long     FileSizeBytes    { get; init; }
    public DateTime UploadedAtUtc    { get; init; }
    public string   Status           { get; set; }  = "Uploaded";
}
