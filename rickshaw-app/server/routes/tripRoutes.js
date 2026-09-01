import { Router } from 'express';
import auth from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import {
  createTrip,
  getMyTrips,
  getAvailableTrips,
  getTripById,
} from '../controllers/tripController.js';
import {
  updateTripStatus,
  cancelTrip,
  getMyTrips as getMyStatusTrips,
  getTripById as getTripStatusById,
} from '../controllers/tripStatusController.js';

const router = Router();

// POST /api/trips — RIDER creates a new trip request
router.post('/', auth, allowRoles('RIDER'), createTrip);

// GET /api/trips/my — RIDER views their own trips  (must be before /:id)
router.get('/my', auth, allowRoles('RIDER'), getMyTrips);

// GET /api/trips — DRIVER views PENDING and NEGOTIATING trips
router.get('/', auth, allowRoles('DRIVER'), getAvailableTrips);

// ── Trip Status Flow Routes (Module 6) ────────────────────────────────────────

// GET /api/trips/status/my — Get my trips with status info
router.get('/status/my', auth, getMyStatusTrips);

// GET /api/trips/status/:id — Get single trip with status info
router.get('/status/:id', auth, getTripStatusById);

// GET /api/trips/:id — any authenticated user (must be AFTER specific status routes)
router.get('/:id', auth, getTripById);

// PUT /api/trips/:id/status — DRIVER updates trip status
router.put('/:id/status', auth, allowRoles('DRIVER'), updateTripStatus);

// PUT /api/trips/:id/cancel — RIDER cancels trip
router.put('/:id/cancel', auth, allowRoles('RIDER'), cancelTrip);

export default router;
