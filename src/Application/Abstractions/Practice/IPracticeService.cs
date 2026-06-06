using InterviewSimulator.Application.Practice.Models;

namespace InterviewSimulator.Application.Abstractions.Practice;

public interface IPracticeService
{
    Task<IReadOnlyList<PracticeQuestion>> GenerateAsync(string topic, int count, CancellationToken cancellationToken = default);
}
