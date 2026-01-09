import axios from 'axios';

const API_URL = 'https://localhost:7107/api/auth';

// Login function: Sends credentials and handles error messages
export async function login(email, password) {
  try {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    return res.data;
  } catch (error) {
    // Extract specific error message from backend response
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.message) throw new Error(errorData.message);
      if (errorData.Message) throw new Error(errorData.Message);
    }
    if (error.message) throw new Error(error.message);
    throw new Error('Invalid email or password');
  }
}

// Register function: Handles sign-up and validation errors (e.g., weak password)
export async function register(registerData) {
  try {
    const res = await axios.post(`${API_URL}/register`, registerData);
    return res.data;
  } catch (error) {
    // Detailed error handling for Identity validation errors
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.validationErrors) {
        const errorMessages = Object.values(errorData.validationErrors).flat().join(', ');
        throw new Error(errorMessages || errorData.message || 'Validation failed');
      }
      // ... handle other error formats ...
      if (errorData.message) throw new Error(errorData.message);
    }
    throw new Error('Registration failed. Please try again.');
  }
}

// Change Password for logged-in user
export async function changePassword(data) {
  try {
    const res = await axios.post(`${API_URL}/ChangePassword`, data);
    return res.data;
  } catch (error) {
    // Handle validation errors from backend
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.validationErrors) {
        const errorMessages = Object.values(errorData.validationErrors).flat().join(', ');
        throw new Error(errorMessages);
      }
      if (errorData.message) throw new Error(errorData.message);
    }
    throw new Error('Failed to change password.');
  }
}

// Send "Forgot Password" email link
export const forgotPassword = async (email) => {
  const response = await axios.post(`${API_URL}/ForgotPassword`, { email });
  return response.data;
};

// Reset password using the token from email
export const resetPassword = async (resetData) => {
  const response = await axios.post(`${API_URL}/ResetPassword`, resetData);
  return response.data;
};

// Refresh Access Token using the Refresh Token
export async function refreshAccessToken(refreshToken) {
  try {
    const res = await axios.post(`${API_URL}/refresh`, { refreshToken });
    return res.data;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// Logout: Notify backend to revoke refresh token
export async function logout(refreshToken) {
  try {
    await axios.post(
      `${API_URL}/logout`,
      { refreshToken },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

// ==========================================
// AXIOS INTERCEPTORS (Middleware for Frontend)
// ==========================================
export function setupAxiosInterceptors() {
  // REQUEST INTERCEPTOR:
  // Automatically add the "Bearer Token" to every API request header
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // RESPONSE INTERCEPTOR:
  // automatically handles "401 Unauthorized" errors
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If we get 401 and haven't retried yet...
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
          try {
            // 1. Try to get a new Access Token
            const newTokens = await refreshAccessToken(refreshToken);
            if (newTokens) {
              // 2. Save new tokens
              localStorage.setItem('token', newTokens.accessToken);
              localStorage.setItem('refreshToken', newTokens.refreshToken);
              
              // 3. Retry the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // If refresh fails, log the user out completely
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }
      }
      return Promise.reject(error);
    }
  );
}