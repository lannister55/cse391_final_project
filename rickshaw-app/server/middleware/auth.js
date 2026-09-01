import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes by verifying the JWT Bearer token.
 * Attaches real-time user object from DB to req.user.
 */
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Expect "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch latest user state from DB to catch dynamic role updates & block status
    const dbUser = await User.findById(decoded.id).select('-passwordHash');
    if (!dbUser) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }
    if (dbUser.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked by administrator.' });
    }
    req.user = dbUser; // attach full Mongoose user object { id, _id, role, name, email... }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export default auth;
