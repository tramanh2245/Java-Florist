using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using JavaFloristApi.Models;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;

namespace JavaFloristApi.Controllers
{
    // Controller for Users to manage their own profile
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;

        public ProfileController(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        // GET: api/Profile/Me
        // Retrieve profile details for the currently logged-in user
        [HttpGet("Me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound(new ErrorResponse("User not found.", "NOT_FOUND", 404));
            }

            // Return a combined object containing both Customer and Partner fields
            return Ok(new
            {
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                gender = user.Gender,

                companyName = user.CompanyName,
                contactPerson = user.ContactPerson,
                businessLicenseId = user.BusinessLicenseId,
                address = user.Address,
                serviceArea = user.ServiceArea
            });
        }

        // PUT: api/Profile/Me
        // Allow the user to update their own profile information
        [HttpPut("Me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfile model)
        {
            // Get current user ID from token
            var userId = _userManager.GetUserId(User);
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            // Only update fields if they are provided in the request
            if (model.PhoneNumber != null) user.PhoneNumber = model.PhoneNumber;

            // Update Customer-specific Fields
            if (model.FirstName != null) user.FirstName = model.FirstName;
            if (model.LastName != null) user.LastName = model.LastName;
            if (model.Gender != null) user.Gender = model.Gender;

            // Update Partner-specific Fields
            if (model.ContactPerson != null) user.ContactPerson = model.ContactPerson;

            // Save changes to database
            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                return Ok(new { message = "Profile updated successfully" });
            }

            return BadRequest(new { message = "Failed to update profile", errors = result.Errors });
        }
    }
}