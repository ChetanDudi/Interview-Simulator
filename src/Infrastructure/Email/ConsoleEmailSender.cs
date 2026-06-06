using InterviewSimulator.Application.Abstractions.Email;

namespace InterviewSimulator.Infrastructure.Email;

/// <summary>
/// Development email sender — prints the email to the console instead of sending it.
/// Switch to SmtpEmailSender in production by setting Email:Provider = "Smtp".
/// </summary>
public sealed class ConsoleEmailSender : IEmailSender
{
    public Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        var separator = new string('═', 60);
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine();
        Console.WriteLine(separator);
        Console.WriteLine("  📧  EMAIL (dev — not actually sent)");
        Console.WriteLine(separator);
        Console.ResetColor();
        Console.WriteLine($"  To      : {to}");
        Console.WriteLine($"  Subject : {subject}");
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine(body);
        Console.ResetColor();
        Console.WriteLine(separator);
        Console.WriteLine();
        return Task.CompletedTask;
    }
}
