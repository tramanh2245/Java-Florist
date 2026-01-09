using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace JavaFloristApi.Models
{
    public class AppUser : IdentityUser
    {
        //Customer
        [StringLength(50)]
        public string? FirstName { get; set; }

        [StringLength(50)]
        public string? LastName { get; set; }

        [StringLength(10)]
        public string? Gender { get; set; }

        //Partner
        [StringLength(100)]
        public string? CompanyName { get; set; }

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        public DateTime? CreatedDate { get; set; } = DateTime.UtcNow;

        [StringLength(50)]
        public string? BusinessLicenseId { get; set; }

        [StringLength(100)]
        public string? ServiceArea { get; set; }
        public string? Address{ get; set; }
        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}