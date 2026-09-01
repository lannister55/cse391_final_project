import { useNavigate } from 'react-router-dom';

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

// ── TripCard ─────────────────────────────────────────────────────────────────

const TripCard = ({ trip }) => {
  const navigate = useNavigate();
  const rider = trip.riderId;

  return (
    <div className="glass-panel dark:bg-slate-900/60 bg-white/80 border border-slate-200 dark:border-slate-800/80 p-6 rounded-3xl relative overflow-hidden group hover:border-primary-500/50 dark:hover:border-primary-500/30 transition-all duration-300 transform hover:-translate-y-1 flex flex-col md:flex-row justify-between gap-6 shadow-sm hover:shadow-md">
      
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      <div className="space-y-5 flex-1 relative z-10">
        {/* Route Timeline Visual */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1.5 mt-1">
            <div className="w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            <div className="w-0.5 h-10 bg-slate-300 dark:bg-slate-700" />
            <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
          </div>
          
          <div className="space-y-4 flex-1 min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Pickup Point</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-base truncate">
                {trip.pickup?.name || `${trip.pickup?.lat}, ${trip.pickup?.lng}`}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Destination</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-base truncate">
                {trip.destination?.name || `${trip.destination?.lat}, ${trip.destination?.lng}`}
              </p>
            </div>
          </div>
        </div>

        {/* Distance & Fare */}
        <div className="flex flex-wrap gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl shadow-inner">
            <span>📏</span>
            <span>{trip.distanceKM} KM</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl shadow-inner">
            <span>💵</span>
            <span>Est. {trip.estimatedFare} BDT</span>
          </div>
          
          {rider && typeof rider === 'object' && (
            <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-xl shadow-inner">
              <span>👤</span>
              <span>{rider.name}</span>
            </div>
          )}
          
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] self-center ml-auto bg-slate-100 dark:bg-slate-900/40 px-2 py-1 rounded-lg">{formatDate(trip.createdAt)}</span>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex md:flex-col justify-between items-end gap-3 md:border-l border-slate-200 dark:border-slate-800/60 md:pl-6 relative z-10 shrink-0">
        <StatusBadge status={trip.status} />
        
        <button
          onClick={() => navigate(`/driver/trip/${trip._id}`)}
          className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-md dark:shadow-glow-primary w-full text-center whitespace-nowrap uppercase tracking-wider"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default TripCard;
