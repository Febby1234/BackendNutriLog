import { query } from '../config/database.js';

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Check if foods already exist
    const foodCheck = await query('SELECT COUNT(*) FROM foods');
    if (foodCheck.rows[0].count > 0) {
      console.log('ℹ Foods already seeded');
      process.exit(0);
    }

    // Insert sample foods - Makanan Indonesia
    const foods = [
      { name: 'Nasi Putih', calories: 150, protein: 2.7, fat: 0.3, carbs: 28 },
      { name: 'Nasi Merah', calories: 111, protein: 2.6, fat: 0.9, carbs: 23 },
      { name: 'Roti Tawar', calories: 80, protein: 2.5, fat: 1.5, carbs: 14 },
      { name: 'Telur Ayam Rebus', calories: 155, protein: 13, fat: 11, carbs: 1.1 },
      { name: 'Ayam Goreng', calories: 320, protein: 30, fat: 17, carbs: 0 },
      { name: 'Ikan Bakar', calories: 180, protein: 25, fat: 8, carbs: 0 },
      { name: 'Tempe Goreng', calories: 189, protein: 19, fat: 11, carbs: 8 },
      { name: 'Tahu Goreng', calories: 150, protein: 15, fat: 9, carbs: 3 },
      { name: 'Sayur Asem', calories: 60, protein: 2, fat: 2, carbs: 10 },
      { name: 'Gado-gado', calories: 150, protein: 8, fat: 8, carbs: 12 },
      { name: 'Soto Ayam', calories: 120, protein: 10, fat: 5, carbs: 8 },
      { name: 'Sate Ayam', calories: 200, protein: 25, fat: 10, carbs: 3 },
      { name: 'Lumpia Goreng', calories: 160, protein: 6, fat: 10, carbs: 12 },
      { name: 'Bakso Daging', calories: 180, protein: 15, fat: 10, carbs: 10 },
      { name: 'Perkedel', calories: 130, protein: 3, fat: 6, carbs: 17 },
      { name: 'Kentang Rebus', calories: 77, protein: 1.7, fat: 0.1, carbs: 17 },
      { name: 'Cabai Rawit', calories: 40, protein: 2, fat: 0.4, carbs: 9 },
      { name: 'Bawang Goreng', calories: 220, protein: 3, fat: 15, carbs: 20 },
      { name: 'Kerupuk', calories: 160, protein: 2, fat: 10, carbs: 16 },
      { name: 'Pisang Goreng', calories: 180, protein: 1, fat: 10, carbs: 20 },
      { name: 'Apel', calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
      { name: 'Jeruk Manis', calories: 47, protein: 0.7, fat: 0.3, carbs: 12 },
      { name: 'Mangga', calories: 60, protein: 0.8, fat: 0.3, carbs: 15 },
      { name: 'Papaya', calories: 43, protein: 0.5, fat: 0.3, carbs: 11 },
      { name: 'Susu Sapi Murni', calories: 61, protein: 3.2, fat: 3.3, carbs: 4.8 },
      { name: 'Yogurt Tawar', calories: 59, protein: 3.5, fat: 0.4, carbs: 4.7 },
      { name: 'Keju Cheddar', calories: 403, protein: 25, fat: 33, carbs: 1.3 },
      { name: 'Daging Sapi Matang', calories: 271, protein: 26, fat: 18, carbs: 0 },
      { name: 'Daging Kambing', calories: 162, protein: 25, fat: 6, carbs: 0 },
      { name: 'Mie Kuah', calories: 140, protein: 5, fat: 2, carbs: 25 },
    ];

    for (const food of foods) {
      await query(
        `INSERT INTO foods (name, calories_per_serving, protein_g, fat_g, carbs_g, is_approved) 
         VALUES ($1, $2, $3, $4, $5, true)`,
        [food.name, food.calories, food.protein, food.fat, food.carbs]
      );
    }

    console.log(`✓ Inserted ${foods.length} foods`);
    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
