import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import TableSkeleton from '../../components/TableSkeleton';
import { adminAPI } from '../../lib/api/admin';
import { getAccessToken } from '../../lib/api/client';
import { API_BASE_URL } from '../../lib/config';

// Helper function to fix image URLs (replace localhost with current backend URL)
const fixImageUrl = (url) => {
  if (!url) return null;
  
  // If URL contains localhost, replace it with the current API base URL
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    // Extract the path from the URL
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      // Remove /api from API_BASE_URL if present, then add the path
      const baseUrl = API_BASE_URL.replace('/api', '');
      return `${baseUrl}${path}`;
    } catch (e) {
      // If URL parsing fails, try to find /uploads in the string
      const uploadsIndex = url.indexOf('/uploads');
      if (uploadsIndex !== -1) {
        const path = url.substring(uploadsIndex);
        const baseUrl = API_BASE_URL.replace('/api', '');
        return `${baseUrl}${path}`;
      }
    }
  }
  
  // If it's already a full URL, return as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // If it's a relative path, construct full URL
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${url}`;
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deletingTicket, setDeletingTicket] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getTickets();
        
        // Handle different response structures
        let ticketsData = [];
        if (response.success && response.tickets) {
          ticketsData = response.tickets;
        } else if (response.tickets) {
          ticketsData = response.tickets;
        } else if (Array.isArray(response)) {
          ticketsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          ticketsData = response.data;
        }
        
        setTickets(ticketsData);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setError(error.message || 'Failed to fetch tickets');
        // Set empty array so UI still works
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [router]);

  // Filter tickets based on search query
  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    // Map API response fields to searchable fields
    const id = (ticket._id || ticket.id || '').toString().toLowerCase();
    const eventName = (ticket.event?.title || ticket.eventName || '').toLowerCase();
    const customerName = (ticket.user?.fullName || ticket.customerName || ticket.user?.name || '').toLowerCase();
    const customerEmail = (ticket.user?.email || ticket.customerEmail || '').toLowerCase();
    const quantity = (ticket.quantity || ticket.ticketQuantity || '').toString().toLowerCase();
    const totalPrice = (ticket.totalPrice || ticket.price || ticket.amount || '').toString().toLowerCase();
    const status = (ticket.status || '').toLowerCase();
    const purchaseDate = ticket.purchaseDate || ticket.createdAt || ticket.date;
    const formattedDate = purchaseDate ? new Date(purchaseDate).toLocaleDateString().toLowerCase() : '';
    
    return (
      id.includes(query) ||
      eventName.includes(query) ||
      customerName.includes(query) ||
      customerEmail.includes(query) ||
      quantity.includes(query) ||
      totalPrice.includes(query) ||
      status.includes(query) ||
      formattedDate.includes(query)
    );
  });

  const getStatusLabel = (status) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'pending_payment':
        return 'pending';
      case 'payment_in_review':
        return 'in_review';
      case 'confirmed':
        return 'submitted';
      case 'used':
        return 'used';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      case 'expired':
        return 'expired';
      default:
        return status || 'unknown';
    }
  };

  const getStatusColor = (status) => {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'confirmed':
        return 'bg-green-500 bg-opacity-20 text-green-400';
      case 'pending':
      case 'pending_payment':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'payment_in_review':
        return 'bg-blue-500 bg-opacity-20 text-blue-400';
      case 'used':
        return 'bg-gray-500 bg-opacity-20 text-gray-300';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-500 bg-opacity-20 text-red-400';
      case 'expired':
        return 'bg-gray-600 bg-opacity-20 text-gray-300';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-2">Error loading tickets</p>
            <p className="text-[#9CA3AF] text-sm whitespace-pre-line">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const getTicketId = (ticket) => {
    return ticket._id || ticket.id || ticket.ticketId || 'N/A';
  };

  const handleStatusClick = (ticket) => {
    const currentStatus = ticket.status || 'pending_payment';
    setSelectedTicket(ticket);
    setSelectedStatus(currentStatus);
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !selectedStatus) return;

    const ticketId = getTicketId(selectedTicket);
    if (!ticketId || ticketId === 'N/A') {
      setError('Ticket ID not found. Cannot update status.');
      setStatusModalOpen(false);
      return;
    }

    try {
      setUpdatingStatus(true);
      setError(null);
      const response = await adminAPI.updateTicketStatus(ticketId, selectedStatus);
      if (response.success) {
        // Update tickets list locally
        setTickets((prev) =>
          prev.map((t) =>
            getTicketId(t) === ticketId ? { ...t, status: selectedStatus } : t
          )
        );
        setStatusModalOpen(false);
        setSelectedTicket(null);
      } else {
        setError(response.message || 'Failed to update ticket status');
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      const message =
        err.message ||
        err.response?.data?.message ||
        'Failed to update ticket status';
      setError(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;

    const ticketId = getTicketId(ticketToDelete);
    if (!ticketId || ticketId === 'N/A') {
      setError('Ticket ID not found. Cannot delete ticket.');
      setDeleteModalOpen(false);
      return;
    }

    try {
      setDeletingTicket(true);
      setError(null);
      const response = await adminAPI.deleteTicket(ticketId);
      if (response.success) {
        // Remove ticket from list
        setTickets((prev) => prev.filter((t) => getTicketId(t) !== ticketId));
        setDeleteModalOpen(false);
        setTicketToDelete(null);
      } else {
        setError(response.message || 'Failed to delete ticket');
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
      const message =
        err.message ||
        err.response?.data?.message ||
        'Failed to delete ticket';
      setError(message);
    } finally {
      setDeletingTicket(false);
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white">Tickets</h1>
          <div className="text-[#9CA3AF] text-sm">
            Total: <span className="text-white font-semibold">{filteredTickets.length}</span>
            {searchQuery && tickets.length !== filteredTickets.length && (
              <span className="ml-2 text-[#9CA3AF]">
                (of {tickets.length})
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
              placeholder="Search tickets..."
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

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {!loading && filteredTickets.length === 0 ? (
            <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-[#9CA3AF] text-lg">No tickets found matching your search</p>
              <p className="text-[#6B7280] text-sm mt-2">Try different keywords</p>
            </div>
          ) : (
            <DataTable
              columns={[
                'Ticket ID',
                'Event Name',
                'Customer Name',
                'Customer Email',
                'Quantity',
                'Total Price',
                'Status',
                'Payment Screenshot',
                'Purchase Date',
                'Actions',
              ]}
            >
              {loading ? (
                <TableSkeleton columns={10} />
              ) : (
                filteredTickets.map((ticket) => {
                  // Map API response to display fields
                  const ticketId = getTicketId(ticket);
                  const eventName = ticket.event?.title || ticket.eventName || 'N/A';
                  const customerName = ticket.user?.fullName || ticket.customerName || ticket.user?.name || 'N/A';
                  const customerEmail = ticket.user?.email || ticket.customerEmail || 'N/A';
                  const quantity = ticket.quantity || ticket.ticketQuantity || 0;
                  const totalPrice = ticket.totalPrice || ticket.price || ticket.amount || 0;
                  const rawStatus = ticket.status || 'confirmed';
                  const status = getStatusLabel(rawStatus);
                  const purchaseDate = ticket.purchaseDate || ticket.createdAt || ticket.date || new Date().toISOString();
                  
                  return (
                    <tr key={ticketId} className="hover:bg-[#2A2A2A] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{ticketId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{eventName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#9CA3AF]">{customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">${totalPrice}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleStatusClick(ticket)}
                          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(rawStatus)} focus:outline-none focus:ring-2 focus:ring-[#9333EA]`}
                        >
                          {status}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ticket.paymentScreenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              // Fix the URL before opening modal
                              const fixedUrl = fixImageUrl(ticket.paymentScreenshotUrl);
                              setSelectedScreenshotUrl(fixedUrl);
                              setScreenshotModalOpen(true);
                            }}
                            className="text-[#9333EA] hover:text-[#7C3AED] text-sm font-medium underline focus:outline-none focus:ring-2 focus:ring-[#9333EA] rounded"
                          >
                            View Screenshot
                          </button>
                        ) : (
                          <span className="text-sm text-[#6B7280]">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#9CA3AF]">
                          {new Date(purchaseDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setTicketToDelete(ticket);
                            setDeleteModalOpen(true);
                          }}
                          className="text-[#EF4444] hover:text-[#DC2626] transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF4444] rounded p-1"
                          title="Delete Ticket"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </DataTable>
          )}
        </div>

        {/* Status Update Modal */}
        {statusModalOpen && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-8 w-full max-w-md">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-3">Update Ticket Status</h2>
                <p className="text-[#9CA3AF] text-sm">
                  Change status for ticket{' '}
                  <span className="text-white font-mono">
                    {getTicketId(selectedTicket)}
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#D1D5DB] mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-[#111827] border border-[#374151] text-[#D1D5DB] text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9333EA]"
                >
                  <option value="pending_payment">pending</option>
                  <option value="payment_in_review">in_review</option>
                  <option value="confirmed">submitted</option>
                  <option value="used">used</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!updatingStatus) {
                      setStatusModalOpen(false);
                      setSelectedTicket(null);
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-[#2A2A2A] border border-[#374151] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={updatingStatus}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  className="flex-1 px-6 py-3 bg-[#9333EA] text-white rounded-lg hover:bg-[#7C3AED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screenshot View Modal */}
        {screenshotModalOpen && selectedScreenshotUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setScreenshotModalOpen(false)}>
            <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Payment Screenshot</h2>
                <button
                  type="button"
                  onClick={() => {
                    setScreenshotModalOpen(false);
                    setSelectedScreenshotUrl(null);
                  }}
                  className="text-[#9CA3AF] hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex justify-center items-center bg-[#0F0F0F] rounded-lg p-4 min-h-[400px]">
                {selectedScreenshotUrl ? (
                  <>
                    <img
                      key={selectedScreenshotUrl}
                      src={selectedScreenshotUrl}
                      alt="Payment Screenshot"
                      className="max-w-full max-h-[70vh] object-contain rounded-lg"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error('Failed to load image:', selectedScreenshotUrl);
                        e.target.style.display = 'none';
                        const errorDiv = e.target.parentElement.querySelector('.error-message');
                        if (errorDiv) errorDiv.style.display = 'block';
                      }}
                    />
                    <div className="hidden error-message text-center">
                      <svg className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[#9CA3AF] text-lg mb-2">Failed to load image</p>
                      <p className="text-[#6B7280] text-sm mb-2">URL: {selectedScreenshotUrl}</p>
                      <a
                        href={selectedScreenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9333EA] hover:text-[#7C3AED] text-sm mt-2 inline-block underline"
                      >
                        Try opening in new tab
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-[#9CA3AF] text-lg">No screenshot URL available</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setScreenshotModalOpen(false);
                    setSelectedScreenshotUrl(null);
                  }}
                  className="px-6 py-3 bg-[#9333EA] text-white rounded-lg hover:bg-[#7C3AED] transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Ticket Confirmation Modal */}
        {deleteModalOpen && ticketToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-8 w-full max-w-md">
              <div className="mb-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500 bg-opacity-20 mb-4">
                  <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Delete Ticket</h2>
                <p className="text-[#9CA3AF] text-sm mb-2">
                  Are you sure you want to delete this ticket?
                </p>
                <p className="text-[#9CA3AF] text-sm">
                  Ticket ID: <span className="text-white font-mono">{getTicketId(ticketToDelete)}</span>
                </p>
                {ticketToDelete.event?.title && (
                  <p className="text-[#9CA3AF] text-sm mt-2">
                    Event: <span className="text-white">{ticketToDelete.event.title}</span>
                  </p>
                )}
                {ticketToDelete.user?.fullName && (
                  <p className="text-[#9CA3AF] text-sm mt-1">
                    Customer: <span className="text-white">{ticketToDelete.user.fullName}</span>
                  </p>
                )}
                <p className="text-red-400 text-sm mt-4 font-semibold">
                  This action cannot be undone. All related payment records and screenshots will also be deleted.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!deletingTicket) {
                      setDeleteModalOpen(false);
                      setTicketToDelete(null);
                      setError(null);
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-[#2A2A2A] border border-[#374151] text-white rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={deletingTicket}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTicket}
                  className="flex-1 px-6 py-3 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={deletingTicket}
                >
                  {deletingTicket ? 'Deleting...' : 'Delete Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


