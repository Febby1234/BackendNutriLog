import express from 'express';
import { getAllFoods, searchFoods, getFoodById } from '../controllers/foodController.js';

const router = express.Router();

// Get all foods
router.get('/all', getAllFoods);

// Search foods
router.get('/search', searchFoods);

// Get food by ID
router.get('/:foodId', getFoodById);

export default router;
