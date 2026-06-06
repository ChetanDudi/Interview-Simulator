using System.ClientModel;
using InterviewSimulator.Application.Abstractions.AI;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;

namespace InterviewSimulator.Infrastructure.AI;

/// <summary>
/// ILLMService implementation using the OpenAI-compatible API.
/// Works with Groq, OpenAI, Ollama — controlled entirely by OpenAiOptions config.
/// To swap provider: register a different ILLMService in DI (e.g. GeminiService).
/// </summary>
public sealed class GroqService(IOptions<OpenAiOptions> options) : ILLMService
{
    public async Task<string> CompleteAsync(string prompt, CancellationToken cancellationToken = default)
    {
        var opt = options.Value;
        if (string.IsNullOrWhiteSpace(opt.ApiKey))
            throw new InvalidOperationException("AI API key is not configured. Set OpenAi:ApiKey in user-secrets.");

        var client = string.IsNullOrWhiteSpace(opt.BaseUrl)
            ? new OpenAIClient(opt.ApiKey)
            : new OpenAIClient(
                new ApiKeyCredential(opt.ApiKey),
                new OpenAIClientOptions { Endpoint = new Uri(opt.BaseUrl) });

        var chat     = client.GetChatClient(opt.Model);
        var response = await chat.CompleteChatAsync(
            [new UserChatMessage(prompt)],
            cancellationToken: cancellationToken);

        return response.Value.Content[0].Text;
    }
}
