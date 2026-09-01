import Trip from '../models/Trip.js';
import TripRequest from '../models/TripRequest.js';
import DriverOffer from '../models/DriverOffer.js';
import { getIO } from '../socket/io.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helper function to create trip when offer is accepted
// ─────────────────────────────────────────────────────────────────────────────
export const createTripFromOffer = async (offerId) => {
  try {
    const offer = await DriverOffer.findById(offerId).populate('tripId');
    if (!offer || offer.status !== 'ACCEPTED') {
      throw new Error('Offer not found or not accepted');
    }

    const tripRequest = offer.tripId;
    
    // Check if trip already exists for this trip request
    const existingTrip = await Trip.findOne({ tripRequestId: tripRequest._id });
    if (existingTrip) {
      return existingTrip;
    }

    // Create new trip
    const trip = await Trip.create({
      tripRequestId: tripRequest._id,
      riderId: tripRequest.riderId,
      driverId: offer.driverId,
      agreedFare: offer.amount,
      status: 'ACCEPTED',
    });

    // Update trip request status
    tripRequest.status = 'ACCEPTED';
    await tripRequest.save();

    return trip;
  } catch (error) {
    console.error('Error creating trip from offer:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/trips/:id/status
// Protected: DRIVER only (for status updates)
// Body: { status }
// ─────────────────────────────────────────────────────────────────────────────
export const updateTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['DRIVER_ARRIVING', 'ONGOING', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    const trip = await Trip.findById(id).populate('riderId').populate('driverId');
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify the request is from the assigned driver
    if (String(trip.driverId._id) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the assigned driver can update trip status' });
    }

    // Validate status transitions
    const currentStatus = trip.status;
    const validTransitions = {
      'ACCEPTED': ['DRIVER_ARRIVING'],
      'DRIVER_ARRIVING': ['ONGOING'],
      'ONGOING': ['COMPLETED'],
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${currentStatus} to ${status}` 
      });
    }

    // Update status and timestamps
    trip.status = status;
    if (status === 'ONGOING') {
      trip.startTime = new Date();
    } else if (status === 'COMPLETED') {
      trip.endTime = new Date();
    }

    await trip.save();

    // Emit real-time update to rider
    const io = getIO();
    if (io) {
      io.to(String(trip._id)).emit('trip-status-updated', {
        tripId: trip._id,
        status: trip.status,
        driverId: trip.driverId._id,
      });
    }

    return res.status(200).json({ trip, message: 'Trip status updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update trip status', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/trips/:id/cancel
// Protected: RIDER only (can cancel before ONGOING)
// ─────────────────────────────────────────────────────────────────────────────
export const cancelTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify the request is from the rider
    if (String(trip.riderId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the rider can cancel the trip' });
    }

    // Can only cancel before trip is ONGOING
    if (trip.status === 'ONGOING' || trip.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Cannot cancel an ongoing or completed trip' });
    }

    trip.status = 'CANCELLED';
    await trip.save();

    // Update trip request status
    await TripRequest.findByIdAndUpdate(trip.tripRequestId, { status: 'CANCELLED' });

    // Emit real-time update to driver
    const io = getIO();
    if (io) {
      io.to(String(trip._id)).emit('trip-cancelled', {
        tripId: trip._id,
        riderId: trip.riderId,
      });
    }

    return res.status(200).json({ trip, message: 'Trip cancelled successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to cancel trip', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/trips/my
// Protected: Returns trips for the authenticated user (rider or driver)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyTrips = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let trips;
    if (role === 'RIDER') {
      trips = await Trip.find({ riderId: userId })
        .populate('driverId', 'name phone')
        .populate('tripRequestId')
        .sort({ createdAt: -1 });
    } else if (role === 'DRIVER') {
      trips = await Trip.find({ driverId: userId })
        .populate('riderId', 'name phone')
        .populate('tripRequestId')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }

    return res.status(200).json({ trips });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch trips', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/trips/:id
// Protected: Get single trip details
// ─────────────────────────────────────────────────────────────────────────────
export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id)
      .populate('riderId', 'name phone')
      .populate('driverId', 'name phone')
      .populate('tripRequestId');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify user is part of this trip
    const userId = req.user.id;
    if (String(trip.riderId._id) !== String(userId) && 
        String(trip.driverId._id) !== String(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.status(200).json({ trip });
  } catch (err) {
    console.error('Error in getTripStatusById:', err);
    return res.status(500).json({ message: 'Failed to fetch trip', error: err.message });
  }
};