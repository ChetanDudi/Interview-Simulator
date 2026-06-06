namespace InterviewSimulator.Persistence.Resumes;

public sealed class AppResume
{
    public Guid     Id               { get; set; }
    public Guid     UserId           { get; set; }
    public string   OriginalFileName { get; set; } = string.Empty;
    public string   StoredPath       { get; set; } = string.Empty;
    public long     FileSizeBytes    { get; set; }
    public DateTime UploadedAtUtc    { get; set; }
    public string   Status           { get; set; } = "Uploaded";
    public string?  ExtractedText    { get; set; }
}
