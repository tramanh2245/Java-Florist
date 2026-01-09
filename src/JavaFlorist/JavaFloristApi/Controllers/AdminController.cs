using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JavaFloristApi.Data;
using JavaFloristApi.Models;
using JavaFloristApi.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace JavaFloristApi.Controllers
{
    // API Controller for Admin-specific operations
    [Route("api/[controller]")]
    [ApiController]
    // Only users with 'Admin' role can access this controller
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPartnerOrderService _partnerOrderService;

        public AdminController(AppDbContext context, IPartnerOrderService partnerOrderService)
        {
            _context = context;
            _partnerOrderService = partnerOrderService;
        }

        // ================================
        // 1. Get ALL orders for Admin
        //    + Includes current Partner info
        //    + Includes a list of EligiblePartners (can deliver within 5 hours)
        // ================================
        [HttpGet("orders")]
        public async Task<IActionResult> GetAllOrders()
        {
            // Fetch all Partners (Users with a CompanyName)
            var allPartners = await _context.Users
                .Where(u => !string.IsNullOrEmpty(u.CompanyName))
                .Select(u => new
                {
                    u.Id,
                    u.CompanyName,
                    u.ServiceArea
                })
                .ToListAsync();

            // Fetch all Orders, including the assigned Partner
            var ordersRaw = await _context.Orders
                .Include(o => o.Partner)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            // Build the final response DTO
            var orders = ordersRaw
                .Select(o =>
                {
                    // Select Partners in the same ServiceZone as the Order
                    var eligiblePartners = allPartners
                        .Where(p => !string.IsNullOrEmpty(o.ServiceZone) &&
                                    p.ServiceArea == o.ServiceZone)
                        .Select((p, index) => new
                        {
                            id = p.Id,
                            companyName = p.CompanyName,
                            serviceArea = p.ServiceArea,

                            // Demo: assume all partners in the zone can deliver within 5h
                            canDeliverIn5Hours = true
                        })
                        .ToList();

                    return new
                    {
                        o.OrderId,
                        o.CustomerName,
                        o.TotalAmount,
                        o.Status,
                        o.CreatedAt,
                        o.ServiceZone,
                        PartnerName = o.Partner != null ? o.Partner.CompanyName : "Unassigned",
                        PartnerId = o.PartnerId,

                        // ⭐ List of partners eligible for assignment
                        EligiblePartners = eligiblePartners
                    };
                })
                .ToList();

            return Ok(orders);
        }

        //
        // ================================
        // 6. Get DETAIL of one Order by ID
        // ================================
        [HttpGet("orders/{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            // Fetch all partners for the EligiblePartners list
            var allPartners = await _context.Users
                .Where(u => !string.IsNullOrEmpty(u.CompanyName))
                .Select(u => new
                {
                    u.Id,
                    u.CompanyName,
                    u.ServiceArea
                })
                .ToListAsync();

            // Fetch Order with Partner, OrderDetails, Bouquet, and Images (deeply nested includes)
            var order = await _context.Orders
                .Include(o => o.Partner)
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.Bouquet)
                .Include(o => o.OrderDetails)
                    .ThenInclude(d => d.Bouquet.Images)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
                return NotFound($"Order {id} not found");

            // Build the list of Partners matching the Order's ServiceZone
            var eligiblePartners = allPartners
                .Where(p => !string.IsNullOrEmpty(order.ServiceZone) &&
                            p.ServiceArea == order.ServiceZone)
                .Select((p, index) => new
                {
                    id = p.Id,
                    companyName = p.CompanyName,
                    serviceArea = p.ServiceArea,
                    canDeliverIn5Hours = true          // demo: can deliver in 5h
                })
                .ToList();

            // Build the list of products/items in the order
            var items = order.OrderDetails.Select(d => new
            {
                detailId = d.Id,              // original detail Id
                d.BouquetId,
                bouquetName = d.Bouquet.Name,
                quantity = d.Quantity,
                unitPrice = d.UnitPrice,
                lineTotal = d.UnitPrice * d.Quantity,

                // Select images for the bouquet, main image first
                images = d.Bouquet.Images
                    .OrderByDescending(img => img.Is_Main_Image)
                    .Select(img => new
                    {
                        img.Image_Id,
                        img.Url,
                        img.Is_Main_Image
                    })
                    .ToList()
            });

            // Final result DTO for the frontend
            var result = new
            {
                order.OrderId,
                order.CustomerName,
                order.Phone,
                order.ShippingAddress,
                order.Message,
                order.Status,
                order.TotalAmount,
                order.ServiceZone,
                order.CreatedAt,
                order.EstimatedDeliveryTime,

                partnerId = order.PartnerId,
                partnerName = order.Partner?.CompanyName ?? "Unassigned",

                eligiblePartners,

                items
            };

            return Ok(result);
        }

        // ================================
        // 2. Manual Partner Assignment (Re-assign)
        //    + Recalculates EstimatedDeliveryTime (ETA rule: 9am–9pm store hours, 5h ship time)
        // ================================
        [HttpPost("assign-order")]
        public async Task<IActionResult> ManualAssignOrder([FromBody] AssignRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var order = await _context.Orders.FindAsync(request.OrderId);
            if (order == null)
                return NotFound("Order not found");

            var partner = await _context.Users.FindAsync(request.PartnerId);
            if (partner == null)
                return NotFound("Partner not found");

            // Use common service logic to assign Partner, handle notifications (SignalR/email)
            await _partnerOrderService.AssignToSpecificPartnerAsync(order, partner);

            // --- RECALCULATE ETA BASED ON 9AM–9PM RULE, 5 HOURS DELIVERY ---

            // Use India time zone for the delivery logic
            var indiaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, indiaTimeZone);

            order.EstimatedDeliveryTime = CalculateEstimatedDeliveryTime(nowLocal);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Order #{order.OrderId} assigned to {partner.CompanyName}",
                orderId = order.OrderId,
                partnerId = partner.Id,
                estimatedDeliveryTime = order.EstimatedDeliveryTime
            });
        }

        // Helper to calculate ETA based on 9am–9pm store hours + 5 hours delivery time
        private static DateTime CalculateEstimatedDeliveryTime(DateTime nowLocal)
        {
            var storeOpen = new TimeSpan(9, 0, 0);   // 9:00 AM
            var storeClose = new TimeSpan(21, 0, 0); // 9:00 PM
            var deliveryDuration = TimeSpan.FromHours(5);

            var today = nowLocal.Date;
            var openToday = today + storeOpen;
            var closeToday = today + storeClose;

            DateTime start;

            // Determine the order processing start time
            if (nowLocal < openToday)
            {
                // Before 9am → start at 9am today
                start = openToday;
            }
            else if (nowLocal > closeToday)
            {
                // After 9pm → start at 9am tomorrow
                start = openToday.AddDays(1);
            }
            else
            {
                // Within 9am–9pm → start from current time
                start = nowLocal;
            }

            var eta = start + deliveryDuration;

            // If ETA is after 9pm today, move the delivery to tomorrow's hours (9am + 5h = 2pm)
            if (eta > closeToday)
            {
                var nextOpen = openToday.AddDays(1);
                eta = nextOpen + deliveryDuration;
            }

            return eta;
        }

        // ================================
        // 3. Revenue Statistics by Partner
        // ================================
        [HttpGet("revenue-stats")]
        public async Task<IActionResult> GetRevenueStats()
        {
            // Get all Partners
            var partners = await _context.Users
                .Where(u => !string.IsNullOrEmpty(u.CompanyName))
                .ToListAsync();

            var stats = new List<object>();

            foreach (var p in partners)
            {
                // Get all 'Completed' or 'Delivered' orders for this Partner
                var completedOrders = await _context.Orders
                    .Where(o => o.PartnerId == p.Id &&
                                (o.Status == "Completed" || o.Status == "Delivered"))
                    .ToListAsync();

                var totalRevenue = completedOrders.Sum(o => o.TotalAmount);
                var orderCount = completedOrders.Count;

                // Build stats object for each partner
                stats.Add(new
                {
                    PartnerId = p.Id,
                    PartnerName = p.CompanyName,
                    ContactPerson = p.ContactPerson,
                    ServiceArea = p.ServiceArea,
                    TotalOrders = orderCount,
                    TotalRevenue = totalRevenue,
                    // Calculate 10% platform commission
                    PlatformCommission = totalRevenue * 0.1m
                });
            }

            return Ok(stats);
        }

        // ================================
        // 4. Auxiliary API: List of all Partners (for general dropdown)
        // ================================
        [HttpGet("partners-list")]
        public async Task<IActionResult> GetPartnersList()
        {
            // Get basic info for all Partners
            var partners = await _context.Users
                .Where(u => !string.IsNullOrEmpty(u.CompanyName))
                .Select(u => new { u.Id, u.CompanyName, u.ServiceArea })
                .ToListAsync();

            return Ok(partners);
        }

        // ================================
        // 5. DTO for the manual assignment request
        // ================================
        public class AssignRequest
        {
            public int OrderId { get; set; }
            public string PartnerId { get; set; } = default!;
        }
    }
}