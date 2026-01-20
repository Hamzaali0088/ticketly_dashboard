import { useState } from 'react';
import Layout from '../../components/Layout';

export default function TicketsPage() {
  // Static ticket data for now
  const [tickets] = useState([
    {
      id: 'TKT-001',
      eventName: 'Summer Music Festival',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      quantity: 2,
      totalPrice: 100,
      status: 'confirmed',
      purchaseDate: '2024-01-15',
    },
    {
      id: 'TKT-002',
      eventName: 'Tech Conference 2024',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      quantity: 1,
      totalPrice: 75,
      status: 'confirmed',
      purchaseDate: '2024-01-14',
    },
    {
      id: 'TKT-003',
      eventName: 'Art Exhibition',
      customerName: 'Bob Johnson',
      customerEmail: 'bob@example.com',
      quantity: 3,
      totalPrice: 150,
      status: 'pending',
      purchaseDate: '2024-01-16',
    },
    {
      id: 'TKT-004',
      eventName: 'Food Festival',
      customerName: 'Alice Brown',
      customerEmail: 'alice@example.com',
      quantity: 2,
      totalPrice: 60,
      status: 'cancelled',
      purchaseDate: '2024-01-13',
    },
    {
      id: 'TKT-005',
      eventName: 'Jazz Night',
      customerName: 'Charlie Wilson',
      customerEmail: 'charlie@example.com',
      quantity: 1,
      totalPrice: 50,
      status: 'confirmed',
      purchaseDate: '2024-01-17',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tickets based on search query
  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const id = (ticket.id || '').toLowerCase();
    const eventName = (ticket.eventName || '').toLowerCase();
    const customerName = (ticket.customerName || '').toLowerCase();
    const customerEmail = (ticket.customerEmail || '').toLowerCase();
    const quantity = (ticket.quantity || '').toString().toLowerCase();
    const totalPrice = (ticket.totalPrice || '').toString().toLowerCase();
    const status = (ticket.status || '').toLowerCase();
    const purchaseDate = new Date(ticket.purchaseDate).toLocaleDateString().toLowerCase();
    
    return (
      id.includes(query) ||
      eventName.includes(query) ||
      customerName.includes(query) ||
      customerEmail.includes(query) ||
      quantity.includes(query) ||
      totalPrice.includes(query) ||
      status.includes(query) ||
      purchaseDate.includes(query)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500 bg-opacity-20 text-green-400';
      case 'pending':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500 bg-opacity-20 text-red-400';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
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
        <div className="mb-6">
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

        {filteredTickets.length === 0 ? (
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-[#9CA3AF] text-lg">No tickets found matching your search</p>
            <p className="text-[#6B7280] text-sm mt-2">Try different keywords</p>
          </div>
        ) : (
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2A2A2A]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Customer Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Total Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Purchase Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#374151]">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[#2A2A2A] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{ticket.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">{ticket.eventName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{ticket.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#9CA3AF]">{ticket.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{ticket.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">${ticket.totalPrice}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#9CA3AF]">
                        {new Date(ticket.purchaseDate).toLocaleDateString()}
                      </div>
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

