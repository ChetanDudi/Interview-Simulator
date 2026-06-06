namespace InterviewSimulator.Application.Sessions.Models;

public sealed class CreateSessionResult
{
    private CreateSessionResult(bool succeeded, SessionResponse? session, IReadOnlyCollection<string> errors)
    {
        Succeeded = succeeded;
        Session   = session;
        Errors    = errors;
    }

    public bool                        Succeeded { get; }
    public SessionResponse?            Session   { get; }
    public IReadOnlyCollection<string> Errors    { get; }

    public static CreateSessionResult Success(SessionResponse session) => new(true, session, []);
    public static CreateSessionResult Failure(params string[] errors)  => new(false, null, errors);
}
