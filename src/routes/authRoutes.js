import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', register);

// Login
router.post('/login', login);

// Get Profile (requires auth)
router.get('/profile', authenticateToken, getProfile);

// Update Profile (requires auth) - BARU
router.put('/profile', authenticateToken, updateProfile);

export default router;