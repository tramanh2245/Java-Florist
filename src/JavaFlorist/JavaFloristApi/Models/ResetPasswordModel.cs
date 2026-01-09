using System.ComponentModel.DataAnnotations;

namespace JavaFloristApi.Models
{
    public class ResetPasswordModel
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        public required string Token { get; set; }

        [Required(ErrorMessage = "New password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        [DataType(DataType.Password)]
        public required string NewPassword { get; set; }

        [Required(ErrorMessage = "Password confirmation is required")]
        [Compare("NewPassword", ErrorMessage = "Passwords do not match")]
        [DataType(DataType.Password)]
        public required string ConfirmPassword { get; set; }
    }
}