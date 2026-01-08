import apiClient from './client';

// Admin API functions
export const adminAPI = {
  // Get Pending Events (Admin only)
  getPendingEvents: async () => {
    const response = await apiClient.get('/admin/events/pending');
    return response.data;
  },

  // Approve Event (Admin only)
  approveEvent: async (id) => {
    const response = await apiClient.put(`/admin/events/${id}/approve`);
    return response.data;
  },
};

