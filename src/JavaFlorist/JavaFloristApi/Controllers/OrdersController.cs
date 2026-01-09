using JavaFloristApi.Data;
using JavaFloristApi.Hubs;
using JavaFloristApi.Models;
using JavaFloristApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace JavaFloristApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // Require login for all actions in this controller
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly IPartnerAssignmentService _partnerAssignmentService;
        private readonly IHubContext<PartnerNotificationHub> _hubContext;
        private readonly IEmailService _emailService;

        // Inject services for Database, User, Assignment logic, Real-time SignalR, and Email
        public OrdersController(
            AppDbContext context,
            UserManager<AppUser> userManager,
            IPartnerAssignmentService partnerAssignmentService,
            IHubContext<PartnerNotificationHub> hubContext,
            IEmailService emailService)
        {
            _context = context;
            _userManager = userManager;
            _partnerAssignmentService = partnerAssignmentService;
            _hubContext = hubContext;
            _emailService = emailService;
        }

        // =========================
        // DTOs
        // =========================
        public class CreateOrderDto
        {
            public string CustomerName { get; set; }
            public string ShippingAddress { get; set; }
            public string Phone { get; set; }
            public List<CartItemDto> Items { get; set; }
        }

        public class CartItemDto
        {
            public int BouquetId { get; set; }
            public int Quantity { get; set; }
        }

        public class UpdateStatusRequest
        {
            // Statuses: "Assigned", "Delivering", "Completed", "Delivered", "Cancelled", "Declined"
            public string Status { get; set; }
        }

        public class UpdateOrderInfoRequest
        {
            public string CustomerName { get; set; }
            public string Phone { get; set; }
            public string ShippingAddress { get; set; }
        }

        // =========================
        // 1. Create Order (Basic version without PayPal)
        // =========================
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto orderDto)
        {
            // Get ID of the logged-in user
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // Initialize new Order object
            var order = new Order
            {
                UserId = userId,
                CustomerName = orderDto.CustomerName,
                ShippingAddress = orderDto.ShippingAddress,
                Phone = orderDto.Phone,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                OrderDetails = new List<OrderDetail>()
            };

            decimal totalAmount = 0;

            // Iterate through cart items and calculate total price from DB
            foreach (var item in orderDto.Items)
            {
                var bouquet = await _context.Bouquets.FindAsync(item.BouquetId);
                if (bouquet != null)
                {
                    totalAmount += (decimal)bouquet.Price * item.Quantity;

                    // Add details
                    order.OrderDetails.Add(new OrderDetail
                    {
                        BouquetId = item.BouquetId,
                        Quantity = item.Quantity,
                        UnitPrice = (decimal)bouquet.Price
                    });
                }
            }

            order.TotalAmount = totalAmount;

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order created successfully", orderId = order.OrderId });
        }

        // =========================
        // 2. Customer: Get My Orders
        // =========================
        [HttpGet("MyOrders")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // Fetch orders for the current user, including images
            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Bouquet)
                        .ThenInclude(b => b.Images)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(orders);
        }

        // =========================
        // 3. Partner: Get Assigned Orders
        // =========================
        [HttpGet("PartnerOrders")]
        [HttpGet("partner")]
        [Authorize(Roles = "Partner")]
        public async Task<IActionResult> GetPartnerOrders()
        {
            var partnerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(partnerId)) return Unauthorized();

            // Fetch orders assigned specifically to this partner
            var orders = await _context.Orders
                .Where(o => o.PartnerId == partnerId)
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Bouquet)
                    .ThenInclude(b => b.Images)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(orders);
        }

        // =========================
        // 3.1. Partner: Dashboard Summary Stats
        // =========================
        [HttpGet("partner/summary")]
        [Authorize(Roles = "Partner")]
        public async Task<IActionResult> GetPartnerOrdersSummary()
        {
            var partnerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(partnerId)) return Unauthorized();

            var query = _context.Orders.Where(o => o.PartnerId == partnerId);

            // Count orders by status category
            var newOrders = await query.CountAsync(o => o.Status == "Pending" || o.Status == "Assigned");
            var processingOrders = await query.CountAsync(o => o.Status == "Delivering" || o.Status == "Paid");
            var completedOrders = await query.CountAsync(o => o.Status == "Completed" || o.Status == "Delivered");
            var cancelledOrders = 0;

            return Ok(new
            {
                newOrders,
                processingOrders,
                completedOrders,
                cancelledOrders
            });
        }

        // =========================
        // 4. Partner: Update Order Status
        // =========================
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Partner")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var partnerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            // Security: Ensure the partner owns this order
            if (order.PartnerId != partnerId)
            {
                return Forbid();
            }

            // Validate status
            var allowedStatuses = new[] { "Assigned", "Delivering", "Completed" };
            if (!allowedStatuses.Contains(request.Status))
            {
                return BadRequest(new { message = "Invalid status" });
            }


            // Save new status
            order.Status = request.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Order status updated successfully", status = order.Status });
        }

        // =========================
        // 5. Partner: Update Delivery Info
        // =========================
        [HttpPut("{id}/info")]
        [Authorize(Roles = "Partner")]
        public async Task<IActionResult> UpdateOrderInfo(int id, [FromBody] UpdateOrderInfoRequest request)
        {
            var partnerId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var order = await _context.Orders.FindAsync(id);

            if (order == null) return NotFound(new { message = "Order not found" });

            if (order.PartnerId != partnerId) return Forbid();

            order.CustomerName = request.CustomerName;
            order.Phone = request.Phone;
            order.ShippingAddress = request.ShippingAddress;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Order information updated successfully" });
        }

        // =========================
        // 6. Helper: Send Notifications (SignalR + Email)
        // =========================
        private async Task NotifyPartnerNewOrderAsync(AppUser partner, Order order)
        {
            var payload = new
            {
                orderId = order.OrderId,
                customerName = order.CustomerName,
                shippingAddress = order.ShippingAddress,
                totalAmount = order.TotalAmount,
                status = order.Status,
                createdAt = order.CreatedAt
            };

            // Send Real-time alert via SignalR
            await _hubContext.Clients
                .Group($"partner-{partner.Id}")
                .SendAsync("NewOrderAssigned", payload);      
        }
    }
}