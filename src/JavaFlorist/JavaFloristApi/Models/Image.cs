using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JavaFloristApi.Models
{
    public class Image
    {
        [Key]
        public int Image_Id { get; set; }

        [Required]
        public string Url { get; set; }

        public bool Is_Main_Image { get; set; }

        [ForeignKey("Bouquet")]
        public int Bouquet_Id { get; set; }

        public Bouquet Bouquet { get; set; }
    }
}