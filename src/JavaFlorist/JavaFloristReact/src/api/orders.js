import api from "./utils";

// Step 1 of Checkout: Send cart data to backend to create a pending order
export const createOrder = async (orderData) => {
  const response = await api.post("/Checkout/initiate", orderData);
  return response.data;
};

// Customer: Get history of my own orders
export const getMyOrders = async () => {
  const response = await api.get("/Orders/my");
  return response.data;
};

// Partner: Get orders assigned specifically to me
export const getPartnerOrders = async () => {
  const response = await api.get("/Orders/partner");
  return response.data;
};

// Partner: Update status (e.g., from Assigned -> Delivering -> Completed)
export const updateOrderStatus = async (orderId, status) => {
  const response = await api.put(`/Orders/${orderId}/status`, { status });
  return response.data;
};

// Partner: Update delivery info if needed (e.g., correction of address)
export const updateOrderInfo = async (orderId, info) => {
  const response = await api.put(`/Orders/${orderId}/info`, info);
  return response.data;
};

// Partner: Get simple dashboard counts (New, Processing, Completed)
export const getPartnerSummary = async () => {
  const response = await api.get("/Orders/partner/summary");
  return response.data;
};

// --- ANALYTICS API (For Partner Charts) ---

// Get overall stats (Total Revenue, Total Orders)
export const getPartnerAnalyticsSummary = async (params = {}) => {
  const res = await api.get("/PartnerAnalytics/summary", { params });
  return res.data;
};

// Get data for "Revenue by Day" chart
export const getPartnerAnalyticsDaily = async (params = {}) => {
  const res = await api.get("/PartnerAnalytics/daily", { params });
  return res.data;
};

// Get data for "Peak Hours" chart
export const getPartnerAnalyticsHourly = async (params = {}) => {
  const res = await api.get("/PartnerAnalytics/hourly", { params });
  return res.data;
};

// Get data for "Revenue by Location/State" chart
export const getPartnerAnalyticsByZone = async (params = {}) => {
  const res = await api.get("/PartnerAnalytics/by-zone", { params });
  return res.data;
};

// Get data for "Revenue by Occasion" chart
export const getPartnerAnalyticsByOccasion = async (params = {}) => {
  const res = await api.get("/PartnerAnalytics/by-occasion", { params });
  return res.data;
};

// Get recent order history for the Timeline view
export const getPartnerAnalyticsTimeline = async (params = {}) => {
  const res = await api.get("/PartnerAnalytics/timeline", { params });
  return res.data;
};