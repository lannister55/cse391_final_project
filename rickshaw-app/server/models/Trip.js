import mongoose from 'mongoose';

/**
 * Trip — represents an actual ongoing/completed trip after offer acceptance.
 * 
 * This is different from TripRequest (which is the initial request).
 * A Trip document is created when a rider accepts a driver's offer.
 */
const tripSchema = new mongoose.Schema({
  tripRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TripRequest',
    required: [true, 'Trip Request ID is required'],
  },

  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rider ID is required'],
  },

  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver ID is required'],
  },

  agreedFare: {
    type: Number,
    required: [true, 'Agreed fare is required'],
  },

  actualFare: {
    type: Number,
    default: null,
  },

  status: {
    type: String,
    enum: ['ACCEPTED', 'DRIVER_ARRIVING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'ACCEPTED',
  },

  startTime: {
    type: Date,
    default: null,
  },

  endTime: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;