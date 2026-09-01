import mongoose from 'mongoose';

/**
 * Rating — represents a rider's rating and review for a driver after trip completion.
 */
const ratingSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip ID is required'],
    unique: true, // One rating per trip
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

  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
  },

  review: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
ratingSchema.index({ driverId: 1, createdAt: -1 });
ratingSchema.index({ riderId: 1 });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;