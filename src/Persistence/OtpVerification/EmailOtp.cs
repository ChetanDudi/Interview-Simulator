namespace InterviewSimulator.Persistence.OtpVerification;

public sealed class EmailOtp
{
    public Guid     Id           { get; set; }
    public string   Email        { get; set; } = string.Empty;
    public string   Code         { get; set; } = string.Empty;
    /// <summary>"EmailVerification" or "PasswordReset"</summary>
    public string   Purpose      { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public bool     IsUsed       { get; set; }
}
