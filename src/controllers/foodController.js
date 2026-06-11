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

    // 1. Cari di Database Lokal (Supabase) terlebih dahulu
    const localResult = await query(
      `SELECT food_id, name, calories_per_serving, protein_g, fat_g, carbs_g 
       FROM foods 
       WHERE is_approved = true AND LOWER(name) LIKE LOWER($1)
       ORDER BY name LIMIT 15`,
      [`%${searchQuery}%`]
    );

    let foods = localResult.rows;

    // 2. Jika hasil lokal kurang dari 5, tembak API Eksternal (Open Food Facts)
    if (foods.length < 5) {
      try {
        // Menggunakan native fetch bawaan Node.js
        const extRes = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&search_simple=1&action=process&json=1&page_size=5`);
        
        if (extRes.ok) {
          const extData = await extRes.json();
          
          for (const p of extData.products) {
            // Pastikan produk dari internet memiliki nama dan data kalori yang valid
            if (p.product_name && p.nutriments && p.nutriments['energy-kcal_100g']) {
              const name = `${p.product_name} (Global)`;
              const cals = p.nutriments['energy-kcal_100g'] || 0;
              const prot = p.nutriments.proteins_100g || 0;
              const fat = p.nutriments.fat_100g || 0;
              const carbs = p.nutriments.carbohydrates_100g || 0;
              
              // Cek apakah makanan ini sudah pernah auto-save sebelumnya
              const checkRes = await query('SELECT food_id FROM foods WHERE name = $1', [name]);
              
              if (checkRes.rows.length === 0) {
                 // AUTO-SAVE: Masukkan ke database lokal agar sah digunakan oleh aplikasi Android
                 const insertRes = await query(
                   'INSERT INTO foods (name, calories_per_serving, protein_g, fat_g, carbs_g, is_approved) VALUES ($1, $2, $3, $4, $5, true) RETURNING food_id, name, calories_per_serving, protein_g, fat_g, carbs_g',
                   [name, cals, prot, fat, carbs]
                 );
                 foods.push(insertRes.rows[0]);
              } else {
                 // Jika sudah ada di DB tapi tidak masuk ke hasil lokal awal, tambahkan ke layar Android
                 if (!foods.find(f => f.food_id === checkRes.rows[0].food_id)) {
                    const getExisting = await query('SELECT food_id, name, calories_per_serving, protein_g, fat_g, carbs_g FROM foods WHERE food_id = $1', [checkRes.rows[0].food_id]);
                    foods.push(getExisting.rows[0]);
                 }
              }
            }
          }
        }
      } catch (apiError) {
        console.error('External API Error:', apiError);
        // Jika internet terputus atau API down, aplikasi tidak akan crash dan tetap mengembalikan data lokal
      }
    }

    res.status(200).json(foods);
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

// Tambahkan fungsi ini di dalam src/controllers/foodController.js
export const proposeFood = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { proposedFoodName, proposedCalories, proteinG, fatG, carbsG } = req.body;

    if (!proposedFoodName || proposedCalories === undefined) {
      return res.status(400).json({ message: 'Nama makanan dan kalori wajib diisi' });
    }

    const result = await query(
      `INSERT INTO food_proposals (proposed_food_name, proposed_calories, protein_g, fat_g, carbs_g, status, submitted_by)
       VALUES ($1, $2, $3, $4, $5, 'PENDING', $6)
       RETURNING *`,
      [proposedFoodName, proposedCalories, proteinG || 0, fatG || 0, carbsG || 0, userId]
    );

    res.status(201).json({
      message: 'Usulan makanan berhasil dikirim dan menunggu review admin',
      proposal: result.rows[0]
    });
  } catch (error) {
    console.error('Propose food error:', error);
    next(error);
  }
};

export default { getAllFoods, searchFoods, getFoodById, proposeFood };