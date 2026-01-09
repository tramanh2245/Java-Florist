import api from "./utils";

// Get a list of all bouquets to display on the shop page
export const getBouquets = () => api.get("/bouquets");

// Get details of a single bouquet by its ID
export const getBouquet = (id) => api.get(`/bouquets/${id}`);

// Delete a bouquet (Admin only)
export const deleteBouquet = (id) => api.delete(`/bouquets/${id}`);

// Get all occasions (e.g., Birthday, Wedding) for filtering
export const getOccasions = () => api.get("/occasions");

// Create a new bouquet (Admin only)
// Note: We use "multipart/form-data" because we are uploading images
export const createBouquet = (formData) => {
    return api.post("/bouquets", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

// Update an existing bouquet
// Also requires "multipart/form-data" in case images are changed
export const updateBouquet = (id, formData) => {
    return api.put(`/bouquets/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

// Fetch all occasions (duplicate of getOccasions, likely for specific dropdowns)
export const getAllOccasions = () => api.get("/Occasions");

// Get suggested messages for a specific occasion card
export const getMessagesByOccasionId = (id) => api.get(`/Occasions/${id}/messages`);