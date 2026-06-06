namespace InterviewSimulator.Application.Auth.Models;

public sealed class AuthResult
{
    private AuthResult(
        bool succeeded,
        AuthResponse? response,
        IReadOnlyCollection<string> errors,
        bool requiresEmailVerification = false,
        string? unverifiedEmail = null)
    {
        Succeeded                  = succeeded;
        Response                   = response;
        Errors                     = errors;
        RequiresEmailVerification  = requiresEmailVerification;
        UnverifiedEmail            = unverifiedEmail;
    }

    public bool                        Succeeded                 { get; }
    public AuthResponse?               Response                  { get; }
    public IReadOnlyCollection<string> Errors                    { get; }
    public bool                        RequiresEmailVerification { get; }
    public string?                     UnverifiedEmail           { get; }

    public static AuthResult Success(AuthResponse response) => new(true, response, []);
    public static AuthResult Failure(params string[] errors) => new(false, null, errors);
    public static AuthResult EmailVerificationRequired(string email) => new(false, null, [], true, email);
}
