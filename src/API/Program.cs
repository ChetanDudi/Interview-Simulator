using System.Text;
using InterviewSimulator.Infrastructure;
using InterviewSimulator.Infrastructure.Security;
using InterviewSimulator.Infrastructure.AI;
using InterviewSimulator.Infrastructure.Email;
using InterviewSimulator.Infrastructure.Storage;
using InterviewSimulator.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

// Load .env file for local development (safe to call even in production — won't override real env vars)
if (File.Exists(".env"))
    DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebUiPolicy", policy =>
    {
        var origins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? ["http://localhost:5173"];

        policy
            .WithOrigins(origins)
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

if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseExceptionHandler(exApp =>
{
    exApp.Run(async context =>
    {
        context.Response.StatusCode  = 500;
        context.Response.ContentType = "application/json";

        // Preserve CORS headers so the browser doesn't show a misleading CORS error
        var origin = context.Request.Headers.Origin.FirstOrDefault();
        if (origin is not null)
            context.Response.Headers.Append("Access-Control-Allow-Origin", origin);

        await context.Response.WriteAsync("{\"errors\":[\"An unexpected server error occurred.\"]}");
    });
});

app.UseCors("WebUiPolicy");
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
