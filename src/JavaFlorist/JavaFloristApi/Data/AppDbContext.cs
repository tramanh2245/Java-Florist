using JavaFloristApi.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace JavaFloristApi.Data
{
    public class AppDbContext : IdentityDbContext<AppUser>
    {
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        public DbSet<Occasion> Occasions { get; set; }
        public DbSet<Bouquet> Bouquets { get; set; }
        public DbSet<Image> Images { get; set; }
        public DbSet<PartnerApplication> PartnerApplications { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<PayPalTransaction> PayPalTransactions { get; set; }
        public DbSet<OccasionMessage> OccasionMessages { get; set; }
        public DbSet<IndiaState> IndiaStates { get; set; } = default!;



        public AppDbContext(DbContextOptions options) : base(options)
        {
        }

        protected AppDbContext()
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Seed data for Occasions
            builder.Entity<Occasion>().HasData(
                 new Occasion { Occasion_Id = 1, Name = "Birthday" },
                 new Occasion { Occasion_Id = 2, Name = "Anniversary" },
                 new Occasion { Occasion_Id = 3, Name = "Valentine's Day" },
                 new Occasion { Occasion_Id = 4, Name = "Mother's Day" },
                 new Occasion { Occasion_Id = 5, Name = "Sympathy" },
                 new Occasion { Occasion_Id = 6, Name = "Congratulations" },
                 new Occasion { Occasion_Id = 7, Name = "New Baby" },
                 new Occasion { Occasion_Id = 8, Name = "Wedding" }
             );

            builder.Entity<OccasionMessage>().HasData(
                // Birthday (Id=1)
                new OccasionMessage { Id = 1, OccasionId = 1, Content = "Wishing you a day filled with happiness and a year filled with joy." },
                new OccasionMessage { Id = 2, OccasionId = 1, Content = "Happy Birthday! May your day be as beautiful as these flowers." },

                // Anniversary (Id=2)
                new OccasionMessage { Id = 3, OccasionId = 2, Content = "Happy Anniversary! To many more years of happiness." },
                new OccasionMessage { Id = 4, OccasionId = 2, Content = "Wishing you a lifetime of love and happiness." },

                // Valentine (Id=3)
                new OccasionMessage { Id = 5, OccasionId = 3, Content = "Happy Valentine's Day! You mean the world to me." },

                // Mother's Day (Id=4)
                new OccasionMessage { Id = 6, OccasionId = 4, Content = "To the best Mom in the world. I love you!" },

                // Sympathy (Id=5)
                new OccasionMessage { Id = 7, OccasionId = 5, Content = "With deepest sympathy. Our thoughts are with you." },

                // Congratulations (Id=6)
                new OccasionMessage { Id = 8, OccasionId = 6, Content = "You did it! So proud of you. Congratulations!" },

                // New Baby (Id=7)
                new OccasionMessage { Id = 9, OccasionId = 7, Content = "Welcome to the world, little one!" },

                // Wedding (Id=8)
                new OccasionMessage { Id = 10, OccasionId = 8, Content = "Best wishes on this wonderful journey, as you build your new lives together." }
    );

            // Configure Bouquet-Image relationship
            builder.Entity<Bouquet>()
                .HasMany(b => b.Images)
                .WithOne(i => i.Bouquet)
                .HasForeignKey(i => i.Bouquet_Id)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure RefreshToken relationships
            builder.Entity<RefreshToken>()
                .HasOne(rt => rt.AppUser)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            foreach (var et in builder.Model.GetEntityTypes())
            {
                var tblName = et.GetTableName();
                if (tblName!.StartsWith("AspNet"))
                {
                    et.SetTableName(tblName.Substring(6));
                }
            }
        }
    }
}
