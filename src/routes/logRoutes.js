import express from 'express';
import authenticateToken from '../middleware/auth.js';
import { addFoodLog, getTodayLog, getLogByDate, deleteLogItem } from '../controllers/logController.js';

const router = express.Router();

// Middleware to require auth for all log routes
router.use(authenticateToken);

// Add food to log
router.post('/add', addFoodLog);

// Get today's log
router.get('/today', getTodayLog);

// Get log by specific date
router.get('/:date', getLogByDate);

// Delete log item
router.delete('/:itemId', deleteLogItem);

export default router;
