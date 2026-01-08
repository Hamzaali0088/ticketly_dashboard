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
            Total: <span className="text-white font-semibold">{tickets.length}</span>
          </div>
        </div>

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
                {tickets.map((ticket) => (
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
      </div>
    </Layout>
  );
}

