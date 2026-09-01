import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  PENDING:     'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
  MATCHED:     'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
  NEGOTIATING: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
  ACCEPTED:    'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
  ONGOING:     'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 animate-pulse',
  COMPLETED:   'bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60',
  CANCELLED:   'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60',
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-full ${
      STATUS_STYLES[status] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${
      status === 'PENDING' ? 'bg-amber-500' :
      status === 'MATCHED' ? 'bg-emerald-500' :
      status === 'NEGOTIATING' ? 'bg-purple-500' :
      status === 'ACCEPTED' ? 'bg-blue-500' :
      status === 'ONGOING' ? 'bg-cyan-500' :
      status === 'COMPLETED' ? 'bg-slate-400' : 'bg-red-500'
    }`} />
    {status}
  </span>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ── Component ─────────────────────────────────────────────────────────────────

const RiderDashboard = () => {
  const { user, logout }    = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate            = useNavigate();
  const [trips,  setTrips]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data } = await api.get('/trips/my');
        setTrips(data.trips);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load trips.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const totalTrips = trips.length;
  const completedTrips = trips.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-midnight text-slate-900 dark:text-slate-100 p-4 md:p-8 relative overflow-hidden flex flex-col transition-colors duration-500">
      
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary-600/15 rounded-full filter blur-3xl pointer-events-none animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl pointer-events-none animate-blob animation-delay-2000"></div>

      {/* Floating Glass Header (Full width top) */}
      <header className="max-w-7xl mx-auto w-full glass-panel dark:bg-slate-900/60 bg-white/80 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 relative overflow-hidden shadow-premium mb-8 z-10 border border-slate-200 dark:border-slate-800/80">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary-500/50 rounded-tl-3xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-secondary/50 rounded-br-3xl"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-primary-600 to-secondary text-white rounded-2xl flex items-center justify-center text-3xl shadow-glow-primary relative overflow-hidden">
            <span className="relative z-10">🚖</span>
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Rider Dashboard</h1>
            <p className="text-primary-600 dark:text-primary-300 text-sm font-medium">Welcome back, {user?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
          <button
            onClick={() => navigate('/rider/request-trip')}
            className="bg-gradient-to-r from-primary-600 to-secondary text-white font-extrabold px-5 py-3 rounded-2xl transition-all shadow-md hover:scale-105 text-xs uppercase tracking-wider flex items-center gap-2"
          >
            <span>➕</span> Request Ride
          </button>
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all font-bold text-xl"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={logout}
            className="bg-white dark:bg-slate-900/80 hover:bg-red-50 dark:hover:bg-red-950/80 text-red-600 dark:text-slate-300 dark:hover:text-red-300 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 font-bold px-5 py-3 rounded-2xl transition-all shadow-sm text-xs"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT SIDEBAR */}
        <aside className="lg:col-span-1 space-y-6 hidden lg:block">
          <div className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary-600 to-secondary flex items-center justify-center text-3xl text-white font-extrabold shadow-md mb-4">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">{user?.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{user?.email}</p>
              <span className="mt-3 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">
                Gold Member
              </span>
            </div>
            
            <div className="pt-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Total Commutes</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{totalTrips}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Completed</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{completedTrips}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN (Main Content) */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-primary-500 dark:text-primary-400">⚡</span> Your Commutes
            </h2>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => navigate('/rider/request-trip')}
                className="bg-gradient-to-r from-primary-600 to-secondary hover:from-primary-500 hover:to-secondary-light text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 uppercase tracking-wider hover:scale-105"
              >
                <span>➕</span> Request New Ride
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-primary-600 dark:text-primary-400 font-bold hover:text-primary-700 dark:hover:text-primary-300"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin shadow-glow-primary" />
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-200 rounded-2xl px-5 py-4 text-sm flex items-center gap-3">
              <span className="text-xl">⚠️</span> {error}
            </div>
          )}

          {!loading && !error && trips.length === 0 && (
            <div className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 text-center relative overflow-hidden group shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-6xl mb-6 relative z-10 animate-bounce">🗺️</div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 relative z-10">No trips requested yet</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-8 relative z-10">
                Ready to travel? Input your destination and negotiate fares directly with drivers for the best rates.
              </p>
              <button
                onClick={() => navigate('/rider/request-trip')}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-md relative z-10"
              >
                Start Your First Request
              </button>
            </div>
          )}

          {!loading && !error && trips.length > 0 && (
            <div className="grid gap-5">
              {trips.map((trip) => (
                <div
                  key={trip._id}
                  className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 p-6 rounded-3xl relative overflow-hidden group hover:border-primary-500/50 dark:hover:border-primary-500/30 transition-all duration-300 transform hover:-translate-y-1 flex flex-col md:flex-row justify-between gap-6 shadow-sm hover:shadow-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                  <div className="space-y-5 flex-1 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1.5 mt-1">
                        <div className="w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        <div className="w-0.5 h-10 bg-slate-300 dark:bg-slate-700" />
                        <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
                      </div>
                      
                      <div className="space-y-4 flex-1 min-w-0">
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">Pickup Point</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-base truncate">
                            {trip.pickup?.name || `${trip.pickup?.lat}, ${trip.pickup?.lng}`}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">Destination</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-base truncate">
                            {trip.destination?.name || `${trip.destination?.lat}, ${trip.destination?.lng}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl shadow-inner">
                        <span>📏</span>
                        <span>{trip.distanceKM} km</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl shadow-inner">
                        <span>💵</span>
                        <span>Est. {trip.estimatedFare} BDT</span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] ml-auto bg-slate-100 dark:bg-slate-900/40 px-2 py-1 rounded-lg">
                        {formatDate(trip.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-between items-end gap-4 md:border-l md:border-slate-200 dark:md:border-slate-800/60 md:pl-6 relative z-10 shrink-0">
                    <StatusBadge status={trip.status} />

                    {(trip.status === 'NEGOTIATING' || trip.status === 'PENDING') ? (
                      <Link
                        to={`/rider/trip/${trip._id}/negotiate`}
                        className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-md dark:shadow-glow-primary w-full md:w-auto text-center whitespace-nowrap uppercase tracking-wider"
                      >
                        {trip.status === 'NEGOTIATING' ? '💬 Negotiate' : '🔍 View Offers'}
                      </Link>
                    ) : trip.status === 'ACCEPTED' || trip.status === 'DRIVER_ARRIVING' || trip.status === 'ONGOING' ? (
                       <Link
                        to={`/rider/trip-status/${trip._id}`}
                        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-400 border border-slate-300 dark:border-slate-600 text-xs font-extrabold px-6 py-3.5 rounded-xl transition-all w-full md:w-auto text-center whitespace-nowrap uppercase tracking-wider shadow-sm"
                      >
                        View Status
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:col-span-1 space-y-6 hidden lg:block">
          
          {/* Quick Action Block */}
          <div className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 text-center shadow-sm hover:shadow-premium transition-shadow">
            <div className="text-4xl mb-4 animate-bounce">⚡</div>
            <h3 className="font-extrabold text-slate-800 dark:text-white mb-2">Need a Ride Now?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Bypass traffic. Name your price. Get picked up instantly.
            </p>
            <button
              onClick={() => navigate('/rider/request-trip')}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary text-white font-extrabold py-3.5 rounded-2xl shadow-md hover:scale-105 transition-transform"
            >
              Request Trip
            </button>
          </div>

          {/* Commute Alerts */}
          <div className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <span>🔔</span> Dhaka Alerts
            </h4>
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl flex gap-3 items-start">
                <span className="text-amber-500 text-lg">🌧️</span>
                <div>
                  <h5 className="font-bold text-amber-800 dark:text-amber-300 text-xs">Monsoon Alert</h5>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400/80 mt-0.5 leading-tight">
                    Heavy rain expected in Dhanmondi. Fares might surge slightly due to high demand.
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 p-3 rounded-xl flex gap-3 items-start">
                <span className="text-red-500 text-lg">🚦</span>
                <div>
                  <h5 className="font-bold text-red-800 dark:text-red-300 text-xs">Traffic Jam</h5>
                  <p className="text-[10px] text-red-700 dark:text-red-400/80 mt-0.5 leading-tight">
                    Avoid Airport Road if possible. Heavy congestion reported near Banani.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
};

export default RiderDashboard;
