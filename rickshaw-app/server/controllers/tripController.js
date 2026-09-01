import TripRequest from '../models/TripRequest.js';
import { calculateDistance, calculateOSRMRoute, estimateFare as calcFare } from '../services/fareService.js';

const BASE_FARE    = 30;
const RATE_PER_KM  = 15;

/**
 * POST /api/fare/estimate
 * Public — no auth required.
 * Body: { pickup: { lat, lng }, destination: { lat, lng } }
 */
export const estimateFare = async (req, res) => {
  try {
    const { pickup, destination } = req.body;

    if (
      !pickup?.lat || !pickup?.lng ||
      !destination?.lat || !destination?.lng
    ) {
      return res.status(400).json({ message: 'pickup and destination coordinates are required.' });
    }

    const { distanceKM, routeGeometry } = await calculateOSRMRoute(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const estimatedFare = calcFare(distanceKM);

    return res.status(200).json({
      distanceKM,
      estimatedFare,
      routeGeometry,
      baseFare:   BASE_FARE,
      ratePerKM:  RATE_PER_KM,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Fare estimation failed.', error: err.message });
  }
};

/**
 * POST /api/trips
 * Protected — RIDER only.
 * Body: { pickup: { name, lat, lng }, destination: { name, lat, lng } }
 */
export const createTrip = async (req, res) => {
  try {
    const { pickup, destination } = req.body;

    if (
      !pickup?.lat || !pickup?.lng ||
      !destination?.lat || !destination?.lng
    ) {
      return res.status(400).json({ message: 'pickup and destination coordinates are required.' });
    }

    const { distanceKM } = await calculateOSRMRoute(pickup.lat, pickup.lng, destination.lat, destination.lng);
    const estimatedFare = calcFare(distanceKM);

    const trip = await TripRequest.create({
      riderId: req.user.id,
      pickup,
      destination,
      distanceKM,
      estimatedFare,
    });

    // Populate rider info so drivers see the name immediately
    await trip.populate('riderId', 'name phone');

    // Broadcast to ALL connected drivers so their dashboard updates instantly
    const { getIO } = await import('../socket/io.js');
    const io = getIO();
    if (io) {
      io.emit('new-trip', { trip });
    }

    return res.status(201).json({ trip });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create trip.', error: err.message });
  }
};

/**
 * GET /api/trips/my
 * Protected — RIDER only.
 * Returns all trips belonging to the logged-in rider.
 */
export const getMyTrips = async (req, res) => {
  try {
    const trips = await TripRequest.find({ riderId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('riderId', 'name email');

    return res.status(200).json({ trips });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch trips.', error: err.message });
  }
};

/**
 * GET /api/trips
 * Protected — DRIVER only.
 * Returns trips still open for offers (PENDING or NEGOTIATING).
 */
export const getAvailableTrips = async (req, res) => {
  try {
    const trips = await TripRequest.find({
      status: { $in: ['PENDING', 'NEGOTIATING'] },
    })
      .sort({ createdAt: -1 })
      .populate('riderId', 'name phone');

    return res.status(200).json({ trips });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch available trips.', error: err.message });
  }
};

/**
 * GET /api/trips/:id
 * Protected — any authenticated user.
 */
export const getTripById = async (req, res) => {
  try {
    const trip = await TripRequest.findById(req.params.id)
      .populate('riderId', 'name phone email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    return res.status(200).json({ trip });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch trip.', error: err.message });
  }
};
