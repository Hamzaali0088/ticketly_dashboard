import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import TableSkeleton from '../../components/TableSkeleton';
import { adminAPI } from '../../lib/api/admin';
import { getAccessToken } from '../../lib/api/client';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to get event ID from event object
  const getEventId = (event) => {
    if (!event) return null;
    // Try different possible ID fields
    return event._id || event.id || event.eventId || event.event_id || null;
  };

  useEffect(() => {
    const fetchPendingEvents = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        router.push('/login');
        return;
      }

      try {
        const response = await adminAPI.getPendingEvents();
        if (response.success) {
          const eventsList = response.events || [];
          setEvents(eventsList);
        } else {
          setError('Failed to fetch pending events');
        }
      } catch (err) {
        console.error('Error fetching pending events:', err);
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          const errorMessage = err.message || err.response?.data?.message || 'Failed to fetch pending events';
          setError(errorMessage.includes('Cannot connect') ? errorMessage : `Failed to fetch pending events: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPendingEvents();
  }, [router]);

  const handleApproveClick = (event) => {
    const eventId = getEventId(event);
    if (!eventId) {
      console.error('❌ No valid ID found in event:', event);
      setError(`Event ID not found. Event data: ${JSON.stringify(event)}`);
      return;
    }
    setSelectedEvent(event);
    setShowConfirmModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedEvent) return;
    
    const eventId = getEventId(selectedEvent);
    // Validate event ID
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      console.error('❌ Invalid event ID:', eventId);
      setError('Event ID is missing. Cannot approve event.');
      setShowConfirmModal(false);
      return;
    }
    
    setApprovingId(eventId);
    setError('');
    setSuccess('');
    setShowConfirmModal(false);
    
    // Log for debugging
    console.log('✅ Approving event with ID:', eventId);
    console.log('🔗 API URL will be:', `/admin/events/${eventId}/approve`);
    
    try {
      const response = await adminAPI.approveEvent(eventId);
      if (response.success) {
        // Remove the approved event from the list
        setEvents(events.filter((event) => getEventId(event) !== eventId));
        // Show success message from API response
        const successMsg = response.message || 'Event approved successfully!';
        setSuccess(successMsg);
        setError('');
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      } else {
        const errorMsg = response.message || 'Failed to approve event';
        setError(errorMsg);
        setSuccess('');
        console.error('Approve event failed:', response);
      }
    } catch (err) {
      console.error('Error approving event:', err);
      // Extract detailed error message
      let errorMsg = err.message || 
                    err.response?.data?.message || 
                    err.response?.data?.error || 
                    'Failed to approve event';
      
      // Add status code information
      if (err.response?.status) {
        if (err.response.status === 500) {
          errorMsg = `Server Error (500): ${errorMsg}. Please check backend server logs.`;
        } else {
          errorMsg = `${errorMsg} (Status: ${err.response.status})`;
        }
      }
      
      // Add event ID to error message for debugging
      if (eventId) {
        errorMsg = `${errorMsg} [Event ID: ${eventId}]`;
      }
      
      setError(errorMsg);
      setSuccess('');
    } finally {
      setApprovingId(null);
      setSelectedEvent(null);
    }
  };

  const handleCancelApprove = () => {
    setShowConfirmModal(false);
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

  return (
    <Layout>
      <div className="h-full flex flex-col p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white">Pending Events</h1>
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
          {!loading && events.length === 0 ? (
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[#9CA3AF] text-lg">No pending events</p>
          </div>
        ) : !loading && filteredEvents.length === 0 ? (
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-[#9CA3AF] text-lg">No events found matching your search</p>
            <p className="text-[#6B7280] text-sm mt-2">Try different keywords</p>
          </div>
          ) : (
            <DataTable
              columns={[
                'Title',
                'Description',
                'Date & Time',
                'Location',
                'Ticket Price',
                'Created By',
                'Actions',
              ]}
            >
              {loading ? (
                <TableSkeleton columns={7} />
              ) : filteredEvents.map((event) => {
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
                          onClick={() => handleApproveClick(event)}
                          disabled={approvingId === eventId || !eventId}
                          className="px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approvingId === eventId ? 'Approving...' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  )})}
            </DataTable>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-8 w-full max-w-md">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-[#9333EA] bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#9333EA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-3">Approve Event?</h2>
                <p className="text-[#9CA3AF] text-lg">
                  Are you sure you want to approve this event? This action will make the event visible to all users.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelApprove}
                  disabled={approvingId !== null}
                  className="flex-1 px-6 py-3 bg-[#2A2A2A] border border-[#374151] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApprove}
                  disabled={approvingId !== null}
                  className="flex-1 px-6 py-3 bg-[#9333EA] text-white rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {approvingId ? 'Approving...' : 'Approve Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
