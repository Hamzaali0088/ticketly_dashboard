import apiClient from './client';
import { API_BASE_URL } from '../config';

// Admin API functions
export const adminAPI = {
  // Get Pending Events (Admin only)
  getPendingEvents: async () => {
    try {
      const response = await apiClient.get('/admin/events/pending');
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

  // Approve Event (Admin only)
  approveEvent: async (id) => {
    try {
      const response = await apiClient.put(`/admin/events/${id}/approve`);
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

