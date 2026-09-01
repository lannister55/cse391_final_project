import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: { type: String },
    lat:  { type: Number },
    lng:  { type: Number },
  },
  { _id: false }
);

const tripRequestSchema = new mongoose.Schema({
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rider ID is required'],
  },

  pickup: {
    type: locationSchema,
  },

  destination: {
    type: locationSchema,
  },

  requestedTime: {
    type: Date,
    default: Date.now,
  },

  distanceKM: {
    type: Number,
    default: 0,
  },

  estimatedFare: {
    type: Number,
    default: 0,
  },

  status: {
    type: String,
    enum: ['PENDING', 'MATCHED', 'NEGOTIATING', 'ACCEPTED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TripRequest = mongoose.model('TripRequest', tripRequestSchema);

export default TripRequest;
