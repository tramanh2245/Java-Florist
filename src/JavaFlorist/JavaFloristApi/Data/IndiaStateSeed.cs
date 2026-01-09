using JavaFloristApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace JavaFloristApi.Data
    {
        public static class IndiaStateSeed
        {
            public static async Task SeedStatesAsync(IServiceProvider services)
            {
                using var scope = services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();


            // Check if states are already seeded

            var indiaStates = new List<IndiaState>
            {
                new IndiaState { Code = "AP", Name = "Andhra Pradesh" },
                new IndiaState { Code = "AR", Name = "Arunachal Pradesh" },
                new IndiaState { Code = "AS", Name = "Assam" },
                new IndiaState { Code = "BR", Name = "Bihar" },
                new IndiaState { Code = "CT", Name = "Chhattisgarh" },
                new IndiaState { Code = "GA", Name = "Goa" },
                new IndiaState { Code = "GJ", Name = "Gujarat" },
                new IndiaState { Code = "HR", Name = "Haryana" },
                new IndiaState { Code = "HP", Name = "Himachal Pradesh" },
                new IndiaState { Code = "JH", Name = "Jharkhand" },
                new IndiaState { Code = "KA", Name = "Karnataka" },
                new IndiaState { Code = "KL", Name = "Kerala" },
                new IndiaState { Code = "MP", Name = "Madhya Pradesh" },
                new IndiaState { Code = "MH", Name = "Maharashtra" },
                new IndiaState { Code = "MN", Name = "Manipur" },
                new IndiaState { Code = "ML", Name = "Meghalaya" },
                new IndiaState { Code = "MZ", Name = "Mizoram" },
                new IndiaState { Code = "NL", Name = "Nagaland" },
                new IndiaState { Code = "OR", Name = "Odisha" },
                new IndiaState { Code = "PB", Name = "Punjab" },
                new IndiaState { Code = "RJ", Name = "Rajasthan" },
                new IndiaState { Code = "SK", Name = "Sikkim" },
                new IndiaState { Code = "TN", Name = "Tamil Nadu" },
                new IndiaState { Code = "TG", Name = "Telangana" },
                new IndiaState { Code = "TR", Name = "Tripura" },
                new IndiaState { Code = "UP", Name = "Uttar Pradesh" },
                new IndiaState { Code = "UT", Name = "Uttarakhand" },
                new IndiaState { Code = "WB", Name = "West Bengal" },
                new IndiaState { Code = "AN", Name = "Andaman and Nicobar Islands" },
                new IndiaState { Code = "CH", Name = "Chandigarh" },
                new IndiaState { Code = "DN", Name = "Dadra and Nagar Haveli and Daman and Diu" },
                new IndiaState { Code = "DL", Name = "Delhi" },
                new IndiaState { Code = "JK", Name = "Jammu and Kashmir" },
                new IndiaState { Code = "LA", Name = "Ladakh" },
                new IndiaState { Code = "LD", Name = "Lakshadweep" },
                new IndiaState { Code = "PY", Name = "Puducherry" }
            };

            }
        }
    }



