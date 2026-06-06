using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InterviewSimulator.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdealAnswer",
                table: "QuestionFeedbacks",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CorrectOptionIndex",
                table: "InterviewQuestions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionsJson",
                table: "InterviewQuestions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QuestionType",
                table: "InterviewQuestions",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IdealAnswer",
                table: "QuestionFeedbacks");

            migrationBuilder.DropColumn(
                name: "CorrectOptionIndex",
                table: "InterviewQuestions");

            migrationBuilder.DropColumn(
                name: "OptionsJson",
                table: "InterviewQuestions");

            migrationBuilder.DropColumn(
                name: "QuestionType",
                table: "InterviewQuestions");
        }
    }
}
