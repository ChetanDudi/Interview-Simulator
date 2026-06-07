using InterviewSimulator.Application.Resumes.Models;

namespace InterviewSimulator.Application.Abstractions.AI;

public interface IResumeAnalyser
{
    Task<ResumeReviewResponse> ReviewAsync(string resumeText, CancellationToken ct = default);
    Task<JobMatchResponse>     MatchJobAsync(string resumeText, string jobDescription, CancellationToken ct = default);
    Task<string>               GenerateCoverLetterAsync(string resumeText, string jobDescription, CancellationToken ct = default);
}
