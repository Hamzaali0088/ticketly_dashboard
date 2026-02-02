import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import TableSkeleton from '../../components/TableSkeleton';
import { adminAPI } from '../../lib/api/admin';
import { getAccessToken } from '../../lib/api/client';

const STATUS_PENDING = 'pending';
const STATUS_APPROVED = 'approved';

export default function EventsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(STATUS_APPROVED);

  const [pendingEvents, setPendingEvents] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const getEventId = (event) => {
    if (!event) return null;
    return event._id || event.id || event.eventId || event.event_id || null;
  };

  const fetchPending = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.push('/login');
      return;
    }
    try {
      const response = await adminAPI.getPendingEvents();
      if (response.success) {
        setPendingEvents(response.events || []);
      } else {
        setError('Failed to fetch pending events');
      }
    } catch (err) {
      console.error('Error fetching pending events:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        const msg = err.message || err.response?.data?.message || 'Failed to fetch pending events';
        setError(msg.includes('Cannot connect') ? msg : `Failed to fetch pending events: ${msg}`);
      }
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchApproved = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.push('/login');
      return;
    }
    try {
      const response = await adminAPI.getApprovedEvents();
      if (response.success) {
        setApprovedEvents(response.events || []);
      } else {
        setError('Failed to fetch approved events');
      }
    } catch (err) {
      console.error('Error fetching approved events:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        const msg = err.message || err.response?.data?.message || 'Failed to fetch approved events';
        setError(msg.includes('Cannot connect') ? msg : `Failed to fetch approved events: ${msg}`);
      }
    } finally {
      setLoadingApproved(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    fetchPending();
    fetchApproved();
  }, [router.isReady]);

  const handleApproveClick = (event) => {
    const eventId = getEventId(event);
    if (!eventId) {
      setError('Event ID not found.');
      return;
    }
    setSelectedEvent(event);
    setShowConfirmModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedEvent) return;
    const eventId = getEventId(selectedEvent);
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      setError('Event ID is missing. Cannot approve event.');
      setShowConfirmModal(false);
      return;
    }
    setApprovingId(eventId);
    setError('');
    setSuccess('');
    setShowConfirmModal(false);
    try {
      const response = await adminAPI.approveEvent(eventId);
      if (response.success) {
        setPendingEvents((prev) => prev.filter((e) => getEventId(e) !== eventId));
        setSuccess(response.message || 'Event approved successfully!');
        setActiveTab(STATUS_APPROVED);
        fetchApproved();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.message || 'Failed to approve event');
      }
    } catch (err) {
      console.error('Error approving event:', err);
      let errorMsg = err.message || err.response?.data?.message || err.response?.data?.error || 'Failed to approve event';
      if (err.response?.status === 500) {
        errorMsg = `Server Error (500): ${errorMsg}`;
      }
      setError(errorMsg);
    } finally {
      setApprovingId(null);
      setSelectedEvent(null);
    }
  };

  const handleCancelApprove = () => {
    setShowConfirmModal(false);
    setSelectedEvent(null);
  };

  const handleDeleteClick = (event) => {
    const eventId = getEventId(event);
    if (!eventId) {
      setError('Event ID not found.');
      return;
    }
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const handleStatusChange = async (event, newStatus) => {
    const eventId = getEventId(event);
    if (!eventId) {
      setError('Event ID not found. Cannot update status.');
      return;
    }
    setUpdatingStatusId(eventId);
    setError('');
    setSuccess('');
    try {
      const response = await adminAPI.updateEventStatus(eventId, newStatus);
      if (response.success) {
        if (newStatus !== 'approved') {
          setApprovedEvents((prev) => prev.filter((e) => getEventId(e) !== eventId));
        } else {
          setApprovedEvents((prev) =>
            prev.map((e) => (getEventId(e) === eventId ? { ...e, status: newStatus } : e))
          );
        }
        setSuccess(response.message || 'Event status updated successfully.');
      } else {
        setError(response.message || 'Failed to update event status');
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to update event status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEvent) return;
    const eventId = getEventId(selectedEvent);
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      setError('Event ID is missing. Cannot delete event.');
      setShowDeleteModal(false);
      return;
    }
    setDeletingId(eventId);
    setError('');
    setSuccess('');
    setShowDeleteModal(false);
    try {
      const response = await adminAPI.deleteEvent(eventId);
      if (response.success) {
        setApprovedEvents((prev) => prev.filter((e) => getEventId(e) !== eventId));
        setSuccess(response.message || 'Event deleted successfully!');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.message || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.message || err.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
      setSelectedEvent(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedEvent(null);
  };

  const filterBySearch = (list) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((event) => {
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
  };

  const events = activeTab === STATUS_PENDING ? pendingEvents : approvedEvents;
  const filteredEvents = filterBySearch(events);
  const loading = activeTab === STATUS_PENDING ? loadingPending : loadingApproved;

  return (
    <Layout>
      <div className="h-full flex flex-col p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white">Events</h1>
        </div>

        {/* Tabs + Search row */}
        <div className="flex flex-wrap items-center gap-4 mb-6 flex-shrink-0">
          <div className="flex rounded-lg border border-[#374151] p-1 bg-[#1F1F1F]">
            <button
              type="button"
              onClick={() => setActiveTab(STATUS_PENDING)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === STATUS_PENDING
                  ? 'bg-[#9333EA] text-white'
                  : 'bg-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:bg-[#374151]'
              }`}
            >
              Pending ({pendingEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(STATUS_APPROVED)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === STATUS_APPROVED
                  ? 'bg-[#9333EA] text-white'
                  : 'bg-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:bg-[#374151]'
              }`}
            >
              Approved ({approvedEvents.length})
            </button>
          </div>
          <div className="relative max-w-md flex-1 min-w-[200px] ml-auto">
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
              className="w-full pl-10 pr-4 py-2.5 bg-[#2A2A2A] border border-[#374151] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                type="button"
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
              <p className="text-[#9CA3AF] text-lg">
                {activeTab === STATUS_PENDING ? 'No pending events' : 'No approved events'}
              </p>
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
                'Actions',
                'Title',
                'Description',
                'Date & Time',
                'Location',
                'Ticket Price',
                'Created By',
              ]}
            >
              {loading ? (
                <TableSkeleton columns={7} />
              ) : (
                filteredEvents.map((event) => {
                  const eventId = getEventId(event);
                  return (
                    <tr key={eventId} className="hover:bg-[#2A2A2A] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {activeTab === STATUS_PENDING ? (
                          <button
                            type="button"
                            onClick={() => handleApproveClick(event)}
                            disabled={approvingId === eventId || !eventId}
                            className="px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approvingId === eventId ? 'Approving...' : 'Approve'}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex p-1.5 rounded-lg bg-green-500/10 text-green-400"
                              title="Approved"
                              aria-label="Approved"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </span>
                            <select
                              value={event.status || 'approved'}
                              onChange={(e) => handleStatusChange(event, e.target.value)}
                              disabled={updatingStatusId === eventId}
                              className="bg-[#1F1F1F] border border-[#374151] text-[#D1D5DB] text-xs px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
                            >
                              <option value="approved">Approved</option>
                              <option value="pending">Pending</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(event)}
                              disabled={deletingId === eventId || !eventId}
                              className="p-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Event"
                              aria-label="Delete event"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{event.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#9CA3AF] max-w-xs truncate">{event.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{new Date(event.date).toLocaleDateString()}</div>
                        <div className="text-xs text-[#9CA3AF]">{event.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#9CA3AF] max-w-xs truncate">{event.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">${event.ticketPrice}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {event.createdBy?.fullName || event.createdBy?.email || 'Unknown'}
                        </div>
                        <div className="text-xs text-[#9CA3AF]">{event.createdBy?.email}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </DataTable>
          )}
        </div>

        {/* Approve confirmation modal */}
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
                  type="button"
                  onClick={handleCancelApprove}
                  disabled={approvingId !== null}
                  className="flex-1 px-6 py-3 bg-[#2A2A2A] border border-[#374151] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
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

        {/* Delete confirmation modal */}
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
                <p className="text-[#9CA3AF] text-lg mb-2">Are you sure you want to delete this event?</p>
                <p className="text-red-400 text-sm font-medium">
                  &quot;{selectedEvent.title || 'This event'}&quot; will be permanently deleted and cannot be recovered.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  disabled={deletingId !== null}
                  className="flex-1 px-6 py-3 bg-[#2A2A2A] border border-[#374151] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
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
