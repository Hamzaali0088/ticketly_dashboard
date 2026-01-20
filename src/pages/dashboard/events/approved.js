import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { adminAPI } from '../../../lib/api/admin';
import { getAccessToken } from '../../../lib/api/client';

export default function ApprovedEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Helper function to get event ID from event object
  const getEventId = (event) => {
    if (!event) return null;
    // Try different possible ID fields
    return event._id || event.id || event.eventId || event.event_id || null;
  };

  useEffect(() => {
    const fetchApprovedEvents = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        router.push('/login');
        return;
      }

      try {
        const response = await adminAPI.getApprovedEvents();
        if (response.success) {
          const eventsList = response.events || [];
          setEvents(eventsList);
        } else {
          setError('Failed to fetch approved events');
        }
      } catch (err) {
        console.error('Error fetching approved events:', err);
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          const errorMessage = err.message || err.response?.data?.message || 'Failed to fetch approved events';
          setError(errorMessage.includes('Cannot connect') ? errorMessage : `Failed to fetch approved events: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchApprovedEvents();

    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchApprovedEvents();
      }
    };

    // Refresh when window gets focus
    const handleFocus = () => {
      fetchApprovedEvents();
    };

    // Set up periodic refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      if (!document.hidden) {
        fetchApprovedEvents();
      }
    }, 10000);

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  const handleDeleteClick = (event) => {
    const eventId = getEventId(event);
    if (!eventId) {
      console.error('❌ No valid ID found in event:', event);
      setError(`Event ID not found. Event data: ${JSON.stringify(event)}`);
      return;
    }
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEvent) return;
    
    const eventId = getEventId(selectedEvent);
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      console.error('❌ Invalid event ID:', eventId);
      setError('Event ID is missing. Cannot delete event.');
      setShowDeleteModal(false);
      return;
    }
    
    setDeletingId(eventId);
    setError('');
    setSuccess('');
    setShowDeleteModal(false);
    
    console.log('🗑️ Deleting event with ID:', eventId);
    
    try {
      const response = await adminAPI.deleteEvent(eventId);
      if (response.success) {
        // Remove the deleted event from the list
        setEvents(events.filter((event) => getEventId(event) !== eventId));
        // Show success message
        const successMsg = response.message || 'Event deleted successfully!';
        setSuccess(successMsg);
        setError('');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      } else {
        const errorMsg = response.message || 'Failed to delete event';
        setError(errorMsg);
        setSuccess('');
        console.error('Delete event failed:', response);
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      let errorMsg = err.message || 
                    err.response?.data?.message || 
                    err.response?.data?.error || 
                    'Failed to delete event';
      
      if (err.response?.status) {
        if (err.response.status === 500) {
          errorMsg = `Server Error (500): ${errorMsg}. Please check backend server logs.`;
        } else {
          errorMsg = `${errorMsg} (Status: ${err.response.status})`;
        }
      }
      
      if (eventId) {
        errorMsg = `${errorMsg} [Event ID: ${eventId}]`;
      }
      
      setError(errorMsg);
      setSuccess('');
    } finally {
      setDeletingId(null);
      setSelectedEvent(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedEvent(null);
  };

  // Filter events based on search query
  const filteredEvents = events.filter((event) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const title = (event.title || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    const location = (event.location || '').toLowerCase();
    const date = new Date(event.date).toLocaleDateString().toLowerCase();
    const time = (event.time || '').toLowerCase();
    const ticketPrice = (event.ticketPrice || '').toString().toLowerCase();
    const createdByName = (event.createdBy?.fullName || event.createdBy?.email || '').toLowerCase();
    const createdByEmail = (event.createdBy?.email || '').toLowerCase();
    
    return (
      title.includes(query) ||
      description.includes(query) ||
      location.includes(query) ||
      date.includes(query) ||
      time.includes(query) ||
      ticketPrice.includes(query) ||
      createdByName.includes(query) ||
      createdByEmail.includes(query)
    );
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white">Approved Events</h1>
          <div className="text-[#9CA3AF] text-sm">
            Total: <span className="text-white font-semibold">{filteredEvents.length}</span>
            {searchQuery && events.length !== filteredEvents.length && (
              <span className="ml-2 text-[#9CA3AF]">
                (of {events.length})
              </span>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex-shrink-0">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#2A2A2A] border border-[#374151] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9CA3AF] hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-500 bg-opacity-20 border border-green-500 rounded-lg text-green-400 flex-shrink-0">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400 flex-shrink-0">
            {error}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {events.length === 0 ? (
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[#9CA3AF] text-lg">No approved events</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-[#9CA3AF] text-lg">No events found matching your search</p>
            <p className="text-[#6B7280] text-sm mt-2">Try different keywords</p>
          </div>
          ) : (
            <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="overflow-y-auto overflow-x-auto flex-1 table-scroll">
                <table className="w-full">
                <thead className="bg-[#2A2A2A]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Ticket Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#374151]">
                  {filteredEvents.map((event) => {
                    const eventId = getEventId(event);
                    return (
                    <tr key={eventId} className="hover:bg-[#2A2A2A] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{event.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#9CA3AF] max-w-xs truncate">
                          {event.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-[#9CA3AF]">{event.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#9CA3AF] max-w-xs truncate">
                          {event.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">${event.ticketPrice}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {event.createdBy?.fullName || event.createdBy?.email || 'Unknown'}
                        </div>
                        <div className="text-xs text-[#9CA3AF]">
                          {event.createdBy?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteClick(event)}
                          disabled={deletingId === eventId || !eventId}
                          className="p-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Event"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-8 w-full max-w-md">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-red-500 bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-3">Delete Event?</h2>
                <p className="text-[#9CA3AF] text-lg mb-2">
                  Are you sure you want to delete this event?
                </p>
                <p className="text-red-400 text-sm font-medium">
                  "{selectedEvent.title || 'This event'}" will be permanently deleted and cannot be recovered.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deletingId !== null}
                  className="flex-1 px-6 py-3 bg-[#2A2A2A] border border-[#374151] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deletingId !== null}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {deletingId ? 'Deleting...' : 'Delete Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

