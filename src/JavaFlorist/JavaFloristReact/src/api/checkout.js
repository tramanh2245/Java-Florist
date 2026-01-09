import api from "./utils";

// Step 1: Initiate Checkout
// Send cart items to backend -> Backend creates PayPal Order -> Returns PayPal URL
export const initiateCheckout = async (orderData) => {
    const response = await api.post("/Checkout/initiate", orderData);
    return response.data;
};

// Step 2: Complete Checkout
// Called after PayPal payment is successful. Sends PayPal Order ID to backend to capture funds.
export const completeCheckout = async (data) => {
    const response = await api.post("/Checkout/complete", data);
    return response.data;
};