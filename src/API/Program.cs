using System.Text;
using InterviewSimulator.Infrastructure;
using InterviewSimulator.Infrastructure.Security;
using InterviewSimulator.Infrastructure.AI;
using InterviewSimulator.Infrastructure.Email;
using InterviewSimulator.Infrastructure.Storage;
using InterviewSimulator.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebUiDevelopment", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddAuthorization();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<FileStorageOptions>(builder.Configuration.GetSection(FileStorageOptions.SectionName));
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));
builder.Services.Configure<OpenAiOptions>(builder.Configuration.GetSection(OpenAiOptions.SectionName));

builder.Services.AddInfrastructure();
builder.Services.AddPersistence(GetRequiredConnectionString(builder.Configuration));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("Jwt configuration is missing.");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime         = true,
            ValidIssuer              = jwtOptions.Issuer,
            ValidAudience            = jwtOptions.Audience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew                = TimeSpan.FromMinutes(1)
        };
    });

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("WebUiDevelopment");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static string GetRequiredConnectionString(IConfiguration configuration)
{
    var active = configuration["ActiveDatabase"] ?? "Local";

    var key = active.Equals("Neon", StringComparison.OrdinalIgnoreCase)
        ? "NeonConnection"
        : "DefaultConnection";

    var connectionString = configuration.GetConnectionString(key);

    if (string.IsNullOrWhiteSpace(connectionString) || connectionString.Contains("__SET_IN"))
        throw new InvalidOperationException(
            $"Connection string '{key}' is not configured. " +
            $"Run: dotnet user-secrets set \"ConnectionStrings:{key}\" \"<your-connection-string>\"");

    return connectionString;
}
