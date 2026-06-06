using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using InterviewSimulator.Application.Abstractions.Email;
using Microsoft.Extensions.Options;

namespace InterviewSimulator.Infrastructure.Email;

public sealed class SendGridEmailSender(IOptions<EmailOptions> options) : IEmailSender
{
    private static readonly HttpClient Http = new();

    public async Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        var opt = options.Value;

        var payload = new
        {
            personalizations = new[]
            {
                new { to = new[] { new { email = to } } }
            },
            from = new { email = opt.From, name = opt.FromName },
            subject,
            content = new[]
            {
                new { type = "text/plain", value = body }
            }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.sendgrid.com/v3/mail/send")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", opt.SendGridApiKey);

        var response = await Http.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}
