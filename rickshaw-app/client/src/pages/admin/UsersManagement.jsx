import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [blockFilter, setBlockFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (search) params.search = search;
      if (blockFilter !== '') params.isBlocked = blockFilter;

      const res = await api.get('/admin/users', { params });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.message || 'Could not fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, blockFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const showToast = (msg, isError = false) => {
    setNotification({ message: msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  // Toggle user block status
  const handleToggleBlock = async (userId, currentBlockedStatus, userName) => {
    setActionLoadingId(userId);
    try {
      const res = await api.put(`/admin/users/${userId}/block`);
      if (res.data.success) {
        const newStatus = res.data.user.isBlocked;
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isBlocked: newStatus } : u))
        );
        showToast(`User ${userName} has been ${newStatus ? 'blocked' : 'unblocked'}.`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle driver verification status
  const handleToggleVerify = async (driverId, currentVerifiedStatus, driverName) => {
    setActionLoadingId(driverId);
    try {
      const res = await api.put(`/admin/drivers/${driverId}/verify`);
      if (res.data.success) {
        const newStatus = res.data.driver.isVerified;
        setUsers((prev) =>
          prev.map((u) => (u._id === driverId ? { ...u, isVerified: newStatus } : u))
        );
        showToast(`Driver ${driverName} verification ${newStatus ? 'approved' : 'revoked'}.`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification update failed', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AdminLayout
      title="User Directory & Access Controls"
      subtitle="Inspect accounts, grant driver licenses, and restrict fraudulent users."
    >
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-premium border text-sm font-semibold flex items-center gap-2 animate-bounce ${
            notification.isError
              ? 'bg-red-950/90 border-red-800 text-red-200'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}
        >
          <span>{notification.isError ? '⚠️' : '✅'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-6 rounded-3xl mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex gap-2">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary text-white font-bold rounded-2xl text-xs hover:shadow-glow-primary transition shrink-0"
            >
              Search
            </button>
          </form>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-2xl border border-slate-800 w-full md:w-auto overflow-x-auto">
            {['ALL', 'RIDER', 'DRIVER', 'ADMIN'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  roleFilter === role
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="w-full md:w-auto bg-slate-950/60 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option value="">All Account States</option>
            <option value="false">Active Only</option>
            <option value="true">Blocked Only</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/80 border border-red-800 text-red-300 text-sm p-4 rounded-2xl">
          ⚠️ {error}
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-800/80 flex justify-between items-center">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <span>👥</span> Registered Platform Users ({users.length})
          </h3>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="text-xs text-primary-400 hover:text-primary-300 font-bold flex items-center gap-1"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
            Loading user directory...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No users match the selected query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Driver Status</th>
                  <th className="py-3.5 px-4">Account State</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {users.map((u) => {
                  const isActionLoading = actionLoadingId === u._id;
                  const isDriver = u.role === 'DRIVER';
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <tr key={u._id} className="hover:bg-slate-800/30 transition">
                      {/* Name & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center font-bold text-slate-200">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 text-sm">{u.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              Joined {new Date(u.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-medium">{u.email}</div>
                        <div className="text-[11px] text-slate-400">{u.phone}</div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        {isAdmin ? (
                          <span className="bg-purple-950/80 text-purple-300 border border-purple-800/60 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full">
                            Admin
                          </span>
                        ) : isDriver ? (
                          <span className="bg-amber-950/80 text-amber-300 border border-amber-800/60 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full">
                            🚖 Driver
                          </span>
                        ) : (
                          <span className="bg-blue-950/80 text-blue-300 border border-blue-800/60 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full">
                            👤 Rider
                          </span>
                        )}
                      </td>

                      {/* Driver Verification */}
                      <td className="py-4 px-4">
                        {isDriver ? (
                          u.isVerified ? (
                            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
                              <span>✓</span> Verified
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
                              <span>⏳</span> Pending
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Block State */}
                      <td className="py-4 px-4">
                        {u.isBlocked ? (
                          <span className="bg-red-950/80 text-red-300 border border-red-800/60 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
                            <span>🚫</span> Blocked
                          </span>
                        ) : (
                          <span className="bg-emerald-950/40 text-emerald-400 text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 w-max">
                            <span>●</span> Active
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right space-x-2">
                        {/* Driver Verification Toggle */}
                        {isDriver && (
                          <button
                            onClick={() => handleToggleVerify(u._id, u.isVerified, u.name)}
                            disabled={isActionLoading}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                              u.isVerified
                                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            }`}
                          >
                            {u.isVerified ? 'Revoke License' : 'Verify Driver'}
                          </button>
                        )}

                        {/* Block/Unblock Toggle */}
                        {!isAdmin && (
                          <button
                            onClick={() => handleToggleBlock(u._id, u.isBlocked, u.name)}
                            disabled={isActionLoading}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                              u.isBlocked
                                ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                                : 'bg-red-950/80 hover:bg-red-900 text-red-300 border-red-800'
                            }`}
                          >
                            {u.isBlocked ? 'Unblock User' : 'Block User'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UsersManagement;
