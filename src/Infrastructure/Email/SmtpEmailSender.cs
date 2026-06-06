using System.Net;
using System.Net.Mail;
using InterviewSimulator.Application.Abstractions.Email;
using Microsoft.Extensions.Options;

namespace InterviewSimulator.Infrastructure.Email;

/// <summary>
/// Production SMTP email sender. Configure via Email:Smtp in appsettings or user-secrets.
/// </summary>
public sealed class SmtpEmailSender(IOptions<EmailOptions> options) : IEmailSender
{
    public async Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        var opt = options.Value;

#pragma warning disable SYSLIB0006 // SmtpClient is functional but marked obsolete; replace with MailKit when added
        using var client = new SmtpClient(opt.Smtp.Host, opt.Smtp.Port)
        {
            EnableSsl   = opt.Smtp.EnableSsl,
            Credentials = new NetworkCredential(opt.Smtp.Username, opt.Smtp.Password)
        };

        var message = new MailMessage(
            new MailAddress(opt.From, opt.FromName),
            new MailAddress(to))
        {
            Subject    = subject,
            Body       = body,
            IsBodyHtml = false
        };

        await client.SendMailAsync(message, cancellationToken);
#pragma warning restore SYSLIB0006
    }
}
