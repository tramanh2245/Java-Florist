using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JavaFloristApi.Models
{
    public class Order
    {
        [Key]
        public int OrderId { get; set; }
        [Required]
        public string UserId { get; set; }
        [ForeignKey("UserId")]
        public AppUser User { get; set; }
        public string? PartnerId { get; set; }
        [ForeignKey("PartnerId")]
        public AppUser? Partner { get; set; }

        [Required]
        public string CustomerName { get; set; }
        [Required]
        public string ShippingAddress { get; set; }
        [Required]
        public string Phone { get; set; }

        public string? Message { get; set; }
        public DateTime EstimatedDeliveryTime { get; set; }
        public string? ServiceZone { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public string Status { get; set; } = "Pending Payment";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<OrderDetail> OrderDetails { get; set; }
    }
}