using JavaFloristApi.Models;
using JavaFloristApi.Services;
using JavaFloristApi.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace JavaFloristApi.Controllers
{
    // Controller responsible for Authentication and Account Management
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        readonly UserManager<AppUser> userManager;
        readonly SignInManager<AppUser> signInManager;
        readonly ITokenService tokenService;
        readonly ILogger<AuthController> logger;
        readonly IEmailService emailService;

        // Inject dependencies: User management, Token generation, Logging, and Email service
        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService,
            ILogger<AuthController> logger,
            IEmailService emailService
            )
        {
            this.userManager = userManager;
            this.signInManager = signInManager;
            this.tokenService = tokenService;
            this.logger = logger;
            this.emailService = emailService;
        }

        /// <summary>
        /// Register a new user account
        /// </summary>
        [HttpPost]
        [Route("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 1. Check if the email is already registered to prevent duplicates
            var userExists = await userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
            {
                return BadRequest(new ErrorResponse("User with this email already exists.", "EMAIL_EXISTS", 400));
            }

            // 2. Create a new User object
            var newUser = new AppUser
            {
                FirstName = model.FirstName,
                LastName = model.LastName,
                Email = model.Email,
                UserName = model.Email,
                PhoneNumber = model.PhoneNumber,
                Gender = model.Gender,
                EmailConfirmed = true, // Auto-confirm for this demo
                CreatedDate = DateTime.UtcNow
            };

            // 3. Save user to database with hashed password
            var result = await userManager.CreateAsync(newUser, model.Password);

            if (!result.Succeeded)
            {
                // Return errors if password requirements are not met (e.g., too simple)
                var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
                var errorResponse = new ErrorResponse("User creation failed.", "REGISTER_FAILED", 400)
                {
                    ValidationErrors = errors
                };
                return BadRequest(errorResponse);
            }

            // 4. Assign default role "Customer" (Partners need admin approval)
            await userManager.AddToRoleAsync(newUser, "Customer");

            // 5. Send a welcome email asynchronously
            try
            {
                await emailService.SendCustomerWelcomeEmailAsync(model.Email, $"{model.FirstName} {model.LastName}");
            }
            catch (Exception ex)
            {
                logger.LogError($"Failed to send welcome email: {ex.Message}");
            }

            return Ok(new { message = "User registered successfully. Please log in." });
        }

        /// <summary>
        /// Login with email and password
        /// </summary>
        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors)
                        .ToDictionary(e => "model", e => new[] { e.ErrorMessage });
                    throw new ValidationException("Invalid login data", errors);
                }

                // 1. Find user by email
                var user = await userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    logger.LogWarning($"Login failed: User '{model.Email}' not found");
                    throw new UnauthorizedException("Invalid email or password");
                }

                // 2. Check if the password matches the hash
                var passwordValid = await userManager.CheckPasswordAsync(user, model.Password);
                if (!passwordValid)
                {
                    logger.LogWarning($"Login failed: Invalid password for user '{model.Email}'");
                    throw new UnauthorizedException("Invalid email or password");
                }

                // 3. Generate JWT Access Token and Refresh Token
                var tokenResponse = await tokenService.GenerateTokenAsync(user);

                logger.LogInformation($"User '{user.Email}' logged in successfully");
                return Ok(tokenResponse);
            }
            catch (UnauthorizedException ex) { /*...*/ throw; }
            catch (ValidationException ex) { /*...*/ throw; }
            catch (Exception ex) { /*...*/ throw new InternalServerException("Login failed. Please try again later."); }
        }

        /// <summary>
        /// Refresh access token using refresh token
        /// </summary>
        [HttpPost]
        [Route("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (!ModelState.IsValid) { /*...*/ }
                if (string.IsNullOrWhiteSpace(request.RefreshToken)) { /*...*/ }

                // Validate the old Refresh Token and generate a new pair
                var tokenResponse = await tokenService.RefreshTokenAsync(request.RefreshToken);

                logger.LogInformation("Token refreshed successfully");
                return Ok(tokenResponse);
            }
            catch (UnauthorizedException ex) { /*...*/ throw; }
            catch (ValidationException ex) { /*...*/ throw; }
            catch (Exception ex) { /*...*/ throw new InternalServerException("Token refresh failed. Please login again."); }
        }

        /// <summary>
        /// Logout and revoke refresh token
        /// </summary>
        [HttpPost]
        [Route("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.RefreshToken)) { /*...*/ }

                // Invalidate the Refresh Token in the database so it cannot be used again
                await tokenService.RevokeRefreshTokenAsync(request.RefreshToken);

                logger.LogInformation("User logged out successfully");
                return Ok(new { message = "Logged out successfully" });
            }
            catch (ValidationException ex) { /*...*/ throw; }
            catch (Exception ex) { /*...*/ throw new InternalServerException("Logout failed"); }
        }


        // ================================
        // PASSWORD MANAGEMENT (Forgot / Reset / Change)
        // ================================

        /// <summary>
        /// Send password reset link to user's email
        /// </summary>
        [HttpPost("ForgotPassword")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                // Security: Do not reveal if the email does not exist
                logger.LogWarning($"Forgot Password attempt for non-existent user: {model.Email}");
                return Ok(new { message = "If an account with this email exists, a password reset link has been sent." });
            }

            // 1. Generate a secure reset token
            var token = await userManager.GeneratePasswordResetTokenAsync(user);

            var encodedToken = WebUtility.UrlEncode(token);
            var encodedEmail = WebUtility.UrlEncode(model.Email);

            // 2. Build the link pointing to the Frontend (React) reset page
            var frontendUrl = "http://localhost:5173";
            var resetLink = $"{frontendUrl}/reset-password?token={encodedToken}&email={encodedEmail}";

            // 3. Send the email with the link
            try
            {
                await emailService.SendPasswordResetLinkAsync(model.Email, resetLink);
                logger.LogInformation($"Password reset link sent to {model.Email}");
                return Ok(new { message = "If an account with this email exists, a password reset link has been sent." });
            }
            catch (Exception ex)
            {
                logger.LogError($"Failed to send password reset email to {model.Email}: {ex.Message}");
                throw new InternalServerException("An error occurred while sending the email.");
            }
        }

        /// <summary>
        /// Reset user's password using the token
        /// </summary>
        [HttpPost("ResetPassword")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                logger.LogWarning($"Password reset attempt with invalid email: {model.Email}");
                return BadRequest(new ErrorResponse("Invalid password reset request.", "RESET_FAILED", 400));
            }

            // Note: ASP.NET Identity handles URL decoding of the token automatically

            // 1. Verify the token and update the password
            var result = await userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);

            if (result.Succeeded)
            {
                logger.LogInformation($"Password for user {model.Email} has been reset successfully.");
                return Ok(new { message = "Password has been reset successfully. Please log in." });
            }

            // Handle errors (e.g., Token expired, Password too simple)
            var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
            logger.LogWarning($"Password reset failed for {model.Email}. Errors: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            var errorResponse = new ErrorResponse("Password reset failed.", "RESET_FAILED", 400)
            {
                ValidationErrors = errors
            };
            return BadRequest(errorResponse);
        }

        /// <summary>
        /// Change password for authenticated user (requires knowing old password)
        /// </summary>
        [HttpPost("ChangePassword")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePassword model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 1. Identify the currently logged-in user from the JWT Token claims
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ErrorResponse("User is not authenticated.", "UNAUTHORIZED", 401));
            }

            var user = await userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new ErrorResponse("User not found.", "NOT_FOUND", 404));
            }

            // 2. Change password using Identity (this automatically verifies the 'Old Password')
            var result = await userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);

            if (!result.Succeeded)
            {
                var errors = result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description });
                return BadRequest(new ErrorResponse("Failed to change password.", "CHANGE_PASSWORD_FAILED", 400)
                {
                    ValidationErrors = errors
                });
            }

            logger.LogInformation($"User {user.Email} changed their password successfully.");
            return Ok(new { message = "Password changed successfully." });
        }
    }
}