using System.ComponentModel.DataAnnotations;

namespace JavaFloristApi.Models
{
    public class RegisterModel
    {
        [Required(ErrorMessage = "First name is required")]
        [StringLength(50)]
        public required string FirstName { get; set; }

        [Required(ErrorMessage = "Last name is required")]
        [StringLength(50)]
        public required string LastName { get; set; }

        [Required(ErrorMessage = "Phone number is required")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        public required string PhoneNumber { get; set; }

        [StringLength(10)]
        public string? Gender { get; set; }

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address format")]
        [MaxLength(255, ErrorMessage = "Email must not exceed 255 characters")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        [MaxLength(255, ErrorMessage = "Password must not exceed 255 characters")]
        [DataType(DataType.Password)]
        public required string Password { get; set; }

        [Required(ErrorMessage = "Password confirmation is required")]
        [Compare("Password", ErrorMessage = "Passwords do not match")]
        [DataType(DataType.Password)]
        public required string ConfirmPassword { get; set; }
    }
}