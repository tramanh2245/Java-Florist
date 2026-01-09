using System.ComponentModel.DataAnnotations;

namespace JavaFloristApi.Models
{
    public class ChangePassword
    {
        [Required(ErrorMessage = "Current password is required")]
        [DataType(DataType.Password)]
        public required string CurrentPassword { get; set; }

        [Required(ErrorMessage = "New password is required")]
        [MinLength(6, ErrorMessage = "New password must be at least 6 characters")]
        [DataType(DataType.Password)]
        public required string NewPassword { get; set; }

        [Required(ErrorMessage = "Confirm new password is required")]
        [Compare("NewPassword", ErrorMessage = "Passwords do not match")]
        [DataType(DataType.Password)]
        public required string ConfirmNewPassword { get; set; }
    }
}