using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InterviewSimulator.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTimeTakenToSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TimeTakenSeconds",
                table: "InterviewSessions",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TimeTakenSeconds",
                table: "InterviewSessions");
        }
    }
}
