using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace JavaFloristApi.Models
{
    public class Occasion
    {
        [Key]
        public int Occasion_Id { get; set; }
        [Required]
        public string Name { get; set; }

        public ICollection<Bouquet>? Bouquets { get; set; }
    }
}