using Microsoft.AspNetCore.Identity;

namespace InterviewSimulator.Persistence.Identity;

public sealed class AppUser : IdentityUser<Guid>
{
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
