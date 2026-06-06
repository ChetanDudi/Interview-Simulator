using Microsoft.AspNetCore.Identity;

namespace InterviewSimulator.Persistence.Identity;

public sealed class AppRole : IdentityRole<Guid>
{
    public string? Description { get; set; }
}
