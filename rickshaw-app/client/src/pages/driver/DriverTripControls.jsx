import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';
import TripStatusBar from '../../components/TripStatusBar';
import MapView from '../../components/MapView';

const DriverTripControls = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket();

  const [trip, setTrip] = useState(null);
  const [tripRequest, setTripRequest] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const { data } = await api.get(`/trips/status/${id}`);
        setTrip(data.trip);
        
        // Use the already-populated tripRequestId object directly for the map
        if (data.trip.tripRequestId) {
          setTripRequest(data.trip.tripRequestId);
          // Initialize driver location to pickup for desktop testing if not available
          if (!driverLocation && data.trip.status !== 'PENDING' && data.trip.status !== 'ACCEPTED') {
            setDriverLocation({
              lat: Number(data.trip.tripRequestId.pickup.lat),
              lng: Number(data.trip.tripRequestId.pickup.lng)
            });
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load trip.');
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

    socket.on('trip-status-updated', ({ status }) => {
      setTrip((prev) => ({ ...prev, status }));
    });

    socket.on('trip-cancelled', () => {
      setTrip((prev) => ({ ...prev, status: 'CANCELLED' }));
    });

    return () => {
      socket.emit('leave-trip-room', id);
      socket.off('trip-status-updated');
      socket.off('trip-cancelled');
    };
  }, [id, socketRef]);

  // ── GPS Tracking for Module 9 ────────────────────────────────────────────────
  useEffect(() => {
    // If simulation has been done, do not revert back to the browser's real static GPS point
    if (!trip || !socketRef.current || isSimulating || hasSimulated) return;
    
    // Only track if driver is arriving or trip is ongoing
    const shouldTrack = trip.status === 'DRIVER_ARRIVING' || trip.status === 'ONGOING';
    if (!shouldTrack) return;

    if (!('geolocation' in navigator)) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = { lat: latitude, lng: longitude };
        setDriverLocation(newLoc);
        // Emit location update to the server
        socketRef.current.emit('update-location', {
          tripId: id,
          lat: latitude,
          lng: longitude,
        });
      },
      (err) => {
        console.warn('Geolocation error (normal on desktop):', err.message);
      },
      // Relax high accuracy to avoid desktop timeout locks
      { enableHighAccuracy: false, maximumAge: 10000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [trip?.status, id, socketRef, isSimulating]);

  // ── Live Movement Simulation (for desktop testing) ──────────────────────────
  useEffect(() => {
    if (!isSimulating || !tripRequest) return;

    let interval;
    let isActive = true;

    const startSimulation = async () => {
      try {
        const p = tripRequest.pickup;
        const d = tripRequest.destination;

        const pLat = Number(p.lat);
        const pLng = Number(p.lng);
        const dLat = Number(d.lat);
        const dLng = Number(d.lng);

        // Instantly snap to Pickup P
        const initLoc = { lat: pLat, lng: pLng };
        setDriverLocation(initLoc);
        if (socketRef.current) {
          socketRef.current.emit('update-location', {
            tripId: id,
            lat: pLat,
            lng: pLng,
          });
        }
        
        // Fetch real road route from OSRM
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (!isActive) return;

        let points = [{ lat: pLat, lng: pLng }];

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const rawCoords = data.routes[0].geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }));
          
          // Build smooth forward-only path from P to D
          for (const pt of rawCoords) {
            const lastPt = points[points.length - 1];
            const dist = Math.hypot(pt.lat - lastPt.lat, pt.lng - lastPt.lng);
            if (dist > 0.00005) { // filter out identical static jitter
              points.push(pt);
            }
          }
        }
        
        // Lock final point strictly to Destination D
        points.push({ lat: dLat, lng: dLng });

        let step = 0;
        const totalSteps = points.length;
        const stepSize = Math.max(1, Math.floor(totalSteps / 25)); 
        
        interval = setInterval(async () => {
          if (!isActive) return;

          step += stepSize;
          const isLastStep = step >= totalSteps - 1;
          const currentLoc = isLastStep ? { lat: dLat, lng: dLng } : points[step];
          
          setDriverLocation(currentLoc);
          setSimulationIndex(isLastStep ? 10 : Math.floor((step / totalSteps) * 10));

          if (socketRef.current) {
            socketRef.current.emit('update-location', {
              tripId: id,
              lat: currentLoc.lat,
              lng: currentLoc.lng,
            });
          }

          if (isLastStep) {
            clearInterval(interval);
            setIsSimulating(false);
            setHasSimulated(true);

            // Complete trip via API
            try {
              const { data: updatedTripData } = await api.put(`/trips/${id}/status`, { status: 'COMPLETED' });
              setTrip(updatedTripData.trip);
            } catch (e) {
              console.error("Error completing trip:", e);
            }
          }
        }, 600);

      } catch (err) {
        console.error("Simulation error:", err);
        setIsSimulating(false);
      }
    };

    startSimulation();

    return () => {
      isActive = false;
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, tripRequest?._id, id, socketRef]);

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/trips/${id}/status`, { status: newStatus });
      setTrip(data.trip);

      // Show driver marker immediately on desktop
      if (newStatus === 'DRIVER_ARRIVING' && !driverLocation && tripRequest) {
        const initLat = Number(tripRequest.pickup.lat);
        const initLng = Number(tripRequest.pickup.lng);
        setDriverLocation({ lat: initLat, lng: initLng });
        
        if (socketRef.current) {
          socketRef.current.emit('update-location', {
            tripId: id,
            lat: initLat,
            lng: initLng,
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
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

  const canMarkArriving = trip.status === 'ACCEPTED';
  const canStartTrip = trip.status === 'DRIVER_ARRIVING';
  const canCompleteTrip = trip.status === 'ONGOING';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      
      {/* Left Panel: Details & Controls */}
      <div className="w-full md:w-[420px] bg-white border-r border-slate-100 flex flex-col justify-between shadow-lg z-10 shrink-0 md:h-screen md:overflow-y-auto">
        <div className="p-6 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/driver/dashboard')}
              className="text-primary-600 hover:text-primary-700 font-bold text-sm transition flex items-center gap-1"
            >
              ← Dashboard
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Driver Mode</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Trip Controls</h1>
            <p className="text-xs text-slate-500 font-semibold">ID: #{id.substring(0, 8)}</p>
          </div>

          {/* Trip Status Bar */}
          <TripStatusBar status={trip.status} />

          {/* Trip Details Card */}
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

          {/* Rider Info Card */}
          {trip.riderId && (
            <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rider Information</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-bold text-base">
                  {trip.riderId.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{trip.riderId.name}</p>
                  {trip.riderId.phone && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">📞 {trip.riderId.phone}</p>
                  )}
                </div>
              </div>
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

          {/* Driver Actions Buttons */}
          <div className="space-y-3 pt-2">
            {canMarkArriving && (
              <button
                onClick={() => updateStatus('DRIVER_ARRIVING')}
                disabled={updating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl shadow-md shadow-blue-500/10 hover:shadow-lg transition-all"
              >
                {updating ? 'Updating...' : '🚗 Mark as Arriving'}
              </button>
            )}

            {canStartTrip && (
              <button
                onClick={() => updateStatus('ONGOING')}
                disabled={updating}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all"
              >
                {updating ? 'Updating...' : '▶️ Start Trip'}
              </button>
            )}

            {canCompleteTrip && (
              <button
                onClick={() => updateStatus('COMPLETED')}
                disabled={updating}
                className="w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl shadow-md transition-all animate-pulse"
              >
                {updating ? 'Updating...' : '✅ Complete Trip'}
              </button>
            )}

            {!canMarkArriving && !canStartTrip && !canCompleteTrip && (
              <div className="text-center text-slate-400 font-semibold text-xs py-2">
                No active actions available for this status.
              </div>
            )}
          </div>

          {/* Desktop GPS Simulator Panel */}
          {['ACCEPTED', 'DRIVER_ARRIVING', 'ONGOING'].includes(trip.status) && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3">
              <h3 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                💻 Desktop GPS Simulator
              </h3>
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                Simulate driver movement live from Pickup (P) → Driver Arriving → Destination (D).
              </p>
              <button
                disabled={updating || isSimulating}
                onClick={async () => {
                  if (isSimulating) return; // already running — button should be disabled, safety guard
                  setUpdating(true);
                  try {
                    // Step 1: ACCEPTED → DRIVER_ARRIVING (let rider see this state)
                    if (trip.status === 'ACCEPTED') {
                      const { data: d1 } = await api.put(`/trips/${id}/status`, { status: 'DRIVER_ARRIVING' });
                      setTrip(d1.trip);
                      // Wait 1.5s so rider's status bar shows DRIVER_ARRIVING
                      await new Promise((r) => setTimeout(r, 1500));
                    }
                    // Step 2: DRIVER_ARRIVING → ONGOING
                    if (trip.status === 'ACCEPTED' || trip.status === 'DRIVER_ARRIVING') {
                      const { data: d2 } = await api.put(`/trips/${id}/status`, { status: 'ONGOING' });
                      setTrip(d2.trip);
                    }
                  } catch (e) {
                    console.error('Sim status transition error:', e);
                    setUpdating(false);
                    return;
                  }
                  setUpdating(false);
                  setSimulationIndex(0);
                  setIsSimulating(true);
                }}
                className={`w-full font-bold py-3 px-3 text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 ${
                  isSimulating || updating
                    ? 'bg-slate-400 cursor-not-allowed text-white opacity-70'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
                }`}
              >
                {updating ? '⏳ Preparing...' : isSimulating ? '🔄 Simulating...' : '🚀 Start Simulated Movement'}
              </button>
              {isSimulating && (
                <div className="flex items-center justify-between text-[11px] text-blue-800 font-bold">
                  <span>Driving progress:</span>
                  <span>{simulationIndex * 10}%</span>
                </div>
              )}
            </div>
          )}

          {/* Completion Messages */}
          {trip.status === 'COMPLETED' && (
            <div className="bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-xl font-black mb-1">🏁 TRIP FINISHED!</p>
              <p className="text-xs font-semibold text-emerald-600">Taxi has arrived at destination (D point). The rider has been notified.</p>
            </div>
          )}

          {/* Cancellation Message */}
          {trip.status === 'CANCELLED' && (
            <div className="bg-red-50 border border-red-200/50 text-red-800 rounded-2xl p-5 text-center">
              <p className="text-base font-extrabold mb-1">Trip Cancelled</p>
              <p className="text-xs font-semibold text-red-600">The rider cancelled this trip request.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Fullscreen Map */}
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

export default DriverTripControls;