import api from "./utils";

const ENDPOINT = '/users';

// Admin: Get a list of all users in the system
export const getUsers = () => {
    return api.get(ENDPOINT);
};

// Admin: Get details of a specific user by ID
export const getUserById = (id) => {
    return api.get(`${ENDPOINT}/${id}`);
};

// Admin: Create a new user manually
export const createUser = (data) => {
    return api.post(ENDPOINT, data);
};

// Admin: Update an existing user's details
export const updateUser = (id, data) => {
    return api.put(`${ENDPOINT}/${id}`, data);
};

// Admin: Delete a user account
export const deleteUser = (id) => {
    return api.delete(`${ENDPOINT}/${id}`);
};