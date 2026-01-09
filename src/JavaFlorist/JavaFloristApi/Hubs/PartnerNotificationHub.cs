using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System.Threading.Tasks;

namespace JavaFloristApi.Hubs
{
    [Authorize(Roles = "Partner")] // chỉ Partner mới kết nối Hub này
    public class PartnerNotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                // tự động join vào group "partner-{id}"
                await Groups.AddToGroupAsync(Context.ConnectionId, $"partner-{userId}");
            }

            await base.OnConnectedAsync();
        }

        // Optional: nếu muốn FE chủ động join group khác / test
        public async Task JoinPartnerGroup(string partnerId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"partner-{partnerId}");
        }
    }
}
