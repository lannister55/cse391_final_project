import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';

// ── Status badge helpers ──────────────────────────────────────────────────────

const OFFER_STATUS_STYLES = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  COUNTERED: 'bg-blue-100   text-blue-800',
  ACCEPTED:  'bg-green-100  text-green-800',
  REJECTED:  'bg-red-100    text-red-800',
  EXPIRED:   'bg-gray-100   text-gray-500',
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
      OFFER_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700'
    }`}
  >
    {status}
  </span>
);

// ── NegotiatePage ─────────────────────────────────────────────────────────────

const NegotiatePage = () => {
  const { id }    = useParams();   // trip ID from URL
  const navigate  = useNavigate();
  const socketRef = useSocket();

  // Trip info
  const [trip,        setTrip]        = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripError,   setTripError]   = useState('');

  // Offers list
  const [offers,        setOffers]        = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  // Deal-confirmed banner
  const [dealConfirmed, setDealConfirmed] = useState(false);

  // Per-offer counter input values:  { [offerId]: amount }
  const [counterValues, setCounterValues] = useState({});

  // Per-offer loading flags for action buttons
  const [actionLoading, setActionLoading] = useState({});

  // Error messages per offer action
  const [actionErrors, setActionErrors] = useState({});

  // ── Fetch trip ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const { data } = await api.get(`/trips/${id}`);
        setTrip(data.trip);
      } catch (err) {
        setTripError(err.response?.data?.message || 'Failed to load trip.');
      } finally {
        setTripLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  // ── Fetch offers ────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data } = await api.get(`/offers/${id}`);
        setOffers(data.offers);
      } catch {
        // fail silently — empty state shown instead
      } finally {
        setOffersLoading(false);
      }
    };
    fetchOffers();
  }, [id]);

  // ── Socket.io: join room and handle real-time events ─────────────────────

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('join-trip-room', id);

    // New offer arrived from a driver
    socket.on('offer-received', (newOffer) => {
      setOffers((prev) => {
        const exists = prev.some((o) => o._id === newOffer._id);
        return exists ? prev : [newOffer, ...prev];
      });
    });

    socket.on('counter-received', (updatedOffer) => {
      setOffers((prev) =>
        prev.map((o) => (o._id === updatedOffer._id ? updatedOffer : o))
      );
    });

    socket.on('offer-accepted', (data) => {
      const { offerId, offer: acceptedOffer, tripId: newTripId } = data || {};
      if (!offerId) return;

      setDealConfirmed(true);
      setOffers((prev) =>
        prev.map((o) =>
          o._id === offerId
            ? (acceptedOffer ?? { ...o, status: 'ACCEPTED' })
            : { ...o, status: o.status === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED' }
        )
      );
      // Redirect to trip status page after short delay
      if (newTripId) {
        setTimeout(() => {
          navigate(`/rider/trip-status/${newTripId}`);
        }, 2000);
      }
    });

    return () => {
      socket.emit('leave-trip-room', id);
      socket.off('offer-received');
      socket.off('counter-received');
      socket.off('offer-accepted');
    };
  }, [id, socketRef]);

  // ── Action helpers ────────────────────────────────────────────────────────

  const setLoading = (offerId, val) =>
    setActionLoading((prev) => ({ ...prev, [offerId]: val }));

  const setError = (offerId, msg) =>
    setActionErrors((prev) => ({ ...prev, [offerId]: msg }));

  /** Rider sends a counter-offer amount */
  const handleCounter = useCallback(async (offerId) => {
    const amount = parseFloat(counterValues[offerId]);
    if (!amount || amount <= 0) {
      setError(offerId, 'Enter a valid counter amount.');
      return;
    }
    setLoading(offerId, true);
    setError(offerId, '');
    try {
      const { data } = await api.post(`/offers/${offerId}/counter`, { amount });
      setOffers((prev) =>
        prev.map((o) => (o._id === offerId ? data.offer : o))
      );
      // Clear the input after submitting
      setCounterValues((prev) => ({ ...prev, [offerId]: '' }));
    } catch (err) {
      setError(offerId, err.response?.data?.message || 'Counter failed.');
    } finally {
      setLoading(offerId, false);
    }
  }, [counterValues]);

  /** Rider accepts an offer — deal is made */
  const handleAccept = useCallback(async (offerId) => {
    setLoading(offerId, true);
    setError(offerId, '');
    try {
      const { data } = await api.put(`/offers/${offerId}/accept`);
      setDealConfirmed(true);
      // Update all offers: accepted one + reject rest
      setOffers((prev) =>
        prev.map((o) =>
          o._id === offerId
            ? data.offer
            : { ...o, status: 'REJECTED' }
        )
      );
      // Navigate directly to trip status — don't wait solely on socket event
      if (data.trip?._id) {
        setTimeout(() => navigate(`/rider/trip-status/${data.trip._id}`), 1500);
      }
    } catch (err) {
      setError(offerId, err.response?.data?.message || 'Accept failed.');
    } finally {
      setLoading(offerId, false);
    }
  }, [navigate]);

  /** Rider rejects a single offer */
  const handleReject = useCallback(async (offerId) => {
    setLoading(offerId, true);
    setError(offerId, '');
    try {
      const { data } = await api.put(`/offers/${offerId}/reject`);
      setOffers((prev) =>
        prev.map((o) => (o._id === offerId ? data.offer : o))
      );
    } catch (err) {
      setError(offerId, err.response?.data?.message || 'Reject failed.');
    } finally {
      setLoading(offerId, false);
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/rider/dashboard')}
            className="text-green-700 hover:text-green-800 font-medium transition"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-green-700">Negotiate Fare</h1>
        </div>

        {/* Deal confirmed banner */}
        {dealConfirmed && (
          <div className="bg-green-500 text-white rounded-2xl px-6 py-4 text-center shadow-md">
            <p className="text-2xl font-bold mb-1">🎉 Deal Confirmed!</p>
            <p className="text-sm opacity-90">
              An offer has been accepted. Your driver is on the way!
            </p>
          </div>
        )}

        {/* Trip loading */}
        {tripLoading && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Trip error */}
        {!tripLoading && tripError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
            {tripError}
          </div>
        )}

        {/* Trip summary card */}
        {!tripLoading && !tripError && trip && (
          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <h2 className="text-base font-semibold text-gray-700">Trip Summary</h2>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Pickup</p>
                <p className="font-semibold text-gray-800 text-sm">
                  {trip.pickup?.name || `${trip.pickup?.lat}, ${trip.pickup?.lng}`}
                </p>
              </div>
              <span className="text-green-500 text-xl">→</span>
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Destination</p>
                <p className="font-semibold text-gray-800 text-sm">
                  {trip.destination?.name ||
                    `${trip.destination?.lat}, ${trip.destination?.lng}`}
                </p>
              </div>
            </div>

            <div className="flex gap-6 text-sm text-gray-600 border-t border-gray-50 pt-3">
              <span>
                <span className="text-gray-400">Distance:</span>{' '}
                <span className="font-medium">{trip.distanceKM} km</span>
              </span>
              <span>
                <span className="text-gray-400">Est. Fare:</span>{' '}
                <span className="font-medium text-green-700">{trip.estimatedFare} BDT</span>
              </span>
            </div>
          </div>
        )}

        {/* ── Offers section ─────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Driver Offers
            {offers.length > 0 && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                {offers.length}
              </span>
            )}
          </h2>

          {/* Offers loading */}
          {offersLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!offersLoading && offers.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-10 text-center">
              <p className="text-4xl mb-3">🚖</p>
              <p className="text-gray-500 font-medium">Waiting for driver offers...</p>
              <p className="text-sm text-gray-400 mt-1">
                Drivers will see your trip and send fare offers shortly.
              </p>
            </div>
          )}

          {/* Offer cards */}
          {!offersLoading && offers.length > 0 && (
            <div className="space-y-4">
              {offers.map((offer) => {
                const isOpen =
                  offer.status === 'PENDING' || offer.status === 'COUNTERED';
                const isRiderTurn = isOpen && offer.lastOfferedBy !== 'RIDER';
                const isLoading = actionLoading[offer._id];

                return (
                  <div
                    key={offer._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4"
                  >
                    {/* Driver info + amount */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {/* Driver avatar + name */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                            {offer.driverId?.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {offer.driverId?.name ?? 'Unknown Driver'}
                          </p>
                          {offer.driverId?.phone && (
                            <p className="text-xs text-gray-400">{offer.driverId.phone}</p>
                          )}
                        </div>

                        {/* Offer amount */}
                        <p className="text-3xl font-bold text-green-700">
                          {offer.amount}{' '}
                          <span className="text-sm font-normal text-gray-400">BDT</span>
                        </p>

                        {/* Optional driver message */}
                        {offer.message && (
                          <p className="text-sm text-gray-500 italic mt-1">
                            "{offer.message}"
                          </p>
                        )}
                      </div>

                      <StatusBadge status={offer.status} />
                    </div>

                    {/* Per-offer action error */}
                    {actionErrors[offer._id] && (
                      <p className="text-xs text-red-600">{actionErrors[offer._id]}</p>
                    )}

                    {/* Action buttons — only shown for actionable offers */}
                    {isOpen && !dealConfirmed && !isRiderTurn && (
                      <p className="text-sm text-blue-700 bg-blue-50 rounded-xl px-3 py-2">
                        Waiting for the driver to respond to your counter.
                      </p>
                    )}

                    {isRiderTurn && !dealConfirmed && (
                      <div className="space-y-3 border-t border-gray-50 pt-4">

                        {/* Counter offer input + button */}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={counterValues[offer._id] ?? ''}
                            onChange={(e) =>
                              setCounterValues((prev) => ({
                                ...prev,
                                [offer._id]: e.target.value,
                              }))
                            }
                            placeholder="Your counter amount"
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                          />
                          <button
                            onClick={() => handleCounter(offer._id)}
                            disabled={isLoading}
                            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                          >
                            Counter
                          </button>
                        </div>

                        {/* Accept / Reject */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAccept(offer._id)}
                            disabled={isLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-2 rounded-xl transition text-sm"
                          >
                            {isLoading ? 'Processing...' : '✓ Accept'}
                          </button>
                          <button
                            onClick={() => handleReject(offer._id)}
                            disabled={isLoading}
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold py-2 rounded-xl transition text-sm"
                          >
                            {isLoading ? 'Processing...' : '✕ Reject'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NegotiatePage;
