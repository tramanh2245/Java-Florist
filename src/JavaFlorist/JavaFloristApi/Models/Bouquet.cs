using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace JavaFloristApi.Models
{
    public class Bouquet
    {
        [Key]
        public int Bouquet_Id { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public int Price { get; set; }

        [ForeignKey("Occasion")]
        [Required]
        public int Occasion_Id { get; set; }

        public Occasion? Occasion { get; set; }

        public string? Description { get; set; }
        public ICollection<Image>? Images { get; set; }
    }
}