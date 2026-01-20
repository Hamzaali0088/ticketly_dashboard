import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import TableSkeleton from '../../components/TableSkeleton';
import { adminAPI } from '../../lib/api/admin';
import { getAccessToken } from '../../lib/api/client';

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500 bg-opacity-20 text-green-400';
      case 'pending':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-500 bg-opacity-20 text-red-400';
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
                'Purchase Date',
              ]}
            >
              {loading ? (
                <TableSkeleton columns={8} />
              ) : (
                filteredTickets.map((ticket) => {
                  // Map API response to display fields
                  const ticketId = ticket._id || ticket.id || 'N/A';
                  const eventName = ticket.event?.title || ticket.eventName || 'N/A';
                  const customerName = ticket.user?.fullName || ticket.customerName || ticket.user?.name || 'N/A';
                  const customerEmail = ticket.user?.email || ticket.customerEmail || 'N/A';
                  const quantity = ticket.quantity || ticket.ticketQuantity || 0;
                  const totalPrice = ticket.totalPrice || ticket.price || ticket.amount || 0;
                  const status = ticket.status || 'confirmed';
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
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#9CA3AF]">
                          {new Date(purchaseDate).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </DataTable>
          )}
        </div>
      </div>
    </Layout>
  );
}

