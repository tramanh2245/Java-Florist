using System.Text;
using System.Text.Json.Serialization;
using JavaFloristApi.Data;
using JavaFloristApi.Hubs;
using JavaFloristApi.Middleware;
using JavaFloristApi.Models;
using JavaFloristApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. CONFIGURATION SETUP
// ==========================================

// Load environment variables from a local .env file (if it exists)
var envFile = Path.Combine(AppContext.BaseDirectory, ".env");
if (File.Exists(envFile))
{
    var lines = File.ReadAllLines(envFile);
    foreach (var line in lines)
    {
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
            continue;

        var parts = line.Split('=', 2, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 2)
        {
            Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
        }
    }
}

// Get Connection String from appsettings.json
var connectionString = builder.Configuration.GetConnectionString("AppConnection");

// Configure Entity Framework Core with SQL Server
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(connectionString));

// ==========================================
// 2. IDENTITY & AUTHENTICATION
// ==========================================

// Configure ASP.NET Core Identity (User & Role Management)
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    // For demo purposes, we do not require email confirmation to sign in
    options.SignIn.RequireConfirmedAccount = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Configure Cookies for API usage
// We return 401/403 Status Codes instead of redirecting to a login page
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

// Configure JWT (JSON Web Token) Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(o =>
{
    // Load keys from Environment Variables or Config
    var jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
                        ?? builder.Configuration["Jwt:SecretKey"]!;
    var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
                      ?? builder.Configuration["Jwt:Issuer"]!;
    var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                        ?? builder.Configuration["Jwt:Audience"]!;

    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
    };

    // SignalR Configuration
    // SignalR sends the token via the Query String ("access_token"), not the Header.
    // We must manually extract it here for Real-time Auth to work.
    o.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) &&
                path.StartsWithSegments("/hubs/partnerNotifications"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

// Define Authorization Policies (e.g., Admin Only)
builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// ==========================================
// 3. SERVICE REGISTRATION (DI)
// ==========================================

// Register Token Service
builder.Services.AddTransient<ITokenService, TokenService>();

// Register Email Service
builder.Services.Configure<MailSettings>(builder.Configuration.GetSection("MailSettings"));
builder.Services.AddTransient<IEmailService, EmailService>();

// Register Business Logic Services
builder.Services.AddScoped<IPartnerAssignmentService, PartnerAssignmentService>();
builder.Services.AddScoped<IPartnerOrderService, PartnerOrderService>();
builder.Services.AddScoped<PayPalService>();

// ==========================================
// 4. API & CORS CONFIGURATION
// ==========================================

// Configure CORS to allow connections from the Frontend and SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(_ => true) // Allow any origin
            .AllowCredentials();           // Required for SignalR/JWT
    });
});

// Add Controllers and ignore JSON Reference Cycles (prevents serialization errors)
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

// Add OpenAPI/Swagger
builder.Services.AddOpenApi();

// Add SignalR (Real-time communication)
builder.Services.AddSignalR();

// ==========================================
// 5. APPLICATION PIPELINE
// ==========================================

var app = builder.Build();

// Enable Swagger in Development mode
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Register Global Exception Middleware (handles errors globally)
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();
app.UseStaticFiles();

// Apply CORS Policy
app.UseCors("AllowAll");

// Enable Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map SignalR Hub
app.MapHub<PartnerNotificationHub>("/hubs/partnerNotifications");

// Map API Controllers
app.MapControllers();

// ==========================================
// 6. DATA SEEDING
// ==========================================
// Create default Roles, Admin User, and States on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var userManager = services.GetRequiredService<UserManager<AppUser>>();

    // Create Roles (Admin, Partner, Customer)
    await SeedData.CreateRoles(services, userManager);

    // Seed Indian States for the address dropdowns
    await IndiaStateSeed.SeedStatesAsync(services);
}

app.Run();