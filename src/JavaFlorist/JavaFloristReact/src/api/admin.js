import api from "./utils";

// Get list of ALL orders for the Admin Dashboard
export const getAdminOrders = async () => {
    const response = await api.get("/Admin/orders");
    return response.data;
};

// Get full details of a specific order
export const getAdminOrderById = async (orderId) => {
    const res = await api.get(`/Admin/orders/${orderId}`);
    return res.data;
};

// Manually assign an order to a specific Partner
export const assignOrder = async (orderId, partnerId) => {
    const response = await api.post("/Admin/assign-order", { orderId, partnerId });
    return response.data;
};

// Get revenue statistics for all partners (for Admin reporting)
export const getRevenueStats = async () => {
    const response = await api.get("/Admin/revenue-stats");
    return response.data;
};

// Get a simple list of partners (name + id) for dropdown menus
export const getPartnersList = async () => {
    const response = await api.get("/Admin/partners-list");
    return response.data;
};