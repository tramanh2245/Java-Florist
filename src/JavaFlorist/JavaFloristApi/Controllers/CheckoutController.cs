using JavaFloristApi.Data;
using JavaFloristApi.Models;
using JavaFloristApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace JavaFloristApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CheckoutController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PayPalService _payPalService;
        private readonly UserManager<AppUser> _userManager;
        private readonly IPartnerOrderService _partnerOrderService;
        private readonly IEmailService _emailService;

        public CheckoutController(
            AppDbContext context,
            PayPalService payPalService,
            UserManager<AppUser> userManager,
            IPartnerOrderService partnerOrderService,
            IEmailService emailService)
        {
            _context = context;
            _payPalService = payPalService;
            _userManager = userManager;
            _partnerOrderService = partnerOrderService;
            _emailService = emailService;
        }

        // ============================
        // 1. INITIATE CHECKOUT
        //    - Calculates total price from Database (security)
        //    - Creates a PayPal Order
        //    - Creates a Local Order with status "Pending Payment"
        // ============================
        [HttpPost("initiate")]
        [Authorize]
        public async Task<IActionResult> InitiateCheckout([FromBody] CheckoutRequest request)
        {
            // Get the current logged-in user ID
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            if (request.Items == null || request.Items.Count == 0)
                return BadRequest("No items provided.");

            decimal totalAmount = 0;

            // Calculate total amount based on real database prices (not frontend data)
            foreach (var item in request.Items)
            {
                var bouquet = await _context.Bouquets.FindAsync(item.BouquetId);
                if (bouquet == null) continue;

                totalAmount += (decimal)bouquet.Price * item.Quantity;
            }

            // Call PayPal Service to get an approval URL
            var approvalUrl = await _payPalService.CreateOrder(
                totalAmount,
                request.ReturnUrl,
                request.CancelUrl
            );

            // Create the local Order record in our database
            var order = new Order
            {
                UserId = userId,
                CustomerName = request.CustomerName,
                ShippingAddress = request.ShippingAddress,
                Phone = request.Phone,
                Message = request.Message,
                EstimatedDeliveryTime = request.EstimatedDeliveryTime,
                CreatedAt = DateTime.UtcNow,
                Status = "Pending Payment", // Initial status
                TotalAmount = totalAmount,

                // The StateCode acts as the ServiceZone for assigning partners
                ServiceZone = request.StateCode,

                OrderDetails = new List<OrderDetail>()
            };

            // Add items to the order
            foreach (var item in request.Items)
            {
                var bouquet = await _context.Bouquets.FindAsync(item.BouquetId);
                if (bouquet != null)
                {
                    order.OrderDetails.Add(new OrderDetail
                    {
                        BouquetId = item.BouquetId,
                        Quantity = item.Quantity,
                        UnitPrice = (decimal)bouquet.Price
                    });
                }
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Return the PayPal URL so the frontend can redirect the user
            return Ok(new { approvalUrl, localOrderId = order.OrderId });
        }

        // ============================
        // 2. COMPLETE CHECKOUT
        //    - Called after successful PayPal payment
        //    - Captures the payment
        //    - Updates Order status to "Paid"
        //    - Attempts to auto-assign a Partner
        // ============================
        [HttpPost("complete")]
        public async Task<IActionResult> CompleteCheckout([FromBody] CompleteCheckoutRequest request)
        {
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .FirstOrDefaultAsync(o => o.OrderId == request.LocalOrderId);

            if (order == null) return NotFound("Order not found.");

            // Prevent double processing (Idempotency check)
            if (order.Status == "Paid" || order.Status == "Assigned")
                return Ok(new { message = "Payment already completed" });

            // Capture the funds from PayPal
            var result = await _payPalService.CaptureOrder(request.PayPalOrderId);

            if (result.Status != "COMPLETED")
                return BadRequest("PayPal payment failed.");

            // Update status to Paid
            order.Status = "Paid";

            // Try to auto-assign the best Partner for this order
            var assigned = await _partnerOrderService.TryAssignBestPartnerAsync(order);

            // Always save changes to persist "Paid" status
            await _context.SaveChangesAsync();

            // --- EMAIL LOGIC MOVED HERE ---
            // Send Confirmation Email to the customer regardless of partner assignment
            try
            {
                var userEmail = await _context.Users
                    .Where(u => u.Id == order.UserId)
                    .Select(u => u.Email)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrEmpty(userEmail))
                {
                    await _emailService.SendOrderConfirmationEmailAsync(
                                userEmail,
                                order.CustomerName,
                                order.OrderId.ToString(),
                                order.TotalAmount
                            );
                }
            }
            catch (Exception emailEx)
            {
                // Log email error but do not fail the request
                Console.WriteLine($"Failed to send order confirmation email: {emailEx.Message}");
            }
            // ------------------------------

            if (assigned)
            {
                return Ok(new { message = "Payment success, partner assigned" });
            }

            return Ok(new { message = "Payment completed but no partner available" });
        }

        // DTOs (Data Transfer Objects)
        public class CheckoutRequest
        {
            public string CustomerName { get; set; }
            public string ShippingAddress { get; set; }
            public string StateCode { get; set; }  // Mapped to ServiceZone
            public string Phone { get; set; }
            public string Message { get; set; }
            public DateTime EstimatedDeliveryTime { get; set; }
            public string ReturnUrl { get; set; }
            public string CancelUrl { get; set; }
            public List<CartItemDto> Items { get; set; }
        }

        public class CartItemDto
        {
            public int BouquetId { get; set; }
            public int Quantity { get; set; }
        }

        public class CompleteCheckoutRequest
        {
            public string PayPalOrderId { get; set; }
            public int LocalOrderId { get; set; }
        }
    }
}