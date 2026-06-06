using InterviewSimulator.Application.Abstractions.AI;
using InterviewSimulator.Application.Abstractions.Resumes;
using InterviewSimulator.Application.Common;
using InterviewSimulator.Application.Resumes.Models;
using InterviewSimulator.Persistence.Db;
using InterviewSimulator.Persistence.Resumes;
using Microsoft.EntityFrameworkCore;

namespace InterviewSimulator.Persistence.Services;

public sealed class ResumeService(
    InterviewSimulatorDbContext dbContext,
    IFileStorage                fileStorage,
    IPdfExtractor               pdfExtractor) : IResumeService
{
    private static readonly string[] AllowedExtensions = [".pdf"];
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    public async Task<UploadResumeResult> UploadAsync(
        Guid userId, string originalFileName, Stream fileStream, long fileSizeBytes,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return UploadResumeResult.Failure("Only PDF files are accepted.");

        if (fileSizeBytes > MaxFileSizeBytes)
            return UploadResumeResult.Failure("File must be under 10 MB.");

        var storedFileName = $"{Guid.NewGuid()}{extension}";
        var directory      = Path.Combine("resumes", userId.ToString());
        var storedPath     = await fileStorage.SaveAsync(directory, storedFileName, fileStream, cancellationToken);

        // Extract text from the saved file for AI question generation
        string? extractedText = null;
        try
        {
            await using var extractStream = File.OpenRead(storedPath);
            extractedText = pdfExtractor.ExtractText(extractStream);
            if (string.IsNullOrWhiteSpace(extractedText)) extractedText = null;
        }
        catch
        {
            // Text extraction is best-effort; don't fail the upload
        }

        var resume = new AppResume
        {
            Id               = Guid.NewGuid(),
            UserId           = userId,
            OriginalFileName = originalFileName,
            StoredPath       = storedPath,
            FileSizeBytes    = fileSizeBytes,
            UploadedAtUtc    = DateTime.UtcNow,
            Status           = extractedText is null ? "TextExtractionFailed" : "Ready",
            ExtractedText    = extractedText
        };

        dbContext.Resumes.Add(resume);
        await dbContext.SaveChangesAsync(cancellationToken);

        return UploadResumeResult.Success(MapToResponse(resume));
    }

    public async Task<IReadOnlyCollection<ResumeResponse>> GetByUserAsync(
        Guid userId, CancellationToken cancellationToken = default)
    {
        var resumes = await dbContext.Resumes
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.UploadedAtUtc)
            .ToListAsync(cancellationToken);

        return resumes.Select(MapToResponse).ToArray();
    }

    public async Task<ServiceResult> DeleteAsync(
        Guid userId, Guid resumeId, CancellationToken cancellationToken = default)
    {
        var resume = await dbContext.Resumes
            .FirstOrDefaultAsync(r => r.Id == resumeId && r.UserId == userId, cancellationToken);

        if (resume is null) return ServiceResult.Failure("Resume not found.");

        await fileStorage.DeleteAsync(resume.StoredPath, cancellationToken);
        dbContext.Resumes.Remove(resume);
        await dbContext.SaveChangesAsync(cancellationToken);

        return ServiceResult.Success();
    }

    private static ResumeResponse MapToResponse(AppResume r) => new()
    {
        Id               = r.Id,
        OriginalFileName = r.OriginalFileName,
        FileSizeBytes    = r.FileSizeBytes,
        UploadedAtUtc    = r.UploadedAtUtc,
        Status           = r.Status
    };
}
