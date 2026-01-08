import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { authAPI } from '../../lib/api/auth';
import { getAccessToken } from '../../lib/api/client';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ email: '', username: '' });
  const [selectedRole, setSelectedRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        router.push('/login');
        return;
      }

      try {
        const response = await authAPI.getAllUsers();
        if (response.success) {
          setUsers(response.users || []);
        } else {
          setError('Failed to fetch users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch users');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      if (response.success) {
        setUsers(response.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.email || '',
      username: user.username || '',
    });
    setActionError('');
    setEditModalOpen(true);
  };

  const handleRoleClick = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role || 'user');
    setActionError('');
    setRoleModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(true);
    setActionError('');

    try {
      const updateData = {};
      if (editFormData.email && editFormData.email !== selectedUser.email) {
        updateData.email = editFormData.email;
      }
      if (editFormData.username && editFormData.username !== selectedUser.username) {
        updateData.username = editFormData.username;
      }

      if (Object.keys(updateData).length === 0) {
        setActionError('No changes detected');
        setActionLoading(false);
        return;
      }

      const response = await authAPI.updateUserByAdmin(selectedUser.id || selectedUser._id, updateData);
      
      if (response.success) {
        setEditModalOpen(false);
        await fetchUsers();
      } else {
        setActionError(response.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setActionError(
        err.response?.data?.message || 
        err.message || 
        'Failed to update user'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionLoading(true);
    setActionError('');

    try {
      const response = await authAPI.updateUserByAdmin(selectedUser.id || selectedUser._id, {
        role: selectedRole,
      });
      
      if (response.success) {
        setRoleModalOpen(false);
        await fetchUsers();
      } else {
        setActionError(response.message || 'Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setActionError(
        err.response?.data?.message || 
        err.message || 
        'Failed to update role'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = async (user) => {
    if (!confirm(`Are you sure you want to delete user "${user.fullName || user.name || user.email}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      const response = await authAPI.deleteUserByAdmin(user.id || user._id);
      
      if (response.success) {
        await fetchUsers();
      } else {
        setActionError(response.message || 'Failed to delete user');
        alert(response.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete user';
      setActionError(errorMessage);
      alert(errorMessage);
    } finally {
      setActionLoading(false);
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
          <h1 className="text-3xl font-bold text-white">All Users</h1>
          <div className="text-[#9CA3AF] text-sm">
            Total: <span className="text-white font-semibold">{users.length}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {users.length === 0 ? (
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-[#9CA3AF] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-[#9CA3AF] text-lg">No users found</p>
          </div>
        ) : (
          <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2A2A2A]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Auth Provider
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Verified
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#374151]">
                  {users.map((user) => (
                    <tr key={user.id || user._id} className="hover:bg-[#2A2A2A] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {user.fullName || user.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#9CA3AF]">
                          {user.username || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleRoleClick(user)}
                          className={`px-2 py-1 text-xs font-medium rounded cursor-pointer hover:opacity-80 transition-opacity ${
                            user.role === 'admin'
                              ? 'bg-purple-500 bg-opacity-20 text-purple-400'
                              : user.role === 'superadmin'
                              ? 'bg-red-500 bg-opacity-20 text-red-400'
                              : user.role === 'organizer'
                              ? 'bg-orange-500 bg-opacity-20 text-orange-400'
                              : 'bg-blue-500 bg-opacity-20 text-blue-400'
                          }`}
                        >
                          {user.role || 'user'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#9CA3AF]">
                          {user.authProvider || 'email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          user.isVerified
                            ? 'bg-green-500 bg-opacity-20 text-green-400'
                            : 'bg-gray-500 bg-opacity-20 text-gray-400'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#9CA3AF]">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-blue-500 bg-opacity-20 text-blue-400 rounded hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-red-500 bg-opacity-20 text-red-400 rounded hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Edit User</h2>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setActionError('');
                  }}
                  className="text-[#9CA3AF] hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#374151] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#374151] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {actionError && (
                  <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400 text-sm">
                    {actionError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setActionError('');
                    }}
                    className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-[#374151] text-white rounded-lg hover:bg-[#374151] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Role Change Modal */}
        {roleModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1F1F1F] border border-[#374151] rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Change Role</h2>
                <button
                  onClick={() => {
                    setRoleModalOpen(false);
                    setActionError('');
                  }}
                  className="text-[#9CA3AF] hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleRoleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                    User: <span className="text-white">{selectedUser?.fullName || selectedUser?.name || selectedUser?.email}</span>
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#374151] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="organizer">Organizer</option>
                  </select>
                </div>

                {actionError && (
                  <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-400 text-sm">
                    {actionError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleModalOpen(false);
                      setActionError('');
                    }}
                    className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-[#374151] text-white rounded-lg hover:bg-[#374151] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Updating...' : 'Update Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
