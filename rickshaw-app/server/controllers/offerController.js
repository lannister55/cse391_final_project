
import DriverOffer from '../models/DriverOffer.js';
import TripRequest from '../models/TripRequest.js';
import { getIO } from '../socket/io.js';
import { createTripFromOffer } from './tripStatusController.js';

const OPEN_TRIP_STATUSES = ['PENDING', 'NEGOTIATING'];

const idsEqual = (a, b) => String(a) === String(b);

const riderIdOf = (trip) => trip.riderId?._id ?? trip.riderId;

const toClientOffer = async (offerId) =>
  DriverOffer.findById(offerId).populate('driverId', 'name phone');

const emitToTrip = (tripId, event, payload) => {
  const io = getIO();
  if (io) {
    io.to(String(tripId)).emit(event, payload);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/offers
// Protected: DRIVER only
// Body: { tripId, amount, message }
// ─────────────────────────────────────────────────────────────────────────────
export const createOffer = async (req, res) => {
  try {
    const { tripId, amount, message } = req.body;

    if (!tripId || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'tripId and amount are required.' });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Offer amount must be a positive number.' });
    }

    const trip = await TripRequest.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    if (!OPEN_TRIP_STATUSES.includes(trip.status)) {
      return res.status(400).json({ message: 'This trip is no longer accepting offers.' });
    }

    const existingOffer = await DriverOffer.findOne({
      tripId,
      driverId: req.user.id,
      status: { $in: ['PENDING', 'COUNTERED'] },
    });

    if (existingOffer) {
      return res.status(400).json({
        message: 'You already have an active offer for this trip. Counter the existing one instead.',
      });
    }

    const offer = await DriverOffer.create({
      tripId,
      driverId: req.user.id,
      amount: parsedAmount,
      message: message || '',
      lastOfferedBy: 'DRIVER',
    });

    if (trip.status === 'PENDING') {
      trip.status = 'NEGOTIATING';
      await trip.save();
    }

    const populated = await toClientOffer(offer._id);
    emitToTrip(tripId, 'offer-received', populated);

    return res.status(201).json({ offer: populated });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create offer.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/offers/:tripId
// Protected: any authenticated user
// ─────────────────────────────────────────────────────────────────────────────
export const getOffersByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const offers = await DriverOffer.find({ tripId })
      .populate('driverId', 'name phone')
      .sort({ createdAt: -1 });

    return res.status(200).json({ offers });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch offers.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/offers/:offerId/counter
// Protected: RIDER or DRIVER
// Body: { amount }
// Rider counters a driver offer; driver counters back after the rider.
// ─────────────────────────────────────────────────────────────────────────────
export const counterOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { amount } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ message: 'Counter amount is required.' });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Counter amount must be a positive number.' });
    }

    const offer = await DriverOffer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }

    if (!['PENDING', 'COUNTERED'].includes(offer.status)) {
      return res.status(400).json({ message: 'This offer can no longer be countered.' });
    }

    const trip = await TripRequest.findById(offer.tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    if (!OPEN_TRIP_STATUSES.includes(trip.status) && trip.status !== 'MATCHED') {
      return res.status(400).json({ message: 'This trip is no longer being negotiated.' });
    }

    const role = req.user.role;

    if (role === 'RIDER') {
      if (!idsEqual(riderIdOf(trip), req.user.id)) {
        return res.status(403).json({ message: 'You can only counter offers on your own trip.' });
      }
      if (offer.lastOfferedBy === 'RIDER') {
        return res.status(400).json({ message: 'Waiting for the driver to respond to your last counter.' });
      }
      offer.lastOfferedBy = 'RIDER';
    } else if (role === 'DRIVER') {
      if (!idsEqual(offer.driverId, req.user.id)) {
        return res.status(403).json({ message: 'You can only counter your own offer.' });
      }
      if (offer.lastOfferedBy !== 'RIDER') {
        return res.status(400).json({ message: 'Waiting for the rider to respond to your last offer.' });
      }
      offer.lastOfferedBy = 'DRIVER';
    } else {
      return res.status(403).json({ message: 'Only the rider or the offering driver can counter.' });
    }

    offer.amount = parsedAmount;
    offer.status = 'COUNTERED';
    await offer.save();

    const populated = await toClientOffer(offer._id);
    emitToTrip(offer.tripId, 'counter-received', populated);

    return res.status(200).json({ offer: populated });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to counter offer.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/offers/:offerId/accept
// Protected: RIDER only
// ─────────────────────────────────────────────────────────────────────────────
export const acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await DriverOffer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }

    if (!['PENDING', 'COUNTERED'].includes(offer.status)) {
      return res.status(400).json({ message: 'This offer can no longer be accepted.' });
    }

    const trip = await TripRequest.findById(offer.tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    if (!idsEqual(riderIdOf(trip), req.user.id)) {
      return res.status(403).json({ message: 'You can only accept offers on your own trip.' });
    }

    const tripId = trip._id;

    offer.status = 'ACCEPTED';
    await offer.save();

    await DriverOffer.updateMany(
      { tripId, _id: { $ne: offerId }, status: { $in: ['PENDING', 'COUNTERED'] } },
      { status: 'REJECTED' }
    );

    trip.status = 'ACCEPTED';
    await trip.save();

    // Create the actual trip document
    const tripDoc = await createTripFromOffer(offerId);

    const populated = await toClientOffer(offer._id);
    emitToTrip(tripId, 'offer-accepted', {
      offerId: offer._id,
      tripId,
      offer: populated,
      tripId: tripDoc._id, // Include the new trip ID
    });

    return res.status(200).json({ offer: populated, trip: tripDoc, message: 'Offer accepted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to accept offer.', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/offers/:offerId/reject
// Protected: RIDER only
// ─────────────────────────────────────────────────────────────────────────────
export const rejectOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await DriverOffer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }

    if (!['PENDING', 'COUNTERED'].includes(offer.status)) {
      return res.status(400).json({ message: 'This offer can no longer be rejected.' });
    }

    const trip = await TripRequest.findById(offer.tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    if (!idsEqual(riderIdOf(trip), req.user.id)) {
      return res.status(403).json({ message: 'You can only reject offers on your own trip.' });
    }

    offer.status = 'REJECTED';
    await offer.save();

    const populated = await toClientOffer(offer._id);
    emitToTrip(offer.tripId, 'offer-rejected', {
      offerId: offer._id,
      offer: populated,
    });

    return res.status(200).json({ offer: populated });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reject offer.', error: err.message });
  }
};
