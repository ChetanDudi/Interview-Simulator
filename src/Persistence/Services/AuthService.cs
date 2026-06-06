using InterviewSimulator.Application.Abstractions.Auth;
using InterviewSimulator.Application.Abstractions.Email;
using InterviewSimulator.Application.Auth.Models;
using InterviewSimulator.Application.Common;
using InterviewSimulator.Persistence.Db;
using InterviewSimulator.Persistence.Identity;
using InterviewSimulator.Persistence.OtpVerification;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InterviewSimulator.Persistence.Services;

public sealed class AuthService(
    UserManager<AppUser>            userManager,
    RoleManager<AppRole>            roleManager,
    IJwtTokenGenerator              jwtTokenGenerator,
    IEmailSender                    emailSender,
    InterviewSimulatorDbContext     dbContext) : IAuthService
{
    private const string DefaultRoleName       = "Candidate";
    private const int    OtpExpiryMinutes      = 10;
    private const int    OtpResendCooldownSecs = 120;
    private const string PurposeEmailVerify    = "EmailVerification";
    private const string PurposePasswordReset  = "PasswordReset";

    // ── Register ────────────────────────────────────────────────────────────

    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var name  = request.Name.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(name))    return AuthResult.Failure("Name is required.");
        if (string.IsNullOrWhiteSpace(email))   return AuthResult.Failure("Email is required.");
        if (string.IsNullOrWhiteSpace(request.Password)) return AuthResult.Failure("Password is required.");

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            if (!existing.EmailConfirmed)
            {
                // Allow re-registration attempt: resend OTP if cooldown allows
                await TrySendOtpAsync(email, PurposeEmailVerify, cancellationToken);
                return AuthResult.EmailVerificationRequired(email);
            }
            return AuthResult.Failure("An account with this email already exists.");
        }

        await EnsureRoleExistsAsync(DefaultRoleName);

        var user = new AppUser
        {
            Id           = Guid.NewGuid(),
            Name         = name,
            Email        = email,
            UserName     = email,
            CreatedAtUtc = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            return AuthResult.Failure(createResult.Errors.Select(e => e.Description).ToArray());

        var roleResult = await userManager.AddToRoleAsync(user, DefaultRoleName);
        if (!roleResult.Succeeded)
            return AuthResult.Failure(roleResult.Errors.Select(e => e.Description).ToArray());

        // Initial OTP — bypass rate limit since this is the first send for this account
        await SendOtpInternalAsync(email, PurposeEmailVerify, cancellationToken);

        return AuthResult.EmailVerificationRequired(email);
    }

    // ── Login ────────────────────────────────────────────────────────────────

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var email = request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
            return AuthResult.Failure("Email and password are required.");

        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
            return AuthResult.Failure("Invalid email or password.");

        var isPasswordValid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
            return AuthResult.Failure("Invalid email or password.");

        if (!user.EmailConfirmed)
        {
            await TrySendOtpAsync(email, PurposeEmailVerify, cancellationToken);
            return AuthResult.EmailVerificationRequired(email);
        }

        var roles = (await userManager.GetRolesAsync(user)).ToArray();
        return AuthResult.Success(CreateResponse(user, roles));
    }

    // ── Verify Email ─────────────────────────────────────────────────────────

    public async Task<AuthResult> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var email = request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Otp))
            return AuthResult.Failure("Email and verification code are required.");

        var (valid, error) = await VerifyOtpCodeAsync(email, PurposeEmailVerify, request.Otp, cancellationToken);
        if (!valid) return AuthResult.Failure(error);

        var user = await userManager.FindByEmailAsync(email);
        if (user is null) return AuthResult.Failure("User not found.");

        user.EmailConfirmed = true;
        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            return AuthResult.Failure(updateResult.Errors.Select(e => e.Description).ToArray());

        var roles = (await userManager.GetRolesAsync(user)).ToArray();
        return AuthResult.Success(CreateResponse(user, roles));
    }

    // ── Resend OTP ───────────────────────────────────────────────────────────

    public async Task<OtpSendResult> ResendOtpAsync(ResendOtpRequest request, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var email = request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email))   return OtpSendResult.Failure("Email is required.");
        if (string.IsNullOrWhiteSpace(request.Purpose)) return OtpSendResult.Failure("Purpose is required.");

        return await TrySendOtpAsync(email, request.Purpose, cancellationToken);
    }

    // ── Forgot Password ──────────────────────────────────────────────────────

    public async Task<ServiceResult> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
            return ServiceResult.Failure("Email is required.");

        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
            return ServiceResult.Success(); // Don't reveal whether email is registered

        await TrySendOtpAsync(email, PurposePasswordReset, cancellationToken);
        return ServiceResult.Success();
    }

    // ── Verify Reset OTP ─────────────────────────────────────────────────────

    public async Task<ServiceResult> VerifyResetOtpAsync(VerifyResetOtpRequest request, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var email = request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Otp))
            return ServiceResult.Failure("Email and verification code are required.");

        var (valid, error) = await VerifyOtpCodeAsync(email, PurposePasswordReset, request.Otp, cancellationToken);
        if (!valid) return ServiceResult.Failure(error);

        var user = await userManager.FindByEmailAsync(email);
        if (user is null) return ServiceResult.Failure("Invalid request.");

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        return ServiceResult.Success(resetToken);
    }

    // ── Reset Password ───────────────────────────────────────────────────────

    public async Task<ServiceResult> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var email = request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email))        return ServiceResult.Failure("Email is required.");
        if (string.IsNullOrWhiteSpace(request.Token))       return ServiceResult.Failure("Reset token is required.");
        if (string.IsNullOrWhiteSpace(request.NewPassword)) return ServiceResult.Failure("New password is required.");

        var user = await userManager.FindByEmailAsync(email);
        if (user is null) return ServiceResult.Failure("Invalid reset request.");

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
            return ServiceResult.Failure(result.Errors.Select(e => e.Description).ToArray());

        return ServiceResult.Success();
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private async Task<OtpSendResult> TrySendOtpAsync(string email, string purpose, CancellationToken ct)
    {
        var recent = await dbContext.EmailOtps
            .Where(o => o.Email == email && o.Purpose == purpose && !o.IsUsed)
            .OrderByDescending(o => o.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);

        if (recent is not null)
        {
            var elapsed = (int)(DateTime.UtcNow - recent.CreatedAtUtc).TotalSeconds;
            if (elapsed < OtpResendCooldownSecs)
                return OtpSendResult.RateLimited(OtpResendCooldownSecs - elapsed);
        }

        await SendOtpInternalAsync(email, purpose, ct);
        return OtpSendResult.Success();
    }

    private async Task SendOtpInternalAsync(string email, string purpose, CancellationToken ct)
    {
        // Invalidate previous unused OTPs for this email + purpose
        var stale = await dbContext.EmailOtps
            .Where(o => o.Email == email && o.Purpose == purpose && !o.IsUsed)
            .ToListAsync(ct);
        foreach (var s in stale) s.IsUsed = true;

        var code = Random.Shared.Next(100000, 999999).ToString("D6");

        dbContext.EmailOtps.Add(new EmailOtp
        {
            Id           = Guid.NewGuid(),
            Email        = email,
            Code         = code,
            Purpose      = purpose,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes),
            IsUsed       = false
        });

        await dbContext.SaveChangesAsync(ct);

        var (subject, body) = purpose == PurposePasswordReset
            ? ("Reset your Interview Simulator password",
               $"Your password reset code is:\n\n    {code}\n\nThis code expires in {OtpExpiryMinutes} minutes.\n\nIf you did not request this, you can safely ignore this email.")
            : ("Verify your Interview Simulator email",
               $"Your verification code is:\n\n    {code}\n\nThis code expires in {OtpExpiryMinutes} minutes.");

        await emailSender.SendAsync(email, subject, body, ct);
    }

    private async Task<(bool Valid, string Error)> VerifyOtpCodeAsync(string email, string purpose, string code, CancellationToken ct)
    {
        var otp = await dbContext.EmailOtps
            .Where(o => o.Email == email && o.Purpose == purpose && !o.IsUsed)
            .OrderByDescending(o => o.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);

        if (otp is null)
            return (false, "No verification code found. Please request a new one.");

        if (DateTime.UtcNow > otp.ExpiresAtUtc)
            return (false, "This code has expired. Please request a new one.");

        if (otp.Code != code)
            return (false, "Incorrect code. Please try again.");

        otp.IsUsed = true;
        await dbContext.SaveChangesAsync(ct);
        return (true, string.Empty);
    }

    private AuthResponse CreateResponse(AppUser user, IReadOnlyCollection<string> roles)
    {
        var token = jwtTokenGenerator.GenerateToken(user.Id, user.Email!, user.Name, roles);
        return new AuthResponse
        {
            UserId       = user.Id,
            Name         = user.Name,
            Email        = user.Email!,
            Roles        = roles,
            AccessToken  = token.Value,
            ExpiresAtUtc = token.ExpiresAtUtc
        };
    }

    private async Task EnsureRoleExistsAsync(string roleName)
    {
        if (await roleManager.RoleExistsAsync(roleName)) return;
        await roleManager.CreateAsync(new AppRole { Id = Guid.NewGuid(), Name = roleName });
    }
}
