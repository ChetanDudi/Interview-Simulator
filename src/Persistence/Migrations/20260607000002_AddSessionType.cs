using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InterviewSimulator.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SessionType",
                table: "InterviewSessions",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SessionType",
                table: "InterviewSessions");
        }
    }
}
