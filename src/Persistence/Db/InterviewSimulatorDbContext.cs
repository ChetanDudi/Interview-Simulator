using InterviewSimulator.Persistence.Identity;
using InterviewSimulator.Persistence.OtpVerification;
using InterviewSimulator.Persistence.Practice;
using InterviewSimulator.Persistence.Resumes;
using InterviewSimulator.Persistence.Sessions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace InterviewSimulator.Persistence.Db;

public sealed class InterviewSimulatorDbContext
    : IdentityDbContext<
        AppUser,
        AppRole,
        Guid,
        IdentityUserClaim<Guid>,
        AppUserRole,
        IdentityUserLogin<Guid>,
        IdentityRoleClaim<Guid>,
        IdentityUserToken<Guid>>
{
    public InterviewSimulatorDbContext(DbContextOptions<InterviewSimulatorDbContext> options)
        : base(options) { }

    public DbSet<AppResume>            Resumes           { get; set; }
    public DbSet<EmailOtp>             EmailOtps         { get; set; }
    public DbSet<AppInterviewSession>  Sessions          { get; set; }
    public DbSet<AppInterviewQuestion> Questions         { get; set; }
    public DbSet<AppInterviewAnswer>   Answers           { get; set; }
    public DbSet<AppFeedbackReport>    FeedbackReports   { get; set; }
    public DbSet<AppQuestionFeedback>  QuestionFeedbacks { get; set; }
    public DbSet<AppPracticeSession>   PracticeSessions  { get; set; }
    public DbSet<AppPracticeQuestion>  PracticeQuestions { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<AppUser>(e =>
        {
            e.ToTable("Users");
            e.Property(u => u.Name).HasMaxLength(200).IsRequired();
            e.Property(u => u.CreatedAtUtc).IsRequired();
        });
        builder.Entity<AppRole>(e =>
        {
            e.ToTable("Roles");
            e.Property(r => r.Description).HasMaxLength(200);
        });
        builder.Entity<AppUserRole>(e => e.ToTable("UserRoles"));
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");

        builder.Entity<AppResume>(e =>
        {
            e.ToTable("Resumes");
            e.HasKey(r => r.Id);
            e.Property(r => r.OriginalFileName).HasMaxLength(500).IsRequired();
            e.Property(r => r.StoredPath).HasMaxLength(1000).IsRequired();
            e.Property(r => r.Status).HasMaxLength(50).IsRequired();
            e.Property(r => r.ExtractedText).HasColumnType("text");
            e.HasOne<AppUser>().WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<EmailOtp>(e =>
        {
            e.ToTable("EmailOtps");
            e.HasKey(o => o.Id);
            e.Property(o => o.Email).HasMaxLength(256).IsRequired();
            e.Property(o => o.Code).HasMaxLength(6).IsRequired();
            e.Property(o => o.Purpose).HasMaxLength(50).IsRequired();
            e.HasIndex(o => new { o.Email, o.Purpose, o.IsUsed });
        });

        builder.Entity<AppInterviewSession>(e =>
        {
            e.ToTable("InterviewSessions");
            e.HasKey(s => s.Id);
            e.Property(s => s.Status).HasMaxLength(50).IsRequired();
            e.Property(s => s.TargetRole).HasMaxLength(200);
            e.HasOne<AppUser>().WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<AppResume>().WithMany().HasForeignKey(s => s.ResumeId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(s => s.Questions).WithOne().HasForeignKey(q => q.SessionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(s => s.FeedbackReport).WithOne().HasForeignKey<AppFeedbackReport>(r => r.SessionId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AppInterviewQuestion>(e =>
        {
            e.ToTable("InterviewQuestions");
            e.HasKey(q => q.Id);
            e.Property(q => q.QuestionText).HasColumnType("text").IsRequired();
            e.Property(q => q.Category).HasMaxLength(100).IsRequired();
            e.Property(q => q.Difficulty).HasMaxLength(50).IsRequired();
            e.Property(q => q.QuestionType).HasMaxLength(50).IsRequired();
            e.Property(q => q.OptionsJson).HasColumnType("text");
            e.Property(q => q.CorrectOptionIndex);
            e.HasOne(q => q.Answer).WithOne().HasForeignKey<AppInterviewAnswer>(a => a.QuestionId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AppInterviewAnswer>(e =>
        {
            e.ToTable("InterviewAnswers");
            e.HasKey(a => a.Id);
            e.Property(a => a.AnswerText).HasColumnType("text").IsRequired();
        });

        builder.Entity<AppFeedbackReport>(e =>
        {
            e.ToTable("FeedbackReports");
            e.HasKey(r => r.Id);
            e.Property(r => r.Summary).HasColumnType("text").IsRequired();
            e.HasMany(r => r.QuestionFeedbacks).WithOne().HasForeignKey(f => f.ReportId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AppQuestionFeedback>(e =>
        {
            e.ToTable("QuestionFeedbacks");
            e.HasKey(f => f.Id);
            e.Property(f => f.Feedback).HasColumnType("text").IsRequired();
            e.Property(f => f.Suggestion).HasColumnType("text").IsRequired();
            e.Property(f => f.IdealAnswer).HasColumnType("text").IsRequired();
        });

        builder.Entity<AppPracticeSession>(e =>
        {
            e.ToTable("PracticeSessions");
            e.HasKey(s => s.Id);
            e.Property(s => s.Topic).HasMaxLength(500).IsRequired();
            e.Property(s => s.ShareToken).HasMaxLength(64);
            e.HasIndex(s => s.ShareToken).IsUnique();
            e.HasOne<AppUser>().WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(s => s.Questions).WithOne(q => q.Session).HasForeignKey(q => q.SessionId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AppPracticeQuestion>(e =>
        {
            e.ToTable("PracticeQuestions");
            e.HasKey(q => q.Id);
            e.Property(q => q.QuestionText).HasColumnType("text").IsRequired();
            e.Property(q => q.QuestionType).HasMaxLength(50).IsRequired();
            e.Property(q => q.OptionsJson).HasColumnType("text");
            e.Property(q => q.Answer).HasColumnType("text").IsRequired();
        });
    }
}
