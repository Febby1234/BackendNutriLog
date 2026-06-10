import express from 'express';
import authenticateToken from '../middleware/auth.js';
import { getDashboardSummary, getWeeklyStats } from '../controllers/dashboardController.js';

const router = express.Router();

// Middleware to require auth for all dashboard routes
router.use(authenticateToken);

// Get dashboard summary
router.get('/summary', getDashboardSummary);

// Get weekly stats
router.get('/weekly-stats', getWeeklyStats);

export default router;
