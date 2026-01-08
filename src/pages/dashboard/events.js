import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { adminAPI } from '../../lib/api/admin';
import { getAccessToken } from '../../lib/api/client';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          setEvents(response.events || []);
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

  const handleApprove = async (eventId) => {
    try {
      const response = await adminAPI.approveEvent(eventId);
      if (response.success) {
        // Remove the approved event from the list
        setEvents(events.filter((event) => event._id !== eventId));
        alert('Event approved successfully!');
      } else {
        alert('Failed to approve event');
      }
    } catch (err) {
      console.error('Error approving event:', err);
      alert(err.response?.data?.message || 'Failed to approve event');
    }
  };

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
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Pending Events</h1>
          <div className="text-[#9CA3AF] text-sm">
            Total: <span className="text-white font-semibold">{events.length}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[#9CA3AF] text-lg">No pending events</p>
          </div>
        ) : (
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
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
                  {events.map((event) => (
                    <tr key={event._id} className="hover:bg-[#2A2A2A] transition-colors">
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
                          onClick={() => handleApprove(event._id)}
                          className="px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7C3AED] transition-colors"
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

