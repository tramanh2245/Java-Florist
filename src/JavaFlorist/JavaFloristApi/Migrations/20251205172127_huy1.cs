using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace JavaFloristApi.Migrations
{
    /// <inheritdoc />
    public partial class huy1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Occasions",
                keyColumn: "Occasion_Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Occasions",
                keyColumn: "Occasion_Id",
                keyValue: 10);

            migrationBuilder.UpdateData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 7,
                column: "Content",
                value: "With deepest sympathy. Our thoughts are with you.");

            migrationBuilder.UpdateData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Content", "OccasionId" },
                values: new object[] { "You did it! So proud of you. Congratulations!", 6 });

            migrationBuilder.UpdateData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Content", "OccasionId" },
                values: new object[] { "Welcome to the world, little one!", 7 });

            migrationBuilder.UpdateData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Content", "OccasionId" },
                values: new object[] { "Best wishes on this wonderful journey, as you build your new lives together.", 8 });

            migrationBuilder.UpdateData(
                table: "Occasions",
                keyColumn: "Occasion_Id",
                keyValue: 5,
                column: "Name",
                value: "Sympathy");

            migrationBuilder.UpdateData(
                table: "Occasions",
                keyColumn: "Occasion_Id",
                keyValue: 6,
                column: "Name",
                value: "Congratulations");

            migrationBuilder.UpdateData(
                table: "Occasions",
                keyColumn: "Occasion_Id",
                keyValue: 7,
                column: "Name",
                value: "New Baby");

            migrationBuilder.UpdateData(
                table: "Occasions",
                keyColumn: "Occasion_Id",
                keyValue: 8,
                column: "Name",
                value: "Wedding");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 7,
                column: "Content",
                value: "Sending you sunshine to brighten your day. Get well soon!");

            migrationBuilder.UpdateData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Content", "OccasionId" },
                values: new object[] { "Wishing you a speedy recovery.", 5 });

            migrationBuilder.UpdateData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Content", "OccasionId" },
                values: new object[] { "With deepest sympathy. Our thoughts are with you.", 6 });

            migrationBuilder.UpdateData(
                table: "OccasionMessages",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Content", "OccasionId" },
                values: new object[] { "You did it! So proud of you. Congratulations!", 7 });

            migrationBuilder.InsertData(
                table: "OccasionMessages",
                columns: new[] { "Id", "Content", "OccasionId" },
                values: new object[] { 11, "Thank you for everything you do.", 8 });

            migrationBuilder.UpdateData(
                table: "Occasions",
                keyColumn: "Occasion_Id",
                keyValue: 5,
                column: "Name",
                value: "Get Well Soon");

            migrationBuilder.UpdateData(
                table: "Occasions",
                keyColumn: "Occasion_Id",
                keyValue: 6,
                column: "Name",
                value: "Sympathy");

            migrationBuilder.UpdateData(
                table: "Occasions",
                keyColumn: "Occasion_Id",
                keyValue: 7,
                column: "Name",
                value: "Congratulations");

            migrationBuilder.UpdateData(
                table: "Occasions",
                keyColumn: "Occasion_Id",
                keyValue: 8,
                column: "Name",
                value: "Thank You");

            migrationBuilder.InsertData(
                table: "Occasions",
                columns: new[] { "Occasion_Id", "Name" },
                values: new object[,]
                {
                    { 9, "New Baby" },
                    { 10, "Wedding" }
                });

            migrationBuilder.InsertData(
                table: "OccasionMessages",
                columns: new[] { "Id", "Content", "OccasionId" },
                values: new object[,]
                {
                    { 12, "Welcome to the world, little one!", 9 },
                    { 13, "Best wishes on this wonderful journey, as you build your new lives together.", 10 }
                });
        }
    }
}
