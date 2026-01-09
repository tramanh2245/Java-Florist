using System.ComponentModel.DataAnnotations;

namespace JavaFloristApi.Models
{
    public class ForgotPasswordModel
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public required string Email { get; set; }
    }
}