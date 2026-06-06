namespace InterviewSimulator.Infrastructure.Email;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>"Console" (dev), "Smtp", "Resend", or "SendGrid" (production).</summary>
    public string     Provider        { get; init; } = "Console";
    public string     From            { get; init; } = "noreply@interviewsimulator.dev";
    public string     FromName        { get; init; } = "Interview Simulator";
    public string     ResendApiKey    { get; init; } = string.Empty;
    public string     SendGridApiKey  { get; init; } = string.Empty;
    public SmtpConfig Smtp            { get; init; } = new();
}

public sealed class SmtpConfig
{
    public string Host      { get; init; } = "localhost";
    public int    Port      { get; init; } = 587;
    public string Username  { get; init; } = string.Empty;
    public string Password  { get; init; } = string.Empty;
    public bool   EnableSsl { get; init; } = true;
}
