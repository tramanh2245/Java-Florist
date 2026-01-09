using System.ComponentModel.DataAnnotations;

namespace JavaFloristApi.Models
{
    public class PartnerApplication
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string CompanyName { get; set; }

        [Required]
        [StringLength(100)]
        public string ContactPerson { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string PhoneNumber { get; set; }

        [Required]
        public string Address { get; set; }

        [StringLength(100)]
        public string? ServiceArea { get; set; }

        public string? BusinessLicenseId { get; set; }

        [Required]
        public string Status { get; set; } = "Pending";

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}