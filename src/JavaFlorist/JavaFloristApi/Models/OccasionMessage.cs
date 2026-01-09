using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace JavaFloristApi.Models
{
    public class OccasionMessage
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Content { get; set; }

        [ForeignKey("Occasion")]
        public int OccasionId { get; set; }

        [JsonIgnore]
        public Occasion Occasion { get; set; }
    }
}