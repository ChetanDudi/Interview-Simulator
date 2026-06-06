namespace InterviewSimulator.Application.Abstractions.AI;

public interface ILLMService
{
    Task<string> CompleteAsync(string prompt, CancellationToken cancellationToken = default);
}
