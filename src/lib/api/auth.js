import apiClient from './client';
import { setTokens, clearTokens } from './client';
import { API_BASE_URL } from '../config';

// Auth API functions
export const authAPI = {
  // Signup
  signup: async (data) => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  // Login (Step 1 - Send OTP)
  login: async (data) => {
    try {
      // Log API base URL for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 Attempting to connect to:', API_BASE_URL);
      }
      const response = await apiClient.post('/auth/login', data);
      return response.data;
    } catch (error) {
      // --- Centralised, robust error handling for login ---
      //
      // We want three behaviours:
      // 1. Network errors → throw a clear, human‑readable Error explaining
      //    how to fix the backend / env configuration.
      // 2. Backend "business" errors (e.g. invalid credentials, 404 with
      //    `{ success: false, message: "Email not found..." }`) → do NOT
      //    throw. Instead, return the backend payload so the UI can display
      //    the message without crashing or showing the Next.js error overlay.
      // 3. Anything truly unexpected → rethrow so it can be logged and fixed.

      // 1) Network / connectivity issues
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('❌ Network Error Details:', {
          code: error.code,
          message: error.message,
          apiBaseUrl: API_BASE_URL,
          config: error.config?.url,
        });
        throw new Error(
          `Cannot connect to backend server at ${API_BASE_URL}. ` +
          `Please make sure the backend server is running on port 5001 and NEXT_PUBLIC_API_BASE_URL is set correctly in your .env.local file. ` +
          `If you just updated .env.local, please restart the Next.js dev server.`
        );
      }

      // 2) Backend returned a response with an error status (4xx / 5xx)
      if (error.response && error.response.data) {
        const data = error.response.data;
        return {
          success: data.success ?? false,
          message:
            data.message ||
            data.error ||
            'Login failed. Please check your credentials and try again.',
          // Preserve any additional fields the backend might send
          ...data,
        };
      }

      // 3) Fallback – let the caller handle truly unexpected errors
      throw error;
    }
  },

  // Verify OTP (Step 2 - Complete Login)
  verifyOtp: async (data) => {
    const response = await apiClient.post('/auth/verify-otp', data);
    const result = response.data;
    
    // Save tokens after successful verification
    if (result.accessToken && result.refreshToken) {
      setTokens(result.accessToken, result.refreshToken);
    }
    
    return result;
  },

  // Refresh Access Token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    const result = response.data;
    
    // Save new tokens
    if (result.accessToken && result.refreshToken) {
      setTokens(result.accessToken, result.refreshToken);
    }
    
    return result;
  },

  // Get User Profile
  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // Get All Users (Admin only)
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/auth/users');
      return response.data;
    } catch (error) {
      // Enhanced error handling
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error(
          `Cannot connect to backend server at ${API_BASE_URL}. ` +
          `Please make sure the backend server is running and NEXT_PUBLIC_API_BASE_URL is set correctly in your .env.local file.`
        );
      }
      throw error;
    }
  },

  // Update User (Self Update)
  updateUser: async (data) => {
    const response = await apiClient.put('/auth/update', data);
    return response.data;
  },

  // Delete User
  deleteUser: async () => {
    const response = await apiClient.delete('/auth/delete');
    clearTokens();
    return response.data;
  },

  // Update User By Admin
  updateUserByAdmin: async (userId, data) => {
    try {
      const response = await apiClient.put(`/auth/update/${userId}`, data);
      return response.data;
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error(
          `Cannot connect to backend server at ${API_BASE_URL}. ` +
          `Please make sure the backend server is running and NEXT_PUBLIC_API_BASE_URL is set correctly in your .env.local file.`
        );
      }
      throw error;
    }
  },

  // Delete User By Admin
  deleteUserByAdmin: async (userId) => {
    try {
      const response = await apiClient.delete(`/auth/delete/${userId}`);
      return response.data;
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error(
          `Cannot connect to backend server at ${API_BASE_URL}. ` +
          `Please make sure the backend server is running and NEXT_PUBLIC_API_BASE_URL is set correctly in your .env.local file.`
        );
      }
      throw error;
    }
  },
};

