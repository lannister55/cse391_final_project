import { Router } from 'express';
import { estimateFare } from '../controllers/tripController.js';

const router = Router();

// POST /api/fare/estimate — public, no auth required
router.post('/estimate', estimateFare);

export default router;
