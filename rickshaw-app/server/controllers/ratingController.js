import Rating from '../models/Rating.js';
import Trip from '../models/Trip.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ratings
// Protected: RIDER only
// Body: { tripId, rating, review }
// ─────────────────────────────────────────────────────────────────────────────
export const createRating = async (req, res) => {
  try {
    const { tripId, rating, review } = req.body;

    if (!tripId || !rating) {
      return res.status(400).json({ message: 'tripId and rating are required.' });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }

    // Verify the trip exists and belongs to this rider
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    if (String(trip.riderId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You can only rate your own trips.' });
    }

    if (trip.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'You can only rate completed trips.' });
    }

    // Check if rating already exists for this trip
    const existingRating = await Rating.findOne({ tripId });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this trip.' });
    }

    // Create the rating
    const newRating = await Rating.create({
      tripId,
      riderId: req.user.id,
      driverId: trip.driverId,
      rating: parsedRating,
      review: review || '',
    });

    return res.status(201).json({ rating: newRating, message: 'Rating submitted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to submit rating', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ratings/driver/:driverId
// Protected: any authenticated user
// ─────────────────────────────────────────────────────────────────────────────
export const getDriverRatings = async (req, res) => {
  try {
    const { driverId } = req.params;

    const ratings = await Rating.find({ driverId })
      .populate('riderId', 'name')
      .populate('tripId', 'agreedFare createdAt')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    return res.status(200).json({ 
      ratings, 
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: ratings.length 
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch ratings', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ratings/my
// Protected: RIDER only - get ratings I've given
// ─────────────────────────────────────────────────────────────────────────────
export const getMyRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ riderId: req.user.id })
      .populate('driverId', 'name phone')
      .populate('tripId', 'agreedFare createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({ ratings });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch your ratings', error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ratings/trip/:tripId
// Protected: any authenticated user
// ─────────────────────────────────────────────────────────────────────────────
export const getTripRating = async (req, res) => {
  try {
    const { tripId } = req.params;

    const rating = await Rating.findOne({ tripId })
      .populate('riderId', 'name')
      .populate('driverId', 'name');

    if (!rating) {
      return res.status(404).json({ message: 'Rating not found for this trip' });
    }

    return res.status(200).json({ rating });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch rating', error: err.message });
  }
};