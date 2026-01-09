using PayPalCheckoutSdk.Core;
using PayPalCheckoutSdk.Orders;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace JavaFloristApi.Services
{
    public class PayPalService
    {
        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly string _mode;

        public PayPalService(IConfiguration configuration)
        {
            _clientId = configuration["PayPal:ClientId"];
            _clientSecret = configuration["PayPal:ClientSecret"];
            _mode = configuration["PayPal:Mode"];
        }

        // Helper to setup the PayPal Environment (Sandbox vs Live)
        private PayPalHttpClient Client()
        {
            PayPalEnvironment environment;
            if (_mode == "Live")
                environment = new LiveEnvironment(_clientId, _clientSecret);
            else
                environment = new SandboxEnvironment(_clientId, _clientSecret);

            return new PayPalHttpClient(environment);
        }

        // Create a PayPal Order and return the approval link
        public async Task<string> CreateOrder(decimal amount, string returnUrl, string cancelUrl)
        {
            // Build the Order Request object
            var orderRequest = new OrderRequest()
            {
                CheckoutPaymentIntent = "CAPTURE",
                ApplicationContext = new ApplicationContext
                {
                    ReturnUrl = returnUrl,
                    CancelUrl = cancelUrl,
                    BrandName = "JavaFlorist",
                    UserAction = "PAY_NOW"
                },
                PurchaseUnits = new List<PurchaseUnitRequest>
                {
                    new PurchaseUnitRequest
                    {
                        AmountWithBreakdown = new AmountWithBreakdown
                        {
                            CurrencyCode = "USD",
                            Value = amount.ToString("F2") // Format amount to 2 decimal places
                        }
                    }
                }
            };

            var request = new OrdersCreateRequest();
            request.Prefer("return=representation");
            request.RequestBody(orderRequest);

            // Execute request to PayPal API
            var response = await Client().Execute(request);
            var result = response.Result<Order>();

            // Find and return the 'approve' URL so the user can login to PayPal
            var approveLink = result.Links.FirstOrDefault(x => x.Rel == "approve");
            return approveLink?.Href;
        }

        // Capture payment after user approves the transaction
        public async Task<Order> CaptureOrder(string orderId)
        {
            var request = new OrdersCaptureRequest(orderId);
            request.RequestBody(new OrderActionRequest());

            var response = await Client().Execute(request);
            return response.Result<Order>();
        }
    }
}