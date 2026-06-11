import express from 'express';
import { getAllFoods, searchFoods, getFoodById, proposeFood } from '../controllers/foodController.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/all', getAllFoods);
router.get('/search', searchFoods);
router.get('/:foodId', getFoodById);

// Rute Baru untuk Pengajuan Makanan Kustom (Butuh Login)
router.post('/propose', authenticateToken, proposeFood);

export default router;