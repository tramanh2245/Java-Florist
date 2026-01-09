using JavaFloristApi.Models;
using Microsoft.AspNetCore.Identity;

namespace JavaFloristApi.Data
{
    public class SeedData
    {
        public static async Task CreateRoles(IServiceProvider serviceProvider, UserManager<AppUser> userManager) 
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            string[] roleNames = { "Admin", "Customer", "Partner" };

            IdentityResult roleResult;

            foreach (var roleName in roleNames)
            {
                var roleExist = await roleManager.RoleExistsAsync(roleName);
                if (!roleExist)
                {
                    var role = new IdentityRole(roleName);
                    roleResult = await roleManager.CreateAsync(role);
                }
            }

            // create user admin
            var adminUser = await userManager.FindByEmailAsync("admin@java-florist.com");
            if (adminUser == null)
            {
                var user = new AppUser
                {
                    UserName = "admin@java-florist.com",
                    Email = "admin@java-florist.com"
                };
                var createdUser = await userManager.CreateAsync(user, "Admin@123!#");

                if (createdUser.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Admin");
                }
            }
        }
    }
}
