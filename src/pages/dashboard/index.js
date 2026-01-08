import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { authAPI } from "../../lib/api/auth";
import { adminAPI } from "../../lib/api/admin";
import { getAccessToken } from "../../lib/api/client";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingEvents: 0,
    totalUsers: 0,
    totalTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchStats = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        router.push("/login");
        return;
      }

      try {
        // Fetch stats
        const [eventsRes, usersRes] = await Promise.all([
          adminAPI
            .getPendingEvents()
            .catch(() => ({ success: false, events: [] })),
          authAPI.getAllUsers().catch(() => ({ success: false, users: [] })),
        ]);

        setStats({
          pendingEvents: eventsRes.success ? eventsRes.events?.length || 0 : 0,
          totalUsers: usersRes.success ? usersRes.users?.length || 0 : 0,
          totalTickets: 150, // Static for now
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        if (error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchStats();
  }, [router]);

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
        <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9CA3AF] text-sm font-medium mb-1">
                  Pending Events
                </p>
                <p className="text-3xl font-bold text-white">
                  {stats.pendingEvents}
                </p>
              </div>
              <div className="bg-[#9333EA] bg-opacity-20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-[#9333EA]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9CA3AF] text-sm font-medium mb-1">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="bg-[#9333EA] bg-opacity-20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-[#9333EA]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#9CA3AF] text-sm font-medium mb-1">
                  Total Tickets
                </p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalTickets}
                </p>
              </div>
              <div className="bg-[#9333EA] bg-opacity-20 p-3 rounded-lg">
                <svg
                  className="w-8 h-8 text-[#9333EA]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#374151]">
            <h2 className="text-xl font-semibold text-white">
              Recent Activity
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#2A2A2A]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#374151]">
                <tr className="hover:bg-[#2A2A2A] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    Dashboard accessed
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF]">
                    System
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-green-500 bg-opacity-20 text-green-400 rounded">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#9CA3AF]">
                    {new Date().toLocaleDateString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
