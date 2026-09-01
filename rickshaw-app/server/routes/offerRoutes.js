import { Router } from 'express';
import auth from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import {
  createOffer,
  getOffersByTrip,
  counterOffer,
  acceptOffer,
  rejectOffer,
} from '../controllers/offerController.js';

const router = Router();

// POST /api/offers — driver submits a new price offer
router.post('/', auth, allowRoles('DRIVER'), createOffer);

// GET /api/offers/:tripId — fetch all offers for a trip
router.get('/:tripId', auth, getOffersByTrip);

// POST /api/offers/:offerId/counter — rider or driver sends a counter amount
router.post('/:offerId/counter', auth, allowRoles('RIDER', 'DRIVER'), counterOffer);

// PUT /api/offers/:offerId/accept — rider accepts an offer (deal made)
router.put('/:offerId/accept', auth, allowRoles('RIDER'), acceptOffer);

// PUT /api/offers/:offerId/reject — rider rejects a single offer
router.put('/:offerId/reject', auth, allowRoles('RIDER'), rejectOffer);

export default router;
