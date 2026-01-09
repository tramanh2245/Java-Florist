using JavaFloristApi.Models;
using JavaFloristApi.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace JavaFloristApi.Controllers
{
    // Controller for Admin to manage User Accounts (CRUD, Roles, Locking)
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        readonly UserManager<AppUser> _userManager;
        readonly RoleManager<IdentityRole> _roleManager;
        readonly ILogger<UsersController> _logger;

        public UsersController(
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<UsersController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        /// <summary>
        /// Get all users - Admin only
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<UserDTO>>> GetAllUsers()
        {
            try
            {
                // Fetch all users except the main Admin
                var users = await _userManager.Users
                    .Where(u => u.Email != "admin@java-florist.com")
                    .ToListAsync();

                var userDTOs = new List<UserDTO>();

                // Convert User entities to DTOs (Data Transfer Objects) to hide sensitive data
                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    userDTOs.Add(new UserDTO
                    {
                        Id = user.Id,
                        UserName = user.UserName,
                        Email = user.Email,
                        PhoneNumber = user.PhoneNumber,
                        EmailConfirmed = user.EmailConfirmed,
                        LockoutEnabled = user.LockoutEnabled,
                        LockoutEnd = user.LockoutEnd,
                        CreatedDate = user.CreatedDate ?? DateTime.MinValue,
                        Roles = roles.ToList(),

                        // Map specific fields
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Gender = user.Gender,
                        CompanyName = user.CompanyName,
                        ContactPerson = user.ContactPerson,
                        BusinessLicenseId = user.BusinessLicenseId
                    });
                }

                _logger.LogInformation($"Retrieved {userDTOs.Count} users");
                return Ok(userDTOs);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving users: {ex.Message}");
                throw new InternalServerException("Failed to retrieve users");
            }
        }

        // <summary>
        // Get details of a specific user by ID
        // </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                    throw new ValidationException("User ID cannot be empty");

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                    throw new NotFoundException($"User with ID '{id}' not found");

                var roles = await _userManager.GetRolesAsync(user);

                // Map to DTO
                var userDTO = new UserDTO
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    EmailConfirmed = user.EmailConfirmed,
                    LockoutEnabled = user.LockoutEnabled,
                    LockoutEnd = user.LockoutEnd,
                    CreatedDate = user.CreatedDate ?? DateTime.MinValue,
                    Roles = roles.ToList(),
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Gender = user.Gender,
                    CompanyName = user.CompanyName,
                    ContactPerson = user.ContactPerson,
                    BusinessLicenseId = user.BusinessLicenseId
                };

                return Ok(userDTO);
            }
            catch (NotFoundException) { throw; }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving user {id}: {ex.Message}");
                throw new InternalServerException("Failed to retrieve user");
            }
        }

        /// <summary>
        /// Get current user profile (alternative to ProfileController)
        /// </summary>
        [HttpGet("profile/me")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCurrentProfile()
        {
            try
            {
                // Identify user from the JWT Token
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrWhiteSpace(userId))
                    throw new UnauthorizedException("User not authenticated");

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                    throw new NotFoundException("User not found");

                var roles = await _userManager.GetRolesAsync(user);
                var userDTO = new UserDTO
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    EmailConfirmed = user.EmailConfirmed,
                    CreatedDate = user.CreatedDate ?? DateTime.MinValue,
                    Roles = roles.ToList()
                };

                return Ok(userDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving current profile: {ex.Message}");
                throw new InternalServerException("Failed to retrieve profile");
            }
        }

        /// <summary>
        /// Create new user - Admin only
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    // Extract validation errors
                    var errors = ModelState.Values.SelectMany(v => v.Errors)
                        .ToDictionary(e => "model", e => new[] { e.ErrorMessage });
                    throw new ValidationException("Invalid user data", errors);
                }

                // Check for duplicate email
                var existingUser = await _userManager.FindByEmailAsync(model.Email);
                if (existingUser != null)
                    throw new ConflictException($"Email '{model.Email}' is already registered");

                var user = new AppUser
                {
                    UserName = model.Email,
                    Email = model.Email,
                    PhoneNumber = model.PhoneNumber,
                    CreatedDate = DateTime.UtcNow
                };

                // Create user with password
                var result = await _userManager.CreateAsync(user, model.Password);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
                    throw new ValidationException("Failed to create user", errors);
                }

                // Default Role is "User"
                await _userManager.AddToRoleAsync(user, "User");

                _logger.LogInformation($"User '{user.Email}' created successfully");
                return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, user);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating user: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Update user - Admin only
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserRequest model)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                    throw new ValidationException("User ID cannot be empty");

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                    throw new NotFoundException($"User with ID '{id}' not found");

                // Check if the new email is taken by another user
                if (!string.IsNullOrWhiteSpace(model.Email) && model.Email != user.Email)
                {
                    var existingUser = await _userManager.FindByEmailAsync(model.Email);
                    if (existingUser != null)
                        throw new ConflictException($"Email '{model.Email}' is already in use");
                }

                // Update fields if provided
                user.Email = model.Email ?? user.Email;
                user.PhoneNumber = model.PhoneNumber ?? user.PhoneNumber;
                user.UserName = model.Email ?? user.UserName;

                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
                    throw new ValidationException("Failed to update user", errors);
                }

                _logger.LogInformation($"User '{user.Email}' updated successfully");
                return Ok(new { message = "User updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating user {id}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Delete user - Admin only
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                    throw new ValidationException("User ID cannot be empty");

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                    throw new NotFoundException($"User with ID '{id}' not found");

                // Security: Prevent Admin from deleting themselves
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (user.Id == currentUserId)
                    throw new ConflictException("Cannot delete your own account");

                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
                    throw new ValidationException("Failed to delete user", errors);
                }

                _logger.LogInformation($"User '{user.Email}' deleted successfully");
                return Ok(new { message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting user {id}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Assign role to user - Admin only
        /// </summary>
        [HttpPost("{id}/roles/{role}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignRole(string id, string role)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(role))
                    throw new ValidationException("User ID and Role are required");

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                    throw new NotFoundException($"User with ID '{id}' not found");

                // Ensure the Role exists in the system
                if (!await _roleManager.RoleExistsAsync(role))
                    throw new NotFoundException($"Role '{role}' does not exist");

                // Check if user already has it
                if (await _userManager.IsInRoleAsync(user, role))
                    throw new ConflictException($"User already has role '{role}'");

                var result = await _userManager.AddToRoleAsync(user, role);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
                    throw new ValidationException("Failed to assign role", errors);
                }

                _logger.LogInformation($"Role '{role}' assigned to user '{user.Email}'");
                return Ok(new { message = $"Role '{role}' assigned successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error assigning role to user {id}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Remove role from user - Admin only
        /// </summary>
        [HttpDelete("{id}/roles/{role}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveRole(string id, string role)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(role))
                    throw new ValidationException("User ID and Role are required");

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                    throw new NotFoundException($"User with ID '{id}' not found");

                if (!await _userManager.IsInRoleAsync(user, role))
                    throw new ConflictException($"User does not have role '{role}'");

                var result = await _userManager.RemoveFromRoleAsync(user, role);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
                    throw new ValidationException("Failed to remove role", errors);
                }

                _logger.LogInformation($"Role '{role}' removed from user '{user.Email}'");
                return Ok(new { message = $"Role '{role}' removed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error removing role from user {id}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Lock user account - Admin only
        /// </summary>
        [HttpPost("{id}/lock")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> LockUser(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                    throw new ValidationException("User ID cannot be empty");

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                    throw new NotFoundException($"User with ID '{id}' not found");

                // Set lockout end date to 1 year from now
                var result = await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(1));
                if (!result.Succeeded)
                {
                    var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
                    throw new ValidationException("Failed to lock user", errors);
                }

                _logger.LogWarning($"User '{user.Email}' locked by admin");
                return Ok(new { message = "User locked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error locking user {id}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Unlock user account - Admin only
        /// </summary>
        [HttpPost("{id}/unlock")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UnlockUser(string id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(id))
                    throw new ValidationException("User ID cannot be empty");

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                    throw new NotFoundException($"User with ID '{id}' not found");

                // Remove lockout by setting end date to null
                var result = await _userManager.SetLockoutEndDateAsync(user, null);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
                    throw new ValidationException("Failed to unlock user", errors);
                }

                _logger.LogWarning($"User '{user.Email}' unlocked by admin");
                return Ok(new { message = "User unlocked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error unlocking user {id}: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Get dashboard statistics - Admin only
        /// </summary>
        [HttpGet("admin/stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalUsers = await _userManager.Users.CountAsync();
                var totalRoles = await _roleManager.Roles.CountAsync();

                // Count users currently locked out
                var lockedUsers = await _userManager.Users
                    .Where(u => u.LockoutEnd != null && u.LockoutEnd > DateTimeOffset.UtcNow)
                    .CountAsync();

                var stats = new
                {
                    totalUsers,
                    totalRoles,
                    lockedUsers,
                    activeUsers = totalUsers - lockedUsers
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving stats: {ex.Message}");
                throw new InternalServerException("Failed to retrieve statistics");
            }
        }
    }
}