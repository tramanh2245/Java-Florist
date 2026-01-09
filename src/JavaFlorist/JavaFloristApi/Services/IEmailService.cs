using JavaFloristApi.Models;
using System.Threading.Tasks;

namespace JavaFloristApi.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body);
        Task SendApprovalEmailAsync(string toEmail, string loginEmail, string partnerName, string tempPassword);
        Task SendRejectionEmailAsync(string partnerEmail, string partnerName);
        Task SendPasswordResetLinkAsync(string toEmail, string resetLink);
        Task SendCustomerWelcomeEmailAsync(string toEmail, string customerName);
        Task SendOrderConfirmationEmailAsync(string toEmail, string customerName, string orderId, decimal totalAmount);
    }
}