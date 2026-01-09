import axios from 'axios';

// Helper function to retrieve the JWT token from browser storage
export function getToken() {
    return localStorage.getItem('token');
}

// Create a central Axios instance for all API calls
const api = axios.create({
    baseURL: 'https://localhost:7107/api', // Backend API URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor:
// Automatically attaches the "Bearer Token" to every outgoing request.
// This ensures the backend knows who is making the request.
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;