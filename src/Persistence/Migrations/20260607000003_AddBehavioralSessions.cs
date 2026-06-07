using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InterviewSimulator.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBehavioralSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BehavioralSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Topic = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TimeTakenSeconds = table.Column<int>(type: "integer", nullable: true),
                    QuestionsJson = table.Column<string>(type: "text", nullable: false),
                    FeedbackJson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BehavioralSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BehavioralSessions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BehavioralSessions_UserId",
                table: "BehavioralSessions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "BehavioralSessions");
        }
    }
}
