using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using InterviewSimulator.Application.Abstractions.Email;
using Microsoft.Extensions.Options;

namespace InterviewSimulator.Infrastructure.Email;

public sealed class ResendEmailSender(IOptions<EmailOptions> options, IHttpClientFactory httpClientFactory) : IEmailSender
{
    public async Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        var opt    = options.Value;
        var client = httpClientFactory.CreateClient("Resend");

        var payload = new
        {
            from    = $"{opt.FromName} <{opt.From}>",
            to      = new[] { to },
            subject,
            text    = body
        };

        var json    = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync("https://api.resend.com/emails", content, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}
