using System.Text;
using InterviewSimulator.Application.Abstractions.AI;
using UglyToad.PdfPig;

namespace InterviewSimulator.Infrastructure.Pdf;

public sealed class PdfPigExtractor : IPdfExtractor
{
    public string ExtractText(Stream pdfStream)
    {
        using var document = PdfDocument.Open(pdfStream);
        var sb = new StringBuilder();
        foreach (var page in document.GetPages())
            sb.AppendLine(page.Text);

        return sb.ToString().Trim();
    }
}
