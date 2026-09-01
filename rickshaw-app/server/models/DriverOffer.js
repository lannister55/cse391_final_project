import mongoose from 'mongoose';

/**
 * DriverOffer — represents a single price offer made by a driver for a trip.
 *
 * Lifecycle:
 *   PENDING   → driver sent offer, waiting for rider response
 *   COUNTERED → rider sent a counter-offer amount
 *   ACCEPTED  → rider accepted; all other offers for this trip become REJECTED
 *   REJECTED  → rider explicitly rejected, or auto-rejected when another offer accepted
 *   EXPIRED   → (future use) offer timed out
 */
const driverOfferSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TripRequest',
    required: [true, 'Trip ID is required'],
  },

  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver ID is required'],
  },

  amount: {
    type: Number,
    required: [true, 'Offer amount is required'],
  },

  message: {
    type: String,
    default: '',
  },

  status: {
    type: String,
    enum: ['PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING',
  },

  // Whose amount is currently on the table (so the other party can respond)
  lastOfferedBy: {
    type: String,
    enum: ['DRIVER', 'RIDER'],
    default: 'DRIVER',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const DriverOffer = mongoose.model('DriverOffer', driverOfferSchema);

export default DriverOffer;
