namespace InterviewSimulator.Application.Common;

public sealed class ServiceResult
{
    private ServiceResult(bool succeeded, IReadOnlyCollection<string> errors, string? data = null)
    {
        Succeeded = succeeded;
        Errors    = errors;
        Data      = data;
    }

    public bool                      Succeeded { get; }
    public IReadOnlyCollection<string> Errors  { get; }

    // Carries a string payload (e.g. reset token in dev mode). Null in production responses.
    public string? Data { get; }

    public static ServiceResult Success(string? data = null) => new(true, [], data);
    public static ServiceResult Failure(params string[] errors) => new(false, errors);
}
