import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import TripCard from './TripCard';
import useSocket from '../../hooks/useSocket';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DriverDashboard = () => {
  const { user, logout }      = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate               = useNavigate();
  const socketRef              = useSocket();
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // ── Fetch available (PENDING) trips on mount ──────────────────────────────────

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/trips');
      setTrips(data.trips);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load available trips.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // ── Real-time: listen for new trip requests from riders ───────────────────────

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('new-trip', ({ trip }) => {
      setTrips((prev) => {
        const exists = prev.some((t) => t._id === trip._id);
        return exists ? prev : [trip, ...prev];
      });
    });

    return () => {
      socket.off('new-trip');
    };
  }, [socketRef]);

  // ── Render ───────────────────────────────────────────────────────────────────

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
            <span className="relative z-10">🚦</span>
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Driver Dashboard</h1>
            <p className="text-primary-600 dark:text-primary-300 text-sm font-medium">Welcome back, {user?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto relative z-10">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all font-bold text-xl"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={logout}
            className="bg-white dark:bg-slate-900/80 hover:bg-red-50 dark:hover:bg-red-950/80 text-red-600 dark:text-slate-300 dark:hover:text-red-300 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 font-bold px-5 py-3 rounded-2xl transition-all shadow-sm"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div className="max-w-7xl mx-auto w-full relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT SIDEBAR (Driver Profile) */}
        <aside className="lg:col-span-1 space-y-6 hidden lg:block">
          <div className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-primary-600 flex items-center justify-center text-3xl text-white font-extrabold shadow-md mb-4">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">{user?.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{user?.email}</p>
              
              <div className="mt-3 flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full shadow-inner border border-amber-200 dark:border-amber-800/50">
                <span>⭐</span>
                <span className="font-extrabold text-xs">4.9 Rating</span>
              </div>
            </div>
            
            <div className="pt-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Earnings Today</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">0 BDT</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Total Trips</span>
                <span className="font-extrabold text-slate-900 dark:text-white">12</span>
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN (Live Feed) */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Open Requests</h2>
              <span className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold border border-emerald-200 dark:border-emerald-800/40 shadow-inner">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Live Feed
              </span>
            </div>
            <button
              onClick={fetchTrips}
              disabled={loading}
              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
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
            <div className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 text-center shadow-sm">
              <div className="text-6xl mb-6 animate-bounce">📭</div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">No requests nearby</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                We'll update automatically when riders nearby request a trip. Keep this window open!
              </p>
            </div>
          )}

          {!loading && !error && trips.length > 0 && (
            <div className="grid gap-5">
              {trips.map((trip) => (
                <TripCard key={trip._id} trip={trip} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR (Live Radar) */}
        <aside className="lg:col-span-1 space-y-6 hidden lg:block">
          
          <div className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
            <h4 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <span>📡</span> Dhaka Hot Zones
            </h4>
            
            {/* Interactive Leaflet Map for Hot Zones */}
            <div className="w-full h-48 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden relative mb-4 z-0">
              <MapContainer 
                center={[23.8103, 90.4125]} 
                zoom={11} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer 
                  url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
                  attribution="&copy; Google Maps"
                />
                
                {/* Gulshan High Demand (Red) */}
                <Circle 
                  center={[23.7925, 90.4078]} 
                  radius={1500} 
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.4 }} 
                />
                
                {/* Dhanmondi Moderate Demand (Amber) */}
                <Circle 
                  center={[23.7461, 90.3742]} 
                  radius={1200} 
                  pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.4 }} 
                />
              </MapContainer>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 p-3 rounded-xl">
                <h5 className="font-bold text-red-800 dark:text-red-300 text-xs">🔥 High Demand: Gulshan</h5>
                <p className="text-[10px] text-red-700 dark:text-red-400/80 mt-0.5">Surge pricing active. Lots of commuters.</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl">
                <h5 className="font-bold text-amber-800 dark:text-amber-300 text-xs">⚡ Moderate Demand: Dhanmondi</h5>
                <p className="text-[10px] text-amber-700 dark:text-amber-400/80 mt-0.5">Steady flow of students.</p>
              </div>
            </div>
          </div>
          
        </aside>

      </div>
    </div>
  );
};

export default DriverDashboard;
