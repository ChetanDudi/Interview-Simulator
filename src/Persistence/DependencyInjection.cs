using InterviewSimulator.Application.Abstractions.Analytics;
using InterviewSimulator.Application.Abstractions.Auth;
using InterviewSimulator.Application.Abstractions.Behavioral;
using InterviewSimulator.Application.Abstractions.Practice;
using InterviewSimulator.Application.Abstractions.Resumes;
using InterviewSimulator.Application.Abstractions.Sessions;
using InterviewSimulator.Persistence.Db;
using InterviewSimulator.Persistence.Identity;
using InterviewSimulator.Persistence.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace InterviewSimulator.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<InterviewSimulatorDbContext>(options => options.UseNpgsql(connectionString));

        services
            .AddIdentityCore<AppUser>(options =>
            {
                options.Password.RequiredLength         = 8;
                options.Password.RequireDigit           = true;
                options.Password.RequireUppercase       = true;
                options.Password.RequireLowercase       = true;
                options.Password.RequireNonAlphanumeric = true;
                options.User.RequireUniqueEmail         = true;
            })
            .AddRoles<AppRole>()
            .AddEntityFrameworkStores<InterviewSimulatorDbContext>();

        services.AddScoped<IAuthService,            AuthService>();
        services.AddScoped<IResumeService,          ResumeService>();
        services.AddScoped<ISessionService,         SessionService>();
        services.AddScoped<IPracticeSessionService, PracticeSessionService>();
        services.AddScoped<IAnalyticsService,       AnalyticsService>();
        services.AddScoped<IBehavioralService,      BehavioralService>();

        return services;
    }
}
