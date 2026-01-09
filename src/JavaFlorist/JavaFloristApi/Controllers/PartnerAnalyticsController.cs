using JavaFloristApi.Data;
using JavaFloristApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace JavaFloristApi.Controllers
{
    // ============================
    // DTOs (Data Transfer Objects)
    // Used to format the analytics data sent to the frontend
    // ============================

    public class PartnerAnalyticsSummaryDto
    {
        public int TotalOrders { get; set; }
        public int CompletedOrders { get; set; }
        public int PendingOrders { get; set; }
        public int CancelledOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageOrderValue { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
    }

    public class PartnerDailyRevenueDto
    {
        public DateTime Date { get; set; }
        public int OrderCount { get; set; }
        public decimal Revenue { get; set; }
    }

    public class PartnerHourlyRevenueDto
    {
        public DateTime Date { get; set; }
        public int Hour { get; set; }
        public int OrderCount { get; set; }
        public decimal Revenue { get; set; }
        public bool IsWeekend { get; set; }
    }

    public class PartnerServiceZoneRevenueDto
    {
        public string ServiceZone { get; set; } = "";
        public int OrderCount { get; set; }
        public decimal Revenue { get; set; }
        public decimal AverageOrderValue { get; set; }
    }

    public class PartnerOccasionRevenueDto
    {
        public string Occasion { get; set; } = "";
        public int OrderCount { get; set; }
        public decimal Revenue { get; set; }
    }

    public class PartnerOrderTimelineItemDto
    {
        public string OrderCode { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = "";
        public decimal TotalAmount { get; set; }
        public string ServiceZone { get; set; } = "";
        public string Occasion { get; set; } = "";
    }

    // ============================
    // Internal Helper Model
    // Used for generating Fake Data for the demo
    // ============================
    internal class FakeOrder
    {
        public string OrderCode { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public string Status { get; set; } = "";
        public decimal Amount { get; set; }
        public string ServiceZone { get; set; } = "";
        public string Occasion { get; set; } = "";
    }

    // ============================
    //  Controller
    // ============================
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Partner")]
    public class PartnerAnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;

        // SWITCH: Set to TRUE to generate chart data for demonstration purposes
        // Set to FALSE to use real database data
        private readonly bool USE_FAKE_DATA = true;

        public PartnerAnalyticsController(AppDbContext context)
        {
            _context = context;
        }

        // ============================
        // 1. SUMMARY STATS
        //    Calculates Total Revenue, Total Orders, etc.
        // ============================
        [HttpGet("summary")]
        public async Task<ActionResult<PartnerAnalyticsSummaryDto>> GetSummary(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var (fromDate, toDate) = NormalizeRange(from, to);

            // --- DEMO MODE ---
            if (USE_FAKE_DATA)
            {
                var fakeOrders = GenerateFakeOrders(fromDate, toDate);

                // Calculate stats from the fake list
                var totalOrders = fakeOrders.Count;
                var completed = fakeOrders.Count(o => o.Status == "Completed");
                var pending = fakeOrders.Count(o => o.Status == "Pending" || o.Status == "Processing");
                var cancelled = fakeOrders.Count(o => o.Status == "Cancelled");
                var totalRevenue = fakeOrders
                    .Where(o => o.Status == "Completed")
                    .Sum(o => o.Amount);

                var avg = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                return Ok(new PartnerAnalyticsSummaryDto
                {
                    TotalOrders = totalOrders,
                    CompletedOrders = completed,
                    PendingOrders = pending,
                    CancelledOrders = cancelled,
                    TotalRevenue = totalRevenue,
                    AverageOrderValue = avg,
                    FromDate = fromDate,
                    ToDate = toDate
                });
            }

            // --- REAL DATABASE MODE ---
            var partnerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(partnerId))
                return Unauthorized();

            var query = _context.Orders
                .Where(o => o.PartnerId == partnerId
                            && o.CreatedAt >= fromDate
                            && o.CreatedAt <= toDate);

            // Query real data from SQL
            var totalOrdersDb = await query.CountAsync();
            var completedOrdersDb = await query.Where(o => o.Status == "Completed").CountAsync();
            var pendingOrdersDb = await query.Where(o => o.Status == "Pending" || o.Status == "Processing").CountAsync();
            var cancelledOrdersDb = await query.Where(o => o.Status == "Cancelled").CountAsync();

            var totalRevenueDb = await query
                .Where(o => o.Status == "Completed")
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;

            var avgOrderValueDb = totalOrdersDb > 0 ? totalRevenueDb / totalOrdersDb : 0;

            return Ok(new PartnerAnalyticsSummaryDto
            {
                TotalOrders = totalOrdersDb,
                CompletedOrders = completedOrdersDb,
                PendingOrders = pendingOrdersDb,
                CancelledOrders = cancelledOrdersDb,
                TotalRevenue = totalRevenueDb,
                AverageOrderValue = avgOrderValueDb,
                FromDate = fromDate,
                ToDate = toDate
            });
        }

        // ============================
        // 2. DAILY REVENUE
        //    Group data by Date
        // ============================
        [HttpGet("daily")]
        public ActionResult<IEnumerable<PartnerDailyRevenueDto>> GetDaily(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var (fromDate, toDate) = NormalizeRange(from, to);

            if (USE_FAKE_DATA)
            {
                var fakeOrders = GenerateFakeOrders(fromDate, toDate);

                var daily = fakeOrders
                    .Where(o => o.Status == "Completed")
                    .GroupBy(o => o.CreatedAt.Date)
                    .Select(g => new PartnerDailyRevenueDto
                    {
                        Date = g.Key,
                        OrderCount = g.Count(),
                        Revenue = g.Sum(x => x.Amount)
                    })
                    .OrderBy(x => x.Date)
                    .ToList();

                return Ok(daily);
            }

            return BadRequest("Daily analytics from real DB not implemented yet.");
        }

        // ============================
        // 3. HOURLY REVENUE
        //    Group data by Hour (to show peak times)
        // ============================
        [HttpGet("hourly")]
        public ActionResult<IEnumerable<PartnerHourlyRevenueDto>> GetHourly(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var (fromDate, toDate) = NormalizeRange(from, to);

            if (!USE_FAKE_DATA)
                return BadRequest("Hourly analytics is only available in fake mode for now.");

            var fakeOrders = GenerateFakeOrders(fromDate, toDate);

            var hourly = fakeOrders
                .Where(o => o.Status == "Completed")
                .GroupBy(o => new { o.CreatedAt.Date, Hour = o.CreatedAt.Hour })
                .Select(g => new PartnerHourlyRevenueDto
                {
                    Date = g.Key.Date,
                    Hour = g.Key.Hour,
                    OrderCount = g.Count(),
                    Revenue = g.Sum(x => x.Amount),
                    IsWeekend = g.Key.Date.DayOfWeek == DayOfWeek.Saturday
                                || g.Key.Date.DayOfWeek == DayOfWeek.Sunday
                })
                .OrderBy(x => x.Date)
                .ThenBy(x => x.Hour)
                .ToList();

            return Ok(hourly);
        }

        // ============================
        // 4. BY SERVICE ZONE
        //    Which state/area generates the most revenue?
        // ============================
        [HttpGet("by-zone")]
        public ActionResult<IEnumerable<PartnerServiceZoneRevenueDto>> GetByServiceZone(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var (fromDate, toDate) = NormalizeRange(from, to);

            if (!USE_FAKE_DATA)
                return BadRequest("Zone analytics is only available in fake mode for now.");

            var fakeOrders = GenerateFakeOrders(fromDate, toDate);

            var zones = fakeOrders
                .Where(o => o.Status == "Completed")
                .GroupBy(o => o.ServiceZone)
                .Select(g => new PartnerServiceZoneRevenueDto
                {
                    ServiceZone = g.Key,
                    OrderCount = g.Count(),
                    Revenue = g.Sum(x => x.Amount),
                    AverageOrderValue = g.Sum(x => x.Amount) / g.Count()
                })
                .OrderByDescending(x => x.Revenue)
                .ToList();

            return Ok(zones);
        }

        // ============================
        // 5. BY OCCASION
        //    Which type of flower (Wedding, Birthday) sells best?
        // ============================
        [HttpGet("by-occasion")]
        public ActionResult<IEnumerable<PartnerOccasionRevenueDto>> GetByOccasion(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to)
        {
            var (fromDate, toDate) = NormalizeRange(from, to);

            if (!USE_FAKE_DATA)
                return BadRequest("Occasion analytics is only available in fake mode for now.");

            var fakeOrders = GenerateFakeOrders(fromDate, toDate);

            var occasions = fakeOrders
                .Where(o => o.Status == "Completed")
                .GroupBy(o => o.Occasion)
                .Select(g => new PartnerOccasionRevenueDto
                {
                    Occasion = g.Key,
                    OrderCount = g.Count(),
                    Revenue = g.Sum(x => x.Amount)
                })
                .OrderByDescending(x => x.Revenue)
                .ToList();

            return Ok(occasions);
        }

        // ============================
        // 6. ORDER TIMELINE
        //    List of recent orders for the timeline view
        // ============================
        [HttpGet("timeline")]
        public ActionResult<IEnumerable<PartnerOrderTimelineItemDto>> GetTimeline(
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int limit = 50)
        {
            var (fromDate, toDate) = NormalizeRange(from, to);

            if (!USE_FAKE_DATA)
                return BadRequest("Timeline analytics is only available in fake mode for now.");

            var fakeOrders = GenerateFakeOrders(fromDate, toDate);

            var items = fakeOrders
                .OrderByDescending(o => o.CreatedAt)
                .Take(Math.Max(10, Math.Min(limit, 200)))
                .Select(o => new PartnerOrderTimelineItemDto
                {
                    OrderCode = o.OrderCode,
                    CreatedAt = o.CreatedAt,
                    Status = o.Status,
                    TotalAmount = o.Amount,
                    ServiceZone = o.ServiceZone,
                    Occasion = o.Occasion
                })
                .ToList();

            return Ok(items);
        }

        // ============================
        // HELPERS
        // ============================

        // Ensure date range is valid (default to last 30 days if null)
        private (DateTime fromDate, DateTime toDate) NormalizeRange(DateTime? from, DateTime? to)
        {
            var toDate = (to ?? DateTime.UtcNow).Date;
            var fromDate = (from ?? DateTime.UtcNow.AddDays(-30)).Date;

            if (fromDate > toDate)
            {
                var tmp = fromDate;
                fromDate = toDate.AddDays(-30);
                toDate = tmp;
            }

            return (fromDate, toDate);
        }

        // ============================
        // FAKE DATA GENERATOR
        // Creates random orders with realistic patterns (rush hours, weekends)
        // ============================
        private List<FakeOrder> GenerateFakeOrders(DateTime fromDate, DateTime toDate)
        {
            var list = new List<FakeOrder>();
            var rnd = new Random();

            var zones = new[] { "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat", "West Bengal", "Uttar Pradesh" };
            var occasions = new[] { "Birthday", "Anniversary", "Wedding", "Valentine's Day", "Mother's Day", "Get Well Soon", "Congratulations" };

            int orderIndex = 1;

            // Loop through each day in range
            for (var day = fromDate; day <= toDate; day = day.AddDays(1))
            {
                var isWeekend = day.DayOfWeek == DayOfWeek.Saturday || day.DayOfWeek == DayOfWeek.Sunday;

                // Simulate store hours: 8 AM -> 10 PM
                for (int hour = 8; hour <= 22; hour++)
                {
                    double baseProb = 0.10;

                    // Increase probability during lunch break
                    if (hour >= 11 && hour <= 13) baseProb += 0.20;

                    // Increase probability during evening rush
                    if (hour >= 18 && hour <= 21) baseProb += 0.35;

                    // Increase probability on weekends
                    if (isWeekend) baseProb += 0.20;

                    // Randomly decide if an order happens this hour
                    if (rnd.NextDouble() > baseProb) continue;

                    // Generate 1 to 5 orders in this hour
                    int ordersInSlot = rnd.Next(1, isWeekend ? 5 : 3);

                    for (int i = 0; i < ordersInSlot; i++)
                    {
                        var occasion = occasions[rnd.Next(occasions.Length)];
                        var zone = zones[rnd.Next(zones.Length)];

                        // Determine price based on occasion (e.g., Weddings are expensive)
                        decimal basePrice = occasion switch
                        {
                            "Wedding" => rnd.Next(3500, 7500),
                            "Valentine's Day" => rnd.Next(2500, 6000),
                            "Anniversary" => rnd.Next(2000, 5000),
                            _ => rnd.Next(900, 3500)
                        };

                        // Determine status (mostly Completed)
                        var roll = rnd.NextDouble();
                        string status;
                        if (roll < 0.70) status = "Completed";
                        else if (roll < 0.90) status = "Pending";
                        else status = "Cancelled";

                        var createdAt = new DateTime(day.Year, day.Month, day.Day, hour, rnd.Next(0, 60), rnd.Next(0, 60), DateTimeKind.Utc);

                        list.Add(new FakeOrder
                        {
                            OrderCode = $"JF-{createdAt:yyyyMMddHHmm}-{orderIndex:D3}",
                            CreatedAt = createdAt,
                            Status = status,
                            Amount = basePrice,
                            ServiceZone = zone,
                            Occasion = occasion
                        });

                        orderIndex++;
                    }
                }
            }

            return list;
        }
    }
}