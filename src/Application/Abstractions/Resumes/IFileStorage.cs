namespace InterviewSimulator.Application.Abstractions.Resumes;

public interface IFileStorage
{
    Task<string> SaveAsync(string directory, string fileName, Stream content, CancellationToken cancellationToken = default);
    Task DeleteAsync(string filePath, CancellationToken cancellationToken = default);
}
