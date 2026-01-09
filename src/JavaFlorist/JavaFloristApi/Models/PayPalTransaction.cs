using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JavaFloristApi.Models
{
    public class PayPalTransaction
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string PayPalOrderId { get; set; }
        public int? LocalOrderId { get; set; }
        [ForeignKey("LocalOrderId")]
        public Order Order { get; set; }

        public string Status { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public string Currency { get; set; } = "USD";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}