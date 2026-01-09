using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace JavaFloristApi.Models
{
    public class OrderDetail
    {
        [Key]
        public int Id { get; set; }

        public int OrderId { get; set; }
        [JsonIgnore]
        [ForeignKey("OrderId")]
        public Order Order { get; set; }

        public int BouquetId { get; set; }
        [ForeignKey("BouquetId")]
        public Bouquet Bouquet { get; set; }

        public int Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }
    }
}