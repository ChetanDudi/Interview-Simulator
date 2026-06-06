namespace InterviewSimulator.Infrastructure.Storage;

public sealed class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    public string BasePath { get; init; } = "uploads";
}
