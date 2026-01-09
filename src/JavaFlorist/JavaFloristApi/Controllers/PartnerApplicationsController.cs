using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using JavaFloristApi.Data;
using JavaFloristApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;
using JavaFloristApi.Services;
using System;

namespace JavaFloristApi.Controllers
{
    // Controller for handling Partner Registrations (Applications)
    [Route("api/[controller]")]
    [ApiController]
    public class PartnerApplicationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IEmailService _emailService;

        // List of valid State Codes (Service Areas)
        private static readonly HashSet<string> ValidStateCodes = new(StringComparer.OrdinalIgnoreCase)
        {
            "DL","HR","PB","HP","JK","CH","LA","UP","UT","MH","GA","DN","DD",
            "GJ","RJ","KA","KL","LD","TN","PY","AN","TG","AP","MP","CT",
            "WB","OR","BR","JH","AS","SK","MN","ML","TR","NL","MZ","AR"
        };

        public PartnerApplicationsController(
            AppDbContext context,
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IEmailService emailService
        )
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _emailService = emailService;
        }

        // ===========================================
        //  PUBLIC API (Submit Application)
        // ===========================================

        [HttpPost("Submit")]
        [AllowAnonymous]
        public async Task<IActionResult> SubmitApplication([FromBody] PartnerApplication application)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // 1. Check if an application is already pending for this email
            var existingApp = await _context.PartnerApplications
                .FirstOrDefaultAsync(a => a.Email == application.Email && a.Status == "Pending");

            if (existingApp != null)
                return BadRequest(new { message = "You already submitted an application with this email." });

            // 2. Check if this email is already a registered user
            var existingUser = await _userManager.FindByEmailAsync(application.Email);
            if (existingUser != null)
                return BadRequest(new { message = "This email is already associated with an existing user." });

            // 3. Validate ServiceArea (State Code)
            if (string.IsNullOrWhiteSpace(application.ServiceArea))
            {
                return BadRequest(new { message = "Service area is required. Please select a state." });
            }

            if (!ValidStateCodes.Contains(application.ServiceArea))
            {
                return BadRequest(new { message = "Invalid service area code. Please select a valid Indian state." });
            }

            // Save the application
            application.Status = "Pending";
            application.SubmittedAt = DateTime.UtcNow;

            _context.PartnerApplications.Add(application);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Your application has been submitted and is pending approval." });
        }

        // ===========================================
        //  ADMIN API (Review Applications)
        // ===========================================

        // Get list of pending applications
        [HttpGet("Pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingApplications()
        {
            var list = await _context.PartnerApplications
                .Where(a => a.Status == "Pending")
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();

            return Ok(list);
        }

        // Get history of all applications
        [HttpGet("All")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllApplications()
        {
            var list = await _context.PartnerApplications
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();

            return Ok(list);
        }

        // APPROVE Application
        // - Creates User Account
        // - Assigns "Partner" Role
        // - Sends Login Credentials
        [HttpPost("Approve/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveApplication(int id)
        {
            var application = await _context.PartnerApplications.FindAsync(id);
            if (application == null || application.Status != "Pending")
                return NotFound(new { message = "Application not found or already processed." });

            // 1. Double-check if email is taken
            var existingUser = await _userManager.FindByEmailAsync(application.Email);
            if (existingUser != null)
            {
                application.Status = "Rejected";
                await _context.SaveChangesAsync();
                return BadRequest(new { message = "Email already used. Application rejected." });
            }

            // 2. Validate Area
            if (string.IsNullOrWhiteSpace(application.ServiceArea) ||
                !ValidStateCodes.Contains(application.ServiceArea))
            {
                return BadRequest(new { message = "Invalid service area. Cannot approve partner." });
            }

            string newLoginEmail = application.Email;
            string tempPassword = "Partner@123";

            // 3. Create the Partner User Account
            var newPartner = new AppUser
            {
                UserName = newLoginEmail,
                Email = newLoginEmail,
                PhoneNumber = application.PhoneNumber,

                CompanyName = application.CompanyName,
                ContactPerson = application.ContactPerson,
                BusinessLicenseId = application.BusinessLicenseId,

                ServiceArea = application.ServiceArea,  // Assign State
                Address = application.Address,          // Store Address

                FirstName = application.ContactPerson,
                LastName = "(Partner)",
                EmailConfirmed = true,
                CreatedDate = DateTime.UtcNow
            };

            var createResult = await _userManager.CreateAsync(newPartner, tempPassword);

            if (!createResult.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Failed to create partner account.",
                    errors = createResult.Errors.Select(e => e.Description)
                });
            }

            // 4. Assign Role
            await _userManager.AddToRoleAsync(newPartner, "Partner");

            // 5. Update Application Status
            application.Status = "Approved";
            _context.PartnerApplications.Update(application);
            await _context.SaveChangesAsync();

            // 6. Send Approval Email with credentials
            try
            {
                await _emailService.SendApprovalEmailAsync(
                    application.Email,
                    newLoginEmail,
                    application.ContactPerson,
                    tempPassword
                );
            }
            catch { /* Log error */ }

            return Ok(new
            {
                message = "Partner approved successfully.",
                loginEmail = newLoginEmail,
                password = tempPassword
            });
        }

        // REJECT Application
        [HttpPost("Reject/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectApplication(int id)
        {
            var application = await _context.PartnerApplications.FindAsync(id);
            if (application == null || application.Status != "Pending")
                return NotFound(new { message = "Application not found or already processed." });

            application.Status = "Rejected";

            _context.PartnerApplications.Update(application);
            await _context.SaveChangesAsync();

            // Send Rejection Email
            try
            {
                await _emailService.SendRejectionEmailAsync(
                    application.Email,
                    application.ContactPerson
                );
            }
            catch { /* Log error */ }

            return Ok(new { message = "Application rejected." });
        }
    }
}