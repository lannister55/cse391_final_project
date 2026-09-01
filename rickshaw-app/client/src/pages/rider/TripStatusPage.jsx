import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';
import TripStatusBar from '../../components/TripStatusBar';
import MapView from '../../components/MapView';
import RatingForm from '../../components/RatingForm';

const TripStatusPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket();

  const [trip, setTrip] = useState(null);
  const [tripRequest, setTripRequest] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const { data } = await api.get(`/trips/status/${id}`);
        setTrip(data.trip);
        
        // Use the already-populated tripRequestId object directly for the map preview
        if (data.trip.tripRequestId) {
          setTripRequest(data.trip.tripRequestId);
        }

        // Check if user has already rated this trip
        try {
          const ratingResponse = await api.get(`/ratings/trip/${id}`);
          setHasRated(true);
        } catch (ratingErr) {
          // Rating doesn't exist yet
          setHasRated(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load trip status.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join-trip-room', id);

    socket.on('trip-status-updated', ({ status, driverId }) => {
      setTrip((prev) => ({ ...prev, status }));
    });

    socket.on('trip-cancelled', () => {
      setTrip((prev) => ({ ...prev, status: 'CANCELLED' }));
    });

    socket.on('driver-location-update', ({ lat, lng }) => {
      setDriverLocation({ lat, lng });
    });

    return () => {
      socket.emit('leave-trip-room', id);
      socket.off('trip-status-updated');
      socket.off('trip-cancelled');
      socket.off('driver-location-update');
    };
  }, [id, socketRef]);

  const handleCancelTrip = async () => {
    if (!confirm('Are you sure you want to cancel this trip?')) return;

    setCancelling(true);
    try {
      await api.put(`/trips/${id}/cancel`);
      setTrip((prev) => ({ ...prev, status: 'CANCELLED' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel trip.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-500">Trip not found</p>
        </div>
      </div>
    );
  }

  const canCancel = trip.status === 'ACCEPTED' || trip.status === 'DRIVER_ARRIVING';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      
      {/* Left Panel: Details & Controls (scrollable on desktop) */}
      <div className="w-full md:w-[420px] bg-white border-r border-slate-100 flex flex-col justify-between shadow-lg z-10 shrink-0 md:h-screen md:overflow-y-auto">
        <div className="p-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/rider/dashboard')}
              className="text-primary-600 hover:text-primary-700 font-bold text-sm transition flex items-center gap-1"
            >
              ← Dashboard
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rider Mode</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Trip Status</h1>
            <p className="text-xs text-slate-500 font-semibold">ID: #{id.substring(0, 8)}</p>
          </div>

          {/* Trip Status Bar Progress Indicator */}
          <TripStatusBar status={trip.status} />

          {/* Details Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agreed Fare</span>
              <span className="text-2xl font-black text-emerald-600">{trip.agreedFare} BDT</span>
            </div>

            {/* Route visualizer */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <div className="w-0.5 h-6 bg-slate-200 border-dashed border" />
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              </div>
              <div className="space-y-2 flex-1 min-w-0 text-xs font-semibold text-slate-700">
                <div className="truncate"><span className="text-slate-400 font-normal">From:</span> {tripRequest?.pickup?.name}</div>
                <div className="truncate"><span className="text-slate-400 font-normal">To:</span> {tripRequest?.destination?.name}</div>
              </div>
            </div>
          </div>

          {/* Driver Card Info */}
          {trip.driverId ? (
            <div className="bg-gradient-to-tr from-primary-900 to-primary-800 rounded-2xl p-5 text-white space-y-3 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-200 relative z-10">Your Driver</p>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl font-bold border border-white/10">
                  {trip.driverId.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-bold text-base leading-tight">{trip.driverId.name}</p>
                  {trip.driverId.phone && (
                    <p className="text-xs text-primary-200 font-medium mt-0.5">📞 {trip.driverId.phone}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-5 text-amber-800 text-xs font-semibold flex items-center gap-2">
              <span>⏳</span> Waiting for driver assignment details...
            </div>
          )}

          {/* Time markers */}
          <div className="text-xs text-slate-500 font-medium space-y-1.5 pt-2 border-t border-slate-100">
            {trip.startTime && (
              <p>🏁 Started: {new Date(trip.startTime).toLocaleTimeString()}</p>
            )}
            {trip.endTime && (
              <p>🏁 Ended: {new Date(trip.endTime).toLocaleTimeString()}</p>
            )}
          </div>

          {/* Live Driver GPS Sync Indicator */}
          {['ACCEPTED', 'DRIVER_ARRIVING', 'ONGOING'].includes(trip.status) && (
            <div className="bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-bold rounded-2xl p-4 text-xs flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span>📡 Live Driver GPS Tracking Active</span>
              </div>
              <span className="text-[10px] bg-emerald-200 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Synced</span>
            </div>
          )}

          {/* Cancel button */}
          {canCancel && (
            <button
              onClick={handleCancelTrip}
              disabled={cancelling}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-red-500/10 hover:shadow-lg"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Ride'}
            </button>
          )}

          {/* Completion Message */}
          {trip.status === 'COMPLETED' && (
            <div className="bg-emerald-50 border border-emerald-200/50 text-emerald-800 rounded-2xl p-5 text-center">
              <p className="text-base font-extrabold mb-1">🏁 Ride Completed!</p>
              <p className="text-xs font-semibold text-emerald-600">The driver has arrived at your destination. Hope you had a safe journey!</p>
            </div>
          )}

          {/* Rating Form */}
          {trip.status === 'COMPLETED' && !hasRated && (
            <RatingForm 
              tripId={id} 
              driverId={trip.driverId?._id || trip.driverId}
              onRatingSubmitted={() => setHasRated(true)}
            />
          )}

          {/* Already Rated Message */}
          {trip.status === 'COMPLETED' && hasRated && (
            <div className="bg-blue-50 border border-blue-200/50 text-blue-800 rounded-2xl p-5 text-center">
              <p className="text-base font-extrabold mb-1">⭐ Rated Successfully</p>
              <p className="text-xs font-semibold text-blue-600">Your feedback helps improve RideNego.</p>
            </div>
          )}

          {/* Cancellation Message */}
          {trip.status === 'CANCELLED' && (
            <div className="bg-red-50 border border-red-200/50 text-red-800 rounded-2xl p-5 text-center">
              <p className="text-base font-extrabold mb-1">Ride Cancelled</p>
              <p className="text-xs font-semibold text-red-600">This trip request has been cancelled.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Immersive Fullscreen Map */}
      <div className="flex-1 h-[300px] md:h-screen relative z-0">
        {tripRequest && tripRequest.pickup && tripRequest.destination ? (
          <MapView 
            pickup={tripRequest.pickup} 
            destination={tripRequest.destination} 
            driverLocation={driverLocation}
            status={trip.status}
            height="100%"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-semibold">
            Loading route map...
          </div>
        )}
      </div>
    </div>
  );
};

export default TripStatusPage;