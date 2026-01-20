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

  // Get Tickets (Admin only)
  getTickets: async () => {
    try {
      // Try /admin/tickets first (base URL already includes /api)
      // Expected full URL: http://localhost:5001/api/admin/tickets
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('🎫 Fetching tickets from:', `${API_BASE_URL}/admin/tickets`);
      }
      
      const response = await apiClient.get('/admin/tickets');
      return response.data;
    } catch (error) {
      // Log error details in development
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.error('❌ Error fetching tickets:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          fullURL: `${error.config?.baseURL || API_BASE_URL}${error.config?.url || '/admin/tickets'}`,
          message: error.message,
        });
      }

      // If 404, try alternative endpoints
      if (error.response?.status === 404) {
        const alternativeEndpoints = ['/tickets'];
        
        for (const endpoint of alternativeEndpoints) {
          try {
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
              console.log(`🔄 Trying alternative endpoint: ${endpoint}`);
            }
            
            const response = await apiClient.get(endpoint);
            return response.data;
          } catch (err) {
            // If it's not a 404, throw immediately (might be auth error, etc.)
            if (err.response?.status !== 404) {
              throw err;
            }
            // Continue to next endpoint
          }
        }
      }

      // Handle network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error(
          `Cannot connect to backend server at ${API_BASE_URL}. ` +
          `Please make sure the backend server is running and NEXT_PUBLIC_API_BASE_URL is set correctly in your .env.local file.`
        );
      }

      // Handle 404 after trying all endpoints
      if (error.response?.status === 404) {
        const attemptedUrl = `${error.config?.baseURL || API_BASE_URL}${error.config?.url || '/admin/tickets'}`;
        const isLocalhost = attemptedUrl.includes('localhost') || attemptedUrl.includes('127.0.0.1');
        
        let errorMessage = `Tickets endpoint not found at ${attemptedUrl}. `;
        
        if (!isLocalhost) {
          errorMessage += `\n\n⚠️ You're currently using the production server. ` +
            `For local development, please set NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api in your .env.local file.`;
        } else {
          errorMessage += `\n\nPlease verify:\n` +
            `1. Backend server is running on port 5001\n` +
            `2. The endpoint /api/admin/tickets exists on your backend\n` +
            `3. Your .env.local file has: NEXT_PUBLIC_API_BASE_URL=http://localhost:5001/api`;
        }
        
        throw new Error(errorMessage);
      }

      // Handle authentication errors
      if (error.response?.status === 401) {
        throw new Error(
          `Authentication failed. Please check your access token. ` +
          `The endpoint might require a valid Bearer token.`
        );
      }

      throw error;
    }
  },

  // Update Event Status (Admin only)
  updateEventStatus: async (id, status) => {
    try {
      const response = await apiClient.put(`/events/${id}`, { status });
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

  // Update Ticket Status (Admin only)
  updateTicketStatus: async (id, status) => {
    try {
      const response = await apiClient.put(`/admin/tickets/${id}/status`, { status });
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

  // Delete Ticket (Admin only)
  deleteTicket: async (id) => {
    try {
      const response = await apiClient.delete(`/admin/tickets/${id}`);
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

