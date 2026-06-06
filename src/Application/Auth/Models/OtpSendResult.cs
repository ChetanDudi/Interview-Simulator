namespace InterviewSimulator.Application.Auth.Models;

public sealed class OtpSendResult
{
    private OtpSendResult(bool succeeded, int secondsUntilResend, IReadOnlyCollection<string> errors)
    {
        Succeeded          = succeeded;
        SecondsUntilResend = secondsUntilResend;
        Errors             = errors;
    }

    public bool                        Succeeded          { get; }
    public int                         SecondsUntilResend { get; }
    public IReadOnlyCollection<string> Errors             { get; }

    public static OtpSendResult Success()                      => new(true,  0,       []);
    public static OtpSendResult RateLimited(int seconds)       => new(false, seconds, []);
    public static OtpSendResult Failure(params string[] errors) => new(false, 0,      errors);
}
