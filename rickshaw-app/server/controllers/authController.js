import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/* ─── Helper ───────────────────────────────────────────────────── */

/**
 * Sign a JWT for the given user.
 * Payload: { id, role } — expires in 7 days.
 */
const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

/** Public-safe user shape returned to the client. */
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

/* ─── Controllers ──────────────────────────────────────────────── */

/**
 * POST /api/auth/register
 * Create a new user account and return a JWT.
 */
const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Prevent duplicate accounts
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Hash password before storing
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, phone, passwordHash, role });

    const token = signToken(user);

    return res.status(201).json({ user: publicUser(user), token });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
};

/**
 * POST /api/auth/login
 * Authenticate an existing user and return a JWT.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Block check — must come before password check for security UX
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);

    return res.status(200).json({ user: publicUser(user), token });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed.', error: err.message });
  }
};

/**
 * GET /api/auth/me  (protected)
 * Return the currently authenticated user's profile.
 */
const getMe = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user.id).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Could not fetch user.', error: err.message });
  }
};

export { register, login, getMe };
