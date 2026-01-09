import api from "./utils";

/**
 * Gets the full profile details of the currently logged-in user.
 * This works for both Customers and Partners.
 * (Requires authentication token)
 */
export const getMyProfile = async () => {
    try {
        const response = await api.get("/Profile/Me");
        return response.data;
    } catch (error) {
        console.error("Failed to fetch profile", error);
        throw error;
    }
};

// Updates the current user's profile information
export const updateMyProfile = async (data) => {
    const response = await api.put("/Profile/Me", data);
    return response.data;
};