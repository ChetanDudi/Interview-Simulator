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
    IPdfExtractor               pdfExtractor,
    IResumeAnalyser             resumeAnalyser) : IResumeService
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

        var resumeIds = resumes.Select(r => r.Id).ToList();

        // Load completed sessions with feedback for these resumes
        var sessions = await dbContext.Sessions
            .Include(s => s.FeedbackReport)
            .Where(s => s.UserId == userId && resumeIds.Contains(s.ResumeId) && s.Status == "Completed")
            .ToListAsync(cancellationToken);

        // Group stats by resume ID
        var statsLookup = sessions
            .GroupBy(s => s.ResumeId)
            .ToDictionary(
                g => g.Key,
                g => new ResumeStats(
                    InterviewCount:    g.Count(),
                    AverageScore:      g.Any(s => s.FeedbackReport != null)
                                           ? g.Where(s => s.FeedbackReport != null)
                                              .Average(s => (double)s.FeedbackReport!.OverallScore)
                                           : (double?)null,
                    BestScore:         g.Any(s => s.FeedbackReport != null)
                                           ? g.Where(s => s.FeedbackReport != null)
                                              .Max(s => s.FeedbackReport!.OverallScore)
                                           : (int?)null,
                    LastInterviewDate: g.Max(s => s.CompletedAtUtc)
                ));

        return resumes.Select(r =>
        {
            statsLookup.TryGetValue(r.Id, out var stats);
            return MapToResponse(r, stats);
        }).ToArray();
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

    // ── AI features ───────────────────────────────────────────────────────────

    public async Task<ResumeReviewResponse?> ReviewAsync(Guid userId, Guid resumeId, CancellationToken ct = default)
    {
        var resume = await dbContext.Resumes
            .FirstOrDefaultAsync(r => r.Id == resumeId && r.UserId == userId, ct);

        if (resume is null) return null;

        if (string.IsNullOrWhiteSpace(resume.ExtractedText))
            throw new InvalidOperationException("No text could be extracted from this resume.");

        return await resumeAnalyser.ReviewAsync(resume.ExtractedText, ct);
    }

    public async Task<JobMatchResponse?> MatchJobAsync(Guid userId, Guid resumeId, string jobDescription, CancellationToken ct = default)
    {
        var resume = await dbContext.Resumes
            .FirstOrDefaultAsync(r => r.Id == resumeId && r.UserId == userId, ct);

        if (resume is null) return null;

        if (string.IsNullOrWhiteSpace(resume.ExtractedText))
            throw new InvalidOperationException("No text could be extracted from this resume.");

        return await resumeAnalyser.MatchJobAsync(resume.ExtractedText, jobDescription, ct);
    }

    public async Task<string?> GenerateCoverLetterAsync(Guid userId, Guid resumeId, string jobDescription, CancellationToken ct = default)
    {
        var resume = await dbContext.Resumes
            .FirstOrDefaultAsync(r => r.Id == resumeId && r.UserId == userId, ct);

        if (resume is null) return null;

        if (string.IsNullOrWhiteSpace(resume.ExtractedText))
            throw new InvalidOperationException("No text could be extracted from this resume.");

        return await resumeAnalyser.GenerateCoverLetterAsync(resume.ExtractedText, jobDescription, ct);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private sealed record ResumeStats(
        int       InterviewCount,
        double?   AverageScore,
        int?      BestScore,
        DateTime? LastInterviewDate);

    private static ResumeResponse MapToResponse(AppResume r, ResumeStats? stats = null) => new()
    {
        Id                = r.Id,
        OriginalFileName  = r.OriginalFileName,
        FileSizeBytes     = r.FileSizeBytes,
        UploadedAtUtc     = r.UploadedAtUtc,
        Status            = r.Status,
        InterviewCount    = stats?.InterviewCount ?? 0,
        AverageScore      = stats?.AverageScore,
        BestScore         = stats?.BestScore,
        LastInterviewDate = stats?.LastInterviewDate
    };
}
