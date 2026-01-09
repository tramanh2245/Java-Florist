import api from "./utils";

// Submit a new Partner Application (Public access)
export const submitPartnerApplication = (applicationData) => {
    return api.post("/PartnerApplications/Submit", applicationData);
};

// Admin: Get list of applications waiting for approval
export const getPendingApplications = () => {
    return api.get("/PartnerApplications/Pending");
};

// Admin: Get history of all applications
export const getAllApplications = () => {
    return api.get("/PartnerApplications/All");
};

// Admin: Approve a partner (creates their account)
export const approveApplication = (id) => {
    return api.post(`/PartnerApplications/Approve/${id}`);
};

// Admin: Reject a partner application
export const rejectApplication = (id) => {
    return api.post(`/PartnerApplications/Reject/${id}`);
};

// Partner: Get general analytics (Revenue, Order counts)
// Note: Uses direct axios call or api instance depending on implementation
export const getPartnerAnalyticsSummary = async (params = {}) => {
  // Calls the backend to get summary stats
  const res = await api.get("/PartnerAnalytics/summary", { params }); // Fixed axios -> api for consistency
  return res.data;
};

// Partner: Get daily revenue data for charts
export const getPartnerAnalyticsDaily = async (params = {}) => {
  const res = await api.get("/PartnerAnalytics/daily", { params }); // Fixed axios -> api for consistency
  return res.data;
};