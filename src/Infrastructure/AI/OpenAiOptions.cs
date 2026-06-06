namespace InterviewSimulator.Infrastructure.AI;

public sealed class OpenAiOptions
{
    public const string SectionName = "OpenAi";

    public string ApiKey  { get; init; } = string.Empty;
    public string Model   { get; init; } = "gpt-4o-mini";
    /// <summary>
    /// Override to use a different provider.
    /// Groq:   https://api.groq.com/openai/v1
    /// Ollama: http://localhost:11434/v1
    /// Leave empty to use OpenAI.
    /// </summary>
    public string BaseUrl { get; init; } = string.Empty;
}
