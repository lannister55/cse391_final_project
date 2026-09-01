import express from 'express';
import auth from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import {
  getDashboardStats,
  getAllUsers,
  toggleUserBlock,
  toggleDriverVerification,
  getAllTrips,
  seedAdmin,
} from '../controllers/adminController.js';

const router = express.Router();

// Helper to seed/bootstrap admin account (public endpoint for initial setup/demo)
router.post('/seed-admin', seedAdmin);

// All other admin routes require JWT and ADMIN role
router.use(auth, allowRoles('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/block', toggleUserBlock);
router.put('/drivers/:id/verify', toggleDriverVerification);
router.get('/trips', getAllTrips);

export default router;
