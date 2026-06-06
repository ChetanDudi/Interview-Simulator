using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using InterviewSimulator.Application.Abstractions.Email;
using Microsoft.Extensions.Options;

namespace InterviewSimulator.Infrastructure.Email;

public sealed class ResendEmailSender(IOptions<EmailOptions> options) : IEmailSender
{
    private static readonly HttpClient Http = new();

    public async Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        var opt = options.Value;

        var payload = new
        {
            from    = $"{opt.FromName} <{opt.From}>",
            to      = new[] { to },
            subject,
            text    = body
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", opt.ResendApiKey);

        var response = await Http.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}
