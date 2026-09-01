import mongoose from 'mongoose';

/**
 * User model — shared by Riders, Drivers and Admins.
 * The `role` field determines which dashboard they access.
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },

  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },

  role: {
    type: String,
    enum: ['RIDER', 'DRIVER', 'ADMIN'],
    default: 'RIDER',
  },

  // Admin can block a user from the platform
  isBlocked: {
    type: Boolean,
    default: false,
  },

  // Driver accounts need manual verification before accepting rides
  isVerified: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

export default User;
