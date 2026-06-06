namespace InterviewSimulator.Application.Resumes.Models;

public sealed class UploadResumeResult
{
    private UploadResumeResult(bool succeeded, ResumeResponse? resume, IReadOnlyCollection<string> errors)
    {
        Succeeded = succeeded;
        Resume    = resume;
        Errors    = errors;
    }

    public bool                        Succeeded { get; }
    public ResumeResponse?             Resume    { get; }
    public IReadOnlyCollection<string> Errors    { get; }

    public static UploadResumeResult Success(ResumeResponse resume) => new(true, resume, []);
    public static UploadResumeResult Failure(params string[] errors) => new(false, null, errors);
}
