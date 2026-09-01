import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import useSocket from '../../hooks/useSocket';

// ── Status badges ─────────────────────────────────────────────────────────────

const TRIP_STATUS_STYLES = {
  PENDING:     'bg-yellow-100 text-yellow-800',
  MATCHED:     'bg-blue-100   text-blue-800',
  NEGOTIATING: 'bg-purple-100 text-purple-800',
  ACCEPTED:    'bg-indigo-100 text-indigo-800',
  ONGOING:     'bg-cyan-100   text-cyan-800',
  COMPLETED:   'bg-green-100  text-green-800',
  CANCELLED:   'bg-red-100    text-red-800',
};

const OFFER_STATUS_STYLES = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  COUNTERED: 'bg-blue-100   text-blue-800',
  ACCEPTED:  'bg-green-100  text-green-800',
  REJECTED:  'bg-red-100    text-red-800',
  EXPIRED:   'bg-gray-100   text-gray-500',
};

const StatusBadge = ({ status, styleMap }) => (
  <span
    className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${
      styleMap[status] ?? 'bg-gray-100 text-gray-700'
    }`}
  >
    {status}
  </span>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const offerDriverId = (offer) => offer.driverId?._id ?? offer.driverId;

const isWaitingForDriver = (offer) =>
  (offer.status === 'PENDING' || offer.status === 'COUNTERED') &&
  (offer.lastOfferedBy === 'RIDER' ||
    (offer.status === 'COUNTERED' && !offer.lastOfferedBy));

// ── TripDetail ────────────────────────────────────────────────────────────────

const TripDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket();
  const { user }  = useAuth();

  // Trip data
  const [trip,    setTrip]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Offer form state
  const [offerAmount,  setOfferAmount]  = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState('');
  const [offerSent,    setOfferSent]    = useState(false);

  // Driver counter-offer (after rider counters)
  const [counterAmount,   setCounterAmount]   = useState('');
  const [counterSubmitting, setCounterSubmitting] = useState(false);
  const [counterError,    setCounterError]    = useState('');

  // Existing offers list
  const [offers,       setOffers]       = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  // ── Fetch trip details ────────────────────────────────────────────────────

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const { data } = await api.get(`/trips/${id}`);
        setTrip(data.trip);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load trip details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [id]);

  // ── Fetch existing offers for this trip ───────────────────────────────────

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const { data } = await api.get(`/offers/${id}`);
        setOffers(data.offers);
      } catch {
        // Non-critical: fail silently, the list will just be empty
      } finally {
        setOffersLoading(false);
      }
    };
    fetchOffers();
  }, [id]);

  // ── Socket.io: join room and listen for real-time events ──────────────────

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Join the trip room so we receive events for this trip
    socket.emit('join-trip-room', id);

    // When the rider counters our offer, update the local list in real-time
    socket.on('counter-received', (updatedOffer) => {
      setOffers((prev) =>
        prev.map((o) => (o._id === updatedOffer._id ? updatedOffer : o))
      );
    });

    // When the rider accepts our offer
    socket.on('offer-accepted', (data) => {
      const { offerId, tripId: newTripId } = data || {};
      if (!offerId) return;
      
      setOffers((prev) =>
        prev.map((o) =>
          o._id === offerId
            ? { ...o, status: 'ACCEPTED' }
            : o._id !== offerId && o.status !== 'ACCEPTED'
            ? { ...o, status: 'REJECTED' }
            : o
        )
      );
      // Redirect to trip controls if we have the trip ID
      if (newTripId) {
        setTimeout(() => {
          navigate(`/driver/trip-controls/${newTripId}`);
        }, 2000);
      }
    });

    // When the rider rejects our offer
    socket.on('offer-rejected', ({ offerId, offer: rejectedOffer }) => {
      setOffers((prev) =>
        prev.map((o) =>
          o._id === offerId
            ? (rejectedOffer ?? { ...o, status: 'REJECTED' })
            : o
        )
      );
    });

    return () => {
      socket.emit('leave-trip-room', id);
      socket.off('counter-received');
      socket.off('offer-accepted');
      socket.off('offer-rejected');
    };
  }, [id, socketRef]);

  // ── Submit offer ──────────────────────────────────────────────────────────

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const parsedAmount = parseFloat(offerAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setSubmitError('Please enter a valid offer amount.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/offers', {
        tripId: id,
        amount: parsedAmount,
        message: offerMessage.trim(),
      });

      // Add new offer to top of list
      setOffers((prev) => [data.offer, ...prev]);
      setOfferSent(true);
      setOfferAmount('');
      setOfferMessage('');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to send offer.');
    } finally {
      setSubmitting(false);
    }
  };

  const myOffers = offers.filter((offer) =>
    String(offerDriverId(offer)) === String(user?.id)
  );
  const myActiveOffer = myOffers.find(
    (offer) => offer.status === 'PENDING' || offer.status === 'COUNTERED'
  );
  const canSendNewOffer = !myActiveOffer && trip && ['PENDING', 'NEGOTIATING'].includes(trip.status);

  const handleDriverCounter = async (e) => {
    e.preventDefault();
    if (!myActiveOffer) return;

    const parsedAmount = parseFloat(counterAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setCounterError('Please enter a valid counter amount.');
      return;
    }

    setCounterError('');
    setCounterSubmitting(true);
    try {
      const { data } = await api.post(`/offers/${myActiveOffer._id}/counter`, {
        amount: parsedAmount,
      });
      setOffers((prev) =>
        prev.map((o) => (o._id === myActiveOffer._id ? data.offer : o))
      );
      setCounterAmount('');
    } catch (err) {
      setCounterError(err.response?.data?.message || 'Failed to send counter offer.');
    } finally {
      setCounterSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back button */}
        <button
          onClick={() => navigate('/driver/dashboard')}
          className="flex items-center gap-1 text-green-700 hover:text-green-800 font-medium transition"
        >
          ← Back to Dashboard
        </button>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {/* Trip detail card */}
        {!loading && !error && trip && (
          <div className="bg-white rounded-2xl shadow p-6 space-y-6">

            {/* Title + status */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-green-700">Trip Details</h1>
              <StatusBadge status={trip.status} styleMap={TRIP_STATUS_STYLES} />
            </div>

            {/* Pickup & Destination */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600 uppercase tracking-wide font-semibold mb-1">Pickup</p>
                <p className="font-bold text-gray-800 text-sm">
                  {trip.pickup?.name || 'Unnamed location'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {trip.pickup?.lat}, {trip.pickup?.lng}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600 uppercase tracking-wide font-semibold mb-1">Destination</p>
                <p className="font-bold text-gray-800 text-sm">
                  {trip.destination?.name || 'Unnamed location'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {trip.destination?.lat}, {trip.destination?.lng}
                </p>
              </div>
            </div>

            {/* Distance & Fare */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-green-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Distance</p>
                <p className="text-3xl font-bold text-gray-800">{trip.distanceKM}</p>
                <p className="text-xs text-gray-400 mt-1">KM</p>
              </div>
              <div className="border border-green-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Est. Fare</p>
                <p className="text-3xl font-bold text-green-700">{trip.estimatedFare}</p>
                <p className="text-xs text-gray-400 mt-1">BDT</p>
              </div>
            </div>

            {/* Rider info */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Rider Info</p>
              {trip.riderId && typeof trip.riderId === 'object' ? (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-lg shrink-0">
                    {trip.riderId.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{trip.riderId.name}</p>
                    {trip.riderId.phone && (
                      <p className="text-sm text-gray-500">{trip.riderId.phone}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Rider info not available</p>
              )}
            </div>

            {/* Request time */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Request Time</p>
              <p className="text-sm text-gray-700 font-medium">{formatDate(trip.createdAt)}</p>
            </div>

          </div>
        )}

        {/* ── Make Offer Form ────────────────────────────────────────────────── */}
        {!loading && !error && trip && canSendNewOffer && (
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h2 className="text-lg font-bold text-green-700">Make an Offer</h2>

            {offerSent && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">
                ✅ Offer sent! Waiting for rider response...
              </div>
            )}

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offer Amount (BDT)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder={`e.g. ${trip.estimatedFare}`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="e.g. AC CNG, quick departure..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-base font-bold py-3 rounded-2xl shadow-md transition"
              >
                {submitting ? 'Sending...' : 'Send Offer'}
              </button>
            </form>
          </div>
        )}

        {/* ── Driver counter after rider responds ────────────────────────────── */}
        {!loading && !error && trip && myActiveOffer && isWaitingForDriver(myActiveOffer) && (
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h2 className="text-lg font-bold text-green-700">Rider Countered</h2>
            <p className="text-sm text-gray-600">
              The rider wants{' '}
              <span className="font-semibold text-green-700">{myActiveOffer.amount} BDT</span>.
              Send a new amount or wait for them to accept.
            </p>

            {counterError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {counterError}
              </div>
            )}

            <form onSubmit={handleDriverCounter} className="flex gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder="Your new amount"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
                required
              />
              <button
                type="submit"
                disabled={counterSubmitting}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl transition"
              >
                {counterSubmitting ? 'Sending...' : 'Counter'}
              </button>
            </form>
          </div>
        )}

        {!loading && !error && trip && myActiveOffer && !isWaitingForDriver(myActiveOffer) && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-5 py-4 text-sm font-medium">
            Offer sent. Waiting for the rider to counter or accept...
          </div>
        )}

        {/* ── My Offers for This Trip ────────────────────────────────────────── */}
        {!loading && !error && trip && (
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h2 className="text-lg font-bold text-green-700">My Offers</h2>

            {offersLoading && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!offersLoading && myOffers.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No offers sent yet. Use the form above to make your first offer.
              </p>
            )}

            {!offersLoading && myOffers.length > 0 && (
              <div className="space-y-3">
                {myOffers.map((offer) => (
                  <div
                    key={offer._id}
                    className="border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-green-700">
                        {offer.amount}{' '}
                        <span className="text-sm font-normal text-gray-400">BDT</span>
                      </p>
                      {offer.message && (
                        <p className="text-sm text-gray-500 italic">"{offer.message}"</p>
                      )}
                      {offer.lastOfferedBy && (
                        <p className="text-xs text-gray-500">
                          Last move: {offer.lastOfferedBy === 'RIDER' ? 'Rider' : 'You'}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">{formatDate(offer.createdAt)}</p>
                    </div>
                    <StatusBadge status={offer.status} styleMap={OFFER_STATUS_STYLES} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TripDetail;
