using InterviewSimulator.Application.Auth.Models;
using InterviewSimulator.Application.Common;

namespace InterviewSimulator.Application.Abstractions.Auth;

public interface IAuthService
{
    Task<AuthResult>    RegisterAsync(RegisterRequest request,               CancellationToken cancellationToken = default);
    Task<AuthResult>    LoginAsync(LoginRequest request,                     CancellationToken cancellationToken = default);
    Task<AuthResult>    VerifyEmailAsync(VerifyEmailRequest request,         CancellationToken cancellationToken = default);
    Task<OtpSendResult> ResendOtpAsync(ResendOtpRequest request,             CancellationToken cancellationToken = default);
    Task<ServiceResult> ForgotPasswordAsync(ForgotPasswordRequest request,   CancellationToken cancellationToken = default);
    Task<ServiceResult> VerifyResetOtpAsync(VerifyResetOtpRequest request,   CancellationToken cancellationToken = default);
    Task<ServiceResult> ResetPasswordAsync(ResetPasswordRequest request,     CancellationToken cancellationToken = default);
}
