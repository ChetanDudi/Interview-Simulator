namespace InterviewSimulator.Application.Abstractions.AI;

public interface IPdfExtractor
{
    string ExtractText(Stream pdfStream);
}
