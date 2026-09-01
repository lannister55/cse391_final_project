import { Router } from 'express';
import auth from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import {
  createRating,
  getDriverRatings,
  getMyRatings,
  getTripRating,
} from '../controllers/ratingController.js';

const router = Router();

// POST /api/ratings — RIDER submits a rating for a completed trip
router.post('/', auth, allowRoles('RIDER'), createRating);

// GET /api/ratings/my — RIDER views ratings they've given
router.get('/my', auth, allowRoles('RIDER'), getMyRatings);

// GET /api/ratings/driver/:driverId — Anyone can view a driver's ratings
router.get('/driver/:driverId', auth, getDriverRatings);

// GET /api/ratings/trip/:tripId — Get rating for a specific trip
router.get('/trip/:tripId', auth, getTripRating);

export default router;