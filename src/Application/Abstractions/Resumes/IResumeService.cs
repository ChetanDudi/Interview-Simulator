using InterviewSimulator.Application.Common;
using InterviewSimulator.Application.Resumes.Models;

namespace InterviewSimulator.Application.Abstractions.Resumes;

public interface IResumeService
{
    Task<UploadResumeResult>            UploadAsync(Guid userId, string originalFileName, Stream fileStream, long fileSizeBytes, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ResumeResponse>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<ServiceResult>                 DeleteAsync(Guid userId, Guid resumeId, CancellationToken cancellationToken = default);
}
