using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InterviewSimulator.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CascadeDeleteResumeToSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InterviewSessions_Resumes_ResumeId",
                table: "InterviewSessions");

            migrationBuilder.AddForeignKey(
                name: "FK_InterviewSessions_Resumes_ResumeId",
                table: "InterviewSessions",
                column: "ResumeId",
                principalTable: "Resumes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InterviewSessions_Resumes_ResumeId",
                table: "InterviewSessions");

            migrationBuilder.AddForeignKey(
                name: "FK_InterviewSessions_Resumes_ResumeId",
                table: "InterviewSessions",
                column: "ResumeId",
                principalTable: "Resumes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
