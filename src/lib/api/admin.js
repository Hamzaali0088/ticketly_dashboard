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

  // Delete Event (Admin only)
  deleteEvent: async (id) => {
    try {
      // Use /events/{id} endpoint (base URL already includes /api)
      const response = await apiClient.delete(`/events/${id}`);
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

  // Get Approved Events (Admin only)
  getApprovedEvents: async () => {
    try {
      // Fetch all events from /events endpoint (base URL already includes /api)
      const response = await apiClient.get('/events');
      
      // Handle response structure: { success, count, events: [...] }
      const allEvents = response.data?.events || response.data || [];
      
      // If events from /events endpoint, they are likely all approved
      // Filter only if status field exists and is not approved
      const approvedEvents = allEvents.filter(event => {
        // If no status field exists, assume it's approved (since it's from /events endpoint)
        if (!event.status && !event.isApproved && !event.approved && !event.approvalStatus) {
          return true;
        }
        // Otherwise check status fields
        return (
          event.status === 'approved' || 
          event.isApproved === true || 
          event.approved === true ||
          event.approvalStatus === 'approved' ||
          event.approvalStatus === 'Approved'
        );
      });
      
      return {
        success: true,
        events: approvedEvents,
      };
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
};

