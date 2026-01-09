using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using JavaFloristApi.Models;

namespace JavaFloristApi.Services
{
    public class EmailService : IEmailService
    {
        private readonly MailSettings _mailSettings;

        public EmailService(IConfiguration configuration)
        {
            _mailSettings = configuration.GetSection("MailSettings").Get<MailSettings>();
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(_mailSettings.FromName, _mailSettings.FromEmail));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;

            var builder = new BodyBuilder();
            builder.HtmlBody = body;
            email.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();

            await smtp.ConnectAsync(_mailSettings.Host, _mailSettings.Port, MailKit.Security.SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_mailSettings.Username, _mailSettings.Password);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }


        public async Task SendApprovalEmailAsync(string toEmail, string loginEmail, string partnerName, string tempPassword)
        {
            string subject = "Congratulations! Your Partner Application for JavaFlorist has been Approved";
            string body = $@"
                <p>Dear {partnerName},</p>
                <p>Congratulations! We are pleased to inform you that your application to become a partner on the JavaFlorist platform has been approved.</p>
                <p>To get started, we have created a <strong>Partner</strong> account for you:</p>
                <ul>
                    <li><strong>Username:</strong> {loginEmail}</li>
                    <li><strong>Password:</strong> {tempPassword}</li>
                </ul>
                <p>Please log in and change your password immediately.</p>
                <p>Best regards,<br>The JavaFlorist Team.</p>";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendRejectionEmailAsync(string partnerEmail, string partnerName)
        {
            string subject = "An Update on Your JavaFlorist Partner Application";
            string body = $@"
                <p>Dear {partnerName},</p>
                <p>Thank you for your interest in JavaFlorist.</p>
                <p>After careful review, we regret to inform you that we cannot accept your application at this time.</p>
                <p>Best regards,<br>The JavaFlorist Team.</p>";

            await SendEmailAsync(partnerEmail, subject, body);
        }

        public async Task SendPasswordResetLinkAsync(string toEmail, string resetLink)
        {
            string subject = "Reset Your Password for JavaFlorist";
            string body = $@"
                <p>Hello,</p>
                <p>You requested to reset your password. Click the link below:</p>
                <p><a href=""{resetLink}"">Reset Password</a></p>
                <p>This link is valid for 1 hour.</p>
                <p>Regards,<br>The JavaFlorist Team.</p>";

            await SendEmailAsync(toEmail, subject, body);
        }


        public async Task SendCustomerWelcomeEmailAsync(string toEmail, string customerName)
        {
            string subject = "Welcome to JavaFlorist! 🌸";

            string body = $@"
                <div style='font-family: Arial, sans-serif; color: #333;'>
                    <h2 style='color: #db2777;'>Welcome, {customerName}!</h2>
                    <p>Thank you for creating an account with JavaFlorist.</p>
                    <p>You can now explore our collection of fresh bouquets and track your orders easily.</p>
                    <p><a href='http://localhost:5173' style='background-color: #db2777; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>Start Shopping</a></p>
                    <p>Warm regards,<br/>The JavaFlorist Team</p>
                </div>";

            await SendEmailAsync(toEmail, subject, body);
        }

        public async Task SendOrderConfirmationEmailAsync(string toEmail, string customerName, string orderId, decimal totalAmount)
        {
            string subject = $"Order Confirmation #{orderId}";

            string body = $@"
                <div style='font-family: Arial, sans-serif; color: #333;'>
                    <h2 style='color: #16a34a;'>Order Placed Successfully! ✅</h2>
                    <p>Hi {customerName},</p>
                    <p>We have received your order #{orderId} and are preparing it.</p>
                    
                    <div style='background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                        <p><strong>Order ID:</strong> #{orderId}</p>
                        <p><strong>Total Amount:</strong> <span style='color: #db2777; font-weight: bold;'>${totalAmount:F2}</span></p>
                    </div>

                    <p>You can track your order status in 'My Orders'.</p>
                    <p>Regards,<br/>The JavaFlorist Team</p>
                </div>";

            await SendEmailAsync(toEmail, subject, body);
        }
    }
}