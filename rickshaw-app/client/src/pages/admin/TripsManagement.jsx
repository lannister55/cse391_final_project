import { useState, useEffect } from 'react';
import api from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

const TripsManagement = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/admin/trips', { params });
      if (res.data.success) {
        setTrips(res.data.trips);
      }
    } catch (err) {
      console.error('Failed to load trips:', err);
      setError(err.response?.data?.message || 'Could not fetch trip audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
            <span>🏁</span> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-red-950/80 border border-red-800/60 text-red-300 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
            <span>❌</span> Cancelled
          </span>
        );
      case 'ONGOING':
      case 'DRIVER_ARRIVING':
      case 'ACCEPTED':
        return (
          <span className="bg-accent/20 border border-accent/40 text-cyan-300 text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 animate-pulse">
            <span>⚡</span> {status.replace('_', ' ')}
          </span>
        );
      default:
        return <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <AdminLayout
      title="Trip Audits & Commute Records"
      subtitle="Inspect negotiated fares, route histories, and active passenger rides."
    >
      {/* Filters */}
      <div className="glass-panel p-6 rounded-3xl mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto p-1 bg-slate-950/60 rounded-2xl border border-slate-800">
          {['ALL', 'COMPLETED', 'CANCELLED', 'ONGOING', 'DRIVER_ARRIVING', 'ACCEPTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={fetchTrips}
          disabled={loading}
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700 flex items-center gap-1.5 shadow-sm shrink-0"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
          <span>Refresh Logs</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/80 border border-red-800 text-red-300 text-sm p-4 rounded-2xl">
          ⚠️ {error}
        </div>
      )}

      {/* Trips Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-800/80 flex justify-between items-center">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <span>🚖</span> Recorded Platform Commutes ({trips.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
            Loading commute audit records...
          </div>
        ) : trips.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No trips found for this filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Trip ID / Date</th>
                  <th className="py-3.5 px-4">Rider</th>
                  <th className="py-3.5 px-4">Driver</th>
                  <th className="py-3.5 px-4">Route Trajectory</th>
                  <th className="py-3.5 px-4">Distance & Fare</th>
                  <th className="py-3.5 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {trips.map((t) => {
                  const req = t.tripRequestId;
                  return (
                    <tr key={t._id} className="hover:bg-slate-800/30 transition">
                      
                      {/* Trip ID & Date */}
                      <td className="py-4 px-6">
                        <div className="font-mono text-slate-400 text-[11px]">
                          #{t._id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(t.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Rider */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-100">{t.riderId?.name || 'Unknown Rider'}</div>
                        <div className="text-[11px] text-slate-500">{t.riderId?.phone || t.riderId?.email || '—'}</div>
                      </td>

                      {/* Driver */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-1">
                          {t.driverId?.name || 'Unknown Driver'}
                          {t.driverId?.isVerified && (
                            <span className="text-[10px] text-emerald-400 font-bold" title="Verified Driver">✓</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{t.driverId?.phone || t.driverId?.email || '—'}</div>
                      </td>

                      {/* Route */}
                      <td className="py-4 px-4 max-w-[240px]">
                        <div className="flex items-center gap-1.5 truncate text-slate-200 font-medium">
                          <span className="text-emerald-400">●</span> {req?.pickup?.name || 'Pickup'}
                        </div>
                        <div className="flex items-center gap-1.5 truncate text-slate-400 text-[11px] mt-0.5">
                          <span className="text-red-400">🏁</span> {req?.destination?.name || 'Destination'}
                        </div>
                      </td>

                      {/* Distance & Fare */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-emerald-400 text-sm">
                          ৳ {t.agreedFare}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {req?.distanceKM ? `${req.distanceKM} km` : 'Standard route'}
                          {req?.estimatedFare && (
                            <span className="text-slate-500 ml-1">(Est: ৳{req.estimatedFare})</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-right">
                        {getStatusBadge(t.status)}
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

export default TripsManagement;
