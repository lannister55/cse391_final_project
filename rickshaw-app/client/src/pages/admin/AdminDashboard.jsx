import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentTrips(res.data.recentTrips || []);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError(err.response?.data?.message || 'Could not load statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold">Completed</span>;
      case 'CANCELLED':
        return <span className="bg-red-950/80 border border-red-800/60 text-red-300 text-xs px-2.5 py-1 rounded-full font-bold">Cancelled</span>;
      case 'ONGOING':
      case 'DRIVER_ARRIVING':
      case 'ACCEPTED':
        return <span className="bg-accent/20 border border-accent/40 text-cyan-300 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">Live / In Transit</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <AdminLayout
      title="System Overview"
      subtitle="Real-time monitoring of Dhaka fare negotiations, trips, and user base."
    >
      {/* Action Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-xs text-slate-400">
          Last Synced: <span className="text-slate-200 font-semibold">{new Date().toLocaleTimeString()}</span>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700 flex items-center gap-1.5 shadow-sm"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span>Refresh Metrics</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/80 border border-red-800 text-red-300 text-sm p-4 rounded-2xl flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchDashboardData} className="underline font-bold text-xs">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-900/60 rounded-3xl border border-slate-800/50"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* Total Users */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-primary-500/50 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Users</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{stats?.users?.total || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-2xl text-primary-400">
                  👥
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span>Riders: <strong className="text-slate-200">{stats?.users?.riders || 0}</strong></span>
                <span>Drivers: <strong className="text-slate-200">{stats?.users?.drivers || 0}</strong></span>
              </div>
            </div>

            {/* Total Trips */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-secondary/50 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Trips Commuted</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1">{stats?.trips?.total || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-secondary/20 border border-secondary/30 flex items-center justify-center text-2xl text-secondary">
                  🚖
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="text-emerald-400">✓ Completed: <strong>{stats?.trips?.completed || 0}</strong></span>
                <span className="text-cyan-400">⚡ Live: <strong>{stats?.trips?.active || 0}</strong></span>
              </div>
            </div>

            {/* Platform Revenue */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-accent/50 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Fare Volume</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1">৳ {stats?.financials?.totalRevenue || 0}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-2xl text-accent">
                  💰
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                <span>Completed Fare Settlements</span>
              </div>
            </div>

            {/* Quality & Ratings */}
            <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-yellow-500/50 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Commute Rating</p>
                  <h3 className="text-3xl font-extrabold text-white mt-1 flex items-center gap-1">
                    {stats?.feedback?.avgRating || 5.0} <span className="text-yellow-400 text-2xl">★</span>
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center text-2xl text-yellow-400">
                  ⭐
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                <span>Based on <strong>{stats?.feedback?.totalRatings || 0}</strong> verified reviews</span>
              </div>
            </div>

          </div>

          {/* Quick Actions & Detailed Modules */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* Quick Navigation Cards */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <span>⚡</span> Quick Management
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Direct shortcuts to perform critical administrative interventions and audits.
                </p>

                <div className="space-y-3">
                  <Link
                    to="/admin/users"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-all text-sm font-semibold text-slate-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">👥</span>
                      <div>
                        <div>Manage Users</div>
                        <div className="text-[11px] text-slate-400 font-normal">Block users, verify driver licenses</div>
                      </div>
                    </div>
                    <span className="text-primary-400 group-hover:translate-x-1 transition-transform">➔</span>
                  </Link>

                  <Link
                    to="/admin/trips"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-all text-sm font-semibold text-slate-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🚖</span>
                      <div>
                        <div>Inspect All Trips</div>
                        <div className="text-[11px] text-slate-400 font-normal">Audit routes, fare negotiations, cancellations</div>
                      </div>
                    </div>
                    <span className="text-primary-400 group-hover:translate-x-1 transition-transform">➔</span>
                  </Link>
                </div>
              </div>

              {/* Status summary */}
              <div className="mt-6 pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                  <div className="text-slate-400">Blocked Users</div>
                  <div className="font-extrabold text-red-400 mt-0.5">{stats?.users?.blocked || 0}</div>
                </div>
                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                  <div className="text-slate-400">Verified Drivers</div>
                  <div className="font-extrabold text-emerald-400 mt-0.5">{stats?.users?.verifiedDrivers || 0}</div>
                </div>
              </div>
            </div>

            {/* Recent Trip Activity Stream */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🕒</span> Recent Platform Commutes
                </h3>
                <Link to="/admin/trips" className="text-xs font-bold text-primary-400 hover:text-primary-300">
                  View All &rarr;
                </Link>
              </div>

              {recentTrips.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No trips recorded in the system yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3 font-semibold">Rider</th>
                        <th className="pb-3 font-semibold">Driver</th>
                        <th className="pb-3 font-semibold">Route</th>
                        <th className="pb-3 font-semibold">Fare</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {recentTrips.map((trip) => (
                        <tr key={trip._id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 font-medium text-slate-200">
                            {trip.riderId?.name || 'Rider'}
                          </td>
                          <td className="py-3 font-medium text-slate-200">
                            {trip.driverId?.name || 'Driver'}
                          </td>
                          <td className="py-3 max-w-[200px] truncate text-slate-400">
                            {trip.tripRequestId?.pickup?.name || 'Pickup'} ➔ {trip.tripRequestId?.destination?.name || 'Destination'}
                          </td>
                          <td className="py-3 font-bold text-emerald-400">
                            ৳ {trip.agreedFare}
                          </td>
                          <td className="py-3">
                            {getStatusBadge(trip.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
