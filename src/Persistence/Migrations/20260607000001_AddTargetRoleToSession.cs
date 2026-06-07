using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InterviewSimulator.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTargetRoleToSession : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TargetRole",
                table: "InterviewSessions",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetRole",
                table: "InterviewSessions");
        }
    }
}
