import { query } from '../config/database.js';

export const getAllFoods = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT food_id, name, calories_per_serving, protein_g, fat_g, carbs_g FROM foods WHERE is_approved = true ORDER BY name'
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get all foods error:', error);
    next(error);
  }
};

export const searchFoods = async (req, res, next) => {
  try {
    const { query: searchQuery } = req.query;

    if (!searchQuery || searchQuery.trim() === '') {
      return res.status(400).json({ message: 'Query pencarian tidak boleh kosong' });
    }

    const result = await query(
      `SELECT food_id, name, calories_per_serving, protein_g, fat_g, carbs_g 
       FROM foods 
       WHERE is_approved = true AND LOWER(name) LIKE LOWER($1)
       ORDER BY name
       LIMIT 20`,
      [`%${searchQuery}%`]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Search foods error:', error);
    next(error);
  }
};

export const getFoodById = async (req, res, next) => {
  try {
    const { foodId } = req.params;

    const result = await query(
      'SELECT food_id, name, calories_per_serving, protein_g, fat_g, carbs_g FROM foods WHERE food_id = $1 AND is_approved = true',
      [foodId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Makanan tidak ditemukan' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get food by ID error:', error);
    next(error);
  }
};

export default { getAllFoods, searchFoods, getFoodById };
