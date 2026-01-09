using System;
using System.Linq;
using System.Threading.Tasks;
using JavaFloristApi.Data;
using JavaFloristApi.Hubs;
using JavaFloristApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace JavaFloristApi.Services
{
    // ============================================
    // 1. Service to find the Best Partner (Round-Robin Logic)
    // ============================================
    public interface IPartnerAssignmentService
    {

        /// Finds the best partner in a specific service zone.
        /// Uses Round-Robin logic to distribute orders evenly.
        /// 'excludePartnerId' is used if a partner declines an order.

        Task<AppUser?> FindBestPartnerForAreaAsync(string serviceZoneCode, string? excludePartnerId = null);
    }

    public class PartnerAssignmentService : IPartnerAssignmentService
    {
        private readonly AppDbContext _context;
        private readonly UserManager<AppUser> _userManager;

        public PartnerAssignmentService(AppDbContext context, UserManager<AppUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<AppUser?> FindBestPartnerForAreaAsync(string serviceZoneCode, string? excludePartnerId = null)
        {
            if (string.IsNullOrWhiteSpace(serviceZoneCode))
                return null;

            var zone = serviceZoneCode.Trim().ToUpperInvariant();

            // 1. Get all users with the "Partner" role
            var allPartners = await _userManager.GetUsersInRoleAsync("Partner");

            // 2. Filter partners who work in the requested Service Area
            var partnersInArea = allPartners
                .Where(p =>
                    !string.IsNullOrWhiteSpace(p.ServiceArea) &&
                    string.Equals(
                        p.ServiceArea.Trim(),
                        zone,
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                .ToList();

            // 3. Exclude a specific partner if needed (e.g., if they previously declined)
            if (!string.IsNullOrEmpty(excludePartnerId))
            {
                partnersInArea = partnersInArea
                    .Where(p => p.Id != excludePartnerId)
                    .ToList();
            }

            if (!partnersInArea.Any())
                return null;

            // 4. Sort partners to ensure a consistent list order
            partnersInArea = partnersInArea
                .OrderBy(p => p.CreatedDate ?? DateTime.MinValue)
                .ThenBy(p => p.Id)
                .ToList();

            var partnerIds = partnersInArea.Select(p => p.Id).ToList();

            // 5. Find the LAST order assigned in this zone to one of these partners
            var lastOrder = await _context.Orders
                .Where(o =>
                    o.ServiceZone != null &&
                    o.ServiceZone.ToUpper() == zone &&
                    o.PartnerId != null &&
                    partnerIds.Contains(o.PartnerId)
                )
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            // 6. If no previous orders exist, pick the first partner
            if (lastOrder == null)
                return partnersInArea.First();

            // 7. Round-Robin Logic: Find the index of the last partner and pick the NEXT one
            var lastIndex = partnersInArea.FindIndex(p => p.Id == lastOrder.PartnerId);
            if (lastIndex == -1)
                return partnersInArea.First();

            var nextIndex = (lastIndex + 1) % partnersInArea.Count;
            return partnersInArea[nextIndex];
        }

    }

    // ============================================
    // 2. Service to Assign Order & Notify
    // ============================================
    public interface IPartnerOrderService
    {

        /// Automatically finds the best partner and assigns them to the order.
        Task<bool> TryAssignBestPartnerAsync(Order order, string? excludePartnerId = null);

        /// Manually assigns a specific partner (Admin function).
        Task AssignToSpecificPartnerAsync(Order order, AppUser partner);
    }

    public class PartnerOrderService : IPartnerOrderService
    {
        private readonly AppDbContext _context;
        private readonly IPartnerAssignmentService _partnerAssignmentService;
        private readonly IHubContext<PartnerNotificationHub> _hubContext;
        private readonly IEmailService _emailService;

        public PartnerOrderService(
            AppDbContext context,
            IPartnerAssignmentService partnerAssignmentService,
            IHubContext<PartnerNotificationHub> hubContext,
            IEmailService emailService)
        {
            _context = context;
            _partnerAssignmentService = partnerAssignmentService;
            _hubContext = hubContext;
            _emailService = emailService;
        }

        public async Task<bool> TryAssignBestPartnerAsync(Order order, string? excludePartnerId = null)
        {
            if (order == null)
                return false;

            if (string.IsNullOrWhiteSpace(order.ServiceZone))
                return false;

            // 1. Find the best partner using the Round-Robin service
            var partner = await _partnerAssignmentService
                .FindBestPartnerForAreaAsync(order.ServiceZone, excludePartnerId);

            if (partner == null)
                return false;

            // 2. Update Order with Partner ID and change status to 'Assigned'
            order.PartnerId = partner.Id;
            order.Status = "Assigned";

            await _context.SaveChangesAsync();

            // 3. Send Notification (SignalR)
            await NotifyPartnerNewOrderAsync(partner, order);

            return true;
        }

        public async Task AssignToSpecificPartnerAsync(Order order, AppUser partner)
        {
            if (order == null || partner == null)
                return;

            order.PartnerId = partner.Id;
            order.Status = "Assigned";

            await _context.SaveChangesAsync();
            await NotifyPartnerNewOrderAsync(partner, order);
        }

        /// Helper: Send Real-time notification (SignalR) and optional Email
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

            // 1. Send SignalR message to specific partner group
            await _hubContext.Clients
                .Group($"partner-{partner.Id}")
                .SendAsync("NewOrderAssigned", payload);

        }
    }
}