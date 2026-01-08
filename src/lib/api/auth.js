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
      // Enhanced error handling for network errors
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
};

