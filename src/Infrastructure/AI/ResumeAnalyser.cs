using System.Text.Json;
using InterviewSimulator.Application.Abstractions.AI;
using InterviewSimulator.Application.Resumes.Models;

namespace InterviewSimulator.Infrastructure.AI;

public sealed class ResumeAnalyser(ILLMService llm) : IResumeAnalyser
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    // ── Review ────────────────────────────────────────────────────────────────

    public async Task<ResumeReviewResponse> ReviewAsync(string resumeText, CancellationToken ct = default)
    {
        var prompt = $"""
            You are a professional resume coach and ATS expert. Analyse the following resume thoroughly.

            Return ONLY valid JSON — no markdown, no explanation:
            {{
              "overallScore": <0-100>,
              "summary": "<2-3 sentence executive summary of the resume>",
              "sections": {{
                "summary":    {{ "score": <0-100>, "feedback": "<feedback>", "suggestions": ["<tip1>", "<tip2>"] }},
                "experience": {{ "score": <0-100>, "feedback": "<feedback>", "suggestions": ["<tip1>", "<tip2>"] }},
                "skills":     {{ "score": <0-100>, "feedback": "<feedback>", "suggestions": ["<tip1>", "<tip2>"] }},
                "education":  {{ "score": <0-100>, "feedback": "<feedback>", "suggestions": ["<tip1>", "<tip2>"] }}
              }},
              "topStrengths": ["<strength1>", "<strength2>", "<strength3>"],
              "criticalGaps": ["<gap1>", "<gap2>"],
              "atsScore": <0-100>,
              "atsTips": ["<tip1>", "<tip2>", "<tip3>"]
            }}

            Resume:
            {resumeText}
            """;

        var raw  = await llm.CompleteAsync(prompt, ct);
        var json = JsonSanitizer.ExtractJson(raw, expectArray: false);

        var dto = JsonSerializer.Deserialize<ReviewDto>(json, JsonOpts)
            ?? throw new InvalidOperationException("Failed to parse resume review from AI response.");

        return new ResumeReviewResponse
        {
            OverallScore      = dto.OverallScore,
            Summary           = dto.Summary,
            SummarySection    = MapSection(dto.Sections?.Summary),
            ExperienceSection = MapSection(dto.Sections?.Experience),
            SkillsSection     = MapSection(dto.Sections?.Skills),
            EducationSection  = MapSection(dto.Sections?.Education),
            TopStrengths      = dto.TopStrengths ?? [],
            CriticalGaps      = dto.CriticalGaps ?? [],
            AtsScore          = dto.AtsScore,
            AtsTips           = dto.AtsTips ?? []
        };
    }

    // ── Job Match ─────────────────────────────────────────────────────────────

    public async Task<JobMatchResponse> MatchJobAsync(string resumeText, string jobDescription, CancellationToken ct = default)
    {
        var prompt = $"""
            You are an expert recruiter and ATS specialist. Compare the resume to the job description below.

            Return ONLY valid JSON — no markdown, no explanation:
            {{
              "matchPercentage": <0-100>,
              "summary": "<2-3 sentence summary of the match>",
              "presentKeywords": ["<keyword1>", "<keyword2>"],
              "missingKeywords": ["<keyword1>", "<keyword2>"],
              "highlights": ["<highlight1>", "<highlight2>"],
              "gapAnalysis": ["<gap1>", "<gap2>"],
              "recommendations": ["<recommendation1>", "<recommendation2>"]
            }}

            Resume:
            {resumeText}

            Job Description:
            {jobDescription}
            """;

        var raw  = await llm.CompleteAsync(prompt, ct);
        var json = JsonSanitizer.ExtractJson(raw, expectArray: false);

        var dto = JsonSerializer.Deserialize<JobMatchDto>(json, JsonOpts)
            ?? throw new InvalidOperationException("Failed to parse job match response from AI.");

        return new JobMatchResponse
        {
            MatchPercentage = dto.MatchPercentage,
            Summary         = dto.Summary,
            PresentKeywords = dto.PresentKeywords ?? [],
            MissingKeywords = dto.MissingKeywords ?? [],
            Highlights      = dto.Highlights ?? [],
            GapAnalysis     = dto.GapAnalysis ?? [],
            Recommendations = dto.Recommendations ?? []
        };
    }

    // ── Cover Letter ──────────────────────────────────────────────────────────

    public async Task<string> GenerateCoverLetterAsync(string resumeText, string jobDescription, CancellationToken ct = default)
    {
        var prompt = $"""
            You are a professional career writer. Write a compelling, personalised cover letter based on the resume and job description provided.
            Return ONLY the cover letter text — no JSON, no markdown, no explanation. Start directly with the letter.

            Resume:
            {resumeText}

            Job Description:
            {jobDescription}
            """;

        var raw = await llm.CompleteAsync(prompt, ct);
        return raw.Trim();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static ReviewSection MapSection(SectionDto? dto) => new()
    {
        Score       = dto?.Score ?? 0,
        Feedback    = dto?.Feedback ?? string.Empty,
        Suggestions = dto?.Suggestions ?? []
    };

    // ── Private DTOs ──────────────────────────────────────────────────────────

    private sealed class ReviewDto
    {
        public int           OverallScore  { get; init; }
        public string        Summary       { get; init; } = string.Empty;
        public SectionsDto?  Sections      { get; init; }
        public string[]?     TopStrengths  { get; init; }
        public string[]?     CriticalGaps  { get; init; }
        public int           AtsScore      { get; init; }
        public string[]?     AtsTips       { get; init; }
    }

    private sealed class SectionsDto
    {
        public SectionDto? Summary    { get; init; }
        public SectionDto? Experience { get; init; }
        public SectionDto? Skills     { get; init; }
        public SectionDto? Education  { get; init; }
    }

    private sealed class SectionDto
    {
        public int      Score       { get; init; }
        public string   Feedback    { get; init; } = string.Empty;
        public string[] Suggestions { get; init; } = [];
    }

    private sealed class JobMatchDto
    {
        public int      MatchPercentage { get; init; }
        public string   Summary         { get; init; } = string.Empty;
        public string[]? PresentKeywords { get; init; }
        public string[]? MissingKeywords { get; init; }
        public string[]? Highlights      { get; init; }
        public string[]? GapAnalysis     { get; init; }
        public string[]? Recommendations { get; init; }
    }
}
