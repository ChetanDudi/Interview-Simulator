using InterviewSimulator.Application.Abstractions.AI;
using InterviewSimulator.Application.Abstractions.Auth;
using InterviewSimulator.Application.Abstractions.Email;
using InterviewSimulator.Application.Abstractions.Practice;
using InterviewSimulator.Application.Abstractions.Resumes;
using InterviewSimulator.Infrastructure.AI;
using InterviewSimulator.Infrastructure.Email;
using InterviewSimulator.Infrastructure.Pdf;
using InterviewSimulator.Infrastructure.Security;
using InterviewSimulator.Infrastructure.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace InterviewSimulator.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        // ── Auth / JWT ───────────────────────────────────────────────────────
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        // ── File storage ─────────────────────────────────────────────────────
        services.AddScoped<IFileStorage, LocalFileStorage>();

        // ── PDF extraction ───────────────────────────────────────────────────
        services.AddScoped<IPdfExtractor, PdfPigExtractor>();

        // ── LLM provider ─────────────────────────────────────────────────────
        // To swap providers: change GroqService to OpenAIService or GeminiService here only.
        services.AddScoped<ILLMService, GroqService>();

        // ── AI features (use ILLMService — provider-agnostic) ────────────────
        services.AddScoped<IQuestionGenerator, QuestionGenerator>();
        services.AddScoped<IAnswerEvaluator,   AnswerEvaluator>();
        services.AddScoped<IPracticeService,   PracticeService>();

        // ── Email sender ─────────────────────────────────────────────────────
        services.AddScoped<IEmailSender>(sp =>
        {
            var opt = sp.GetRequiredService<IOptions<EmailOptions>>().Value;
            if (opt.Provider.Equals("SendGrid", StringComparison.OrdinalIgnoreCase))
                return sp.GetRequiredService<SendGridEmailSender>();
            if (opt.Provider.Equals("Resend", StringComparison.OrdinalIgnoreCase))
                return sp.GetRequiredService<ResendEmailSender>();
            if (opt.Provider.Equals("Smtp", StringComparison.OrdinalIgnoreCase))
                return sp.GetRequiredService<SmtpEmailSender>();
            return sp.GetRequiredService<ConsoleEmailSender>();
        });
        services.AddTransient<ConsoleEmailSender>();
        services.AddTransient<SmtpEmailSender>();
        services.AddTransient<ResendEmailSender>();
        services.AddTransient<SendGridEmailSender>();

        return services;
    }
}
