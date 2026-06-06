using InterviewSimulator.Application.Abstractions.Resumes;
using Microsoft.Extensions.Options;

namespace InterviewSimulator.Infrastructure.Storage;

public sealed class LocalFileStorage(IOptions<FileStorageOptions> options) : IFileStorage
{
    public async Task<string> SaveAsync(string directory, string fileName, Stream content, CancellationToken cancellationToken = default)
    {
        var fullDirectory = Path.Combine(options.Value.BasePath, directory);
        Directory.CreateDirectory(fullDirectory);

        var filePath = Path.Combine(fullDirectory, fileName);
        await using var fileStream = File.Create(filePath);
        await content.CopyToAsync(fileStream, cancellationToken);

        return filePath;
    }

    public Task DeleteAsync(string filePath, CancellationToken cancellationToken = default)
    {
        if (File.Exists(filePath))
            File.Delete(filePath);

        return Task.CompletedTask;
    }
}
