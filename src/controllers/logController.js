

import { pool, query } from '../config/database.js'; // Pastikan import pool


export const addFoodLog = async (req, res, next) => {
  // Buka koneksi client khusus untuk transaksi ACID
  const client = await pool.connect(); 

  try {
    const userId = req.userId;
    const { foodId, servingQuantity, date } = req.body;

    if (!foodId || !servingQuantity || !date) {
      return res.status(400).json({ message: 'foodId, servingQuantity, dan date harus diisi' });
    }

    // MULAI TRANSAKSI (Jika gagal di tengah jalan, semua dibatalkan)
    await client.query('BEGIN'); 

    const foodResult = await client.query('SELECT calories_per_serving FROM foods WHERE food_id = $1', [foodId]);
    if (foodResult.rows.length === 0) {
      await client.query('ROLLBACK'); // Batalkan jika error
      return res.status(404).json({ message: 'Makanan tidak ditemukan' });
    }

    const caloriesPerServing = foodResult.rows[0].calories_per_serving;
    const consumedCalories = caloriesPerServing * servingQuantity;
    const formattedDate = formatDate(date);

    let logResult = await client.query('SELECT log_id FROM daily_logs WHERE user_id = $1 AND date = $2', [userId, formattedDate]);
    let logId;

    if (logResult.rows.length === 0) {
      const createLogResult = await client.query(
        'INSERT INTO daily_logs (user_id, date, total_calories_consumed) VALUES ($1, $2, $3) RETURNING log_id',
        [userId, formattedDate, consumedCalories]
      );
      logId = createLogResult.rows[0].log_id;
    } else {
      logId = logResult.rows[0].log_id;
      await client.query(
        'UPDATE daily_logs SET total_calories_consumed = total_calories_consumed + $1 WHERE log_id = $2',
        [consumedCalories, logId]
      );
    }

    await client.query(
      'INSERT INTO log_items (log_id, food_id, serving_quantity, consumed_calories) VALUES ($1, $2, $3, $4)',
      [logId, foodId, servingQuantity, consumedCalories]
    );

    // JIKA SEMUA SUKSES, SIMPAN PERMANEN
    await client.query('COMMIT'); 
    
    // Ambil data untuk response...
    const updatedLogResult = await query('SELECT * FROM daily_logs WHERE log_id = $1', [logId]);
    const itemsResult = await query(
      `SELECT li.*, f.* FROM log_items li JOIN foods f ON li.food_id = f.food_id WHERE li.log_id = $1`, [logId]
    );

    res.status(201).json({
      message: 'Makanan berhasil ditambahkan ke log',
      logId: logId,
      totalCaloriesConsumed: updatedLogResult.rows[0].total_calories_consumed,
      // (Bisa disingkat untuk respons)
    });

  } catch (error) {
    // JIKA ADA ERROR, KEMBALIKAN DATABASE KE KONDISI AWAL (ROLLBACK)
    await client.query('ROLLBACK'); 
    console.error('Add food log error:', error);
    next(error);
  } finally {
    // Tutup koneksi khusus
    client.release(); 
  }
};
// Biarkan getTodayLog dan fungsi lain di bawahnya tetap sama...

export const getTodayLog = async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = formatDate(new Date());

    const logResult = await query(
      `SELECT log_id, user_id, date, total_calories_consumed
       FROM daily_logs
       WHERE user_id = $1 AND date = $2`,
      [userId, today]
    );

    if (logResult.rows.length === 0) {
      return res.status(200).json({
        logId: null,
        userId,
        date: today,
        items: [],
        totalCaloriesConsumed: 0,
      });
    }

    const logData = logResult.rows[0];

    // Get log items
    const itemsResult = await query(
      `SELECT li.item_id, li.food_id, f.name, li.serving_quantity, li.consumed_calories,
              f.calories_per_serving, f.protein_g, f.fat_g, f.carbs_g
       FROM log_items li
       JOIN foods f ON li.food_id = f.food_id
       WHERE li.log_id = $1`,
      [logData.log_id]
    );

    res.status(200).json({
      logId: logData.log_id,
      userId: logData.user_id,
      date: logData.date,
      items: itemsResult.rows.map(row => ({
        itemId: row.item_id,
        foodId: row.food_id,
        name: row.name,
        servingQuantity: row.serving_quantity,
        consumedCalories: row.consumed_calories,
        caloriesPerServing: row.calories_per_serving,
        proteinG: row.protein_g,
        fatG: row.fat_g,
        carbsG: row.carbs_g,
      })),
      totalCaloriesConsumed: logData.total_calories_consumed,
    });
  } catch (error) {
    console.error('Get today log error:', error);
    next(error);
  }
};

export const getLogByDate = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { date } = req.params;

    const formattedDate = formatDate(date);

    const logResult = await query(
      `SELECT log_id, user_id, date, total_calories_consumed
       FROM daily_logs
       WHERE user_id = $1 AND date = $2`,
      [userId, formattedDate]
    );

    if (logResult.rows.length === 0) {
      return res.status(200).json({
        logId: null,
        userId,
        date: formattedDate,
        items: [],
        totalCaloriesConsumed: 0,
      });
    }

    const logData = logResult.rows[0];

    const itemsResult = await query(
      `SELECT li.item_id, li.food_id, f.name, li.serving_quantity, li.consumed_calories,
              f.calories_per_serving, f.protein_g, f.fat_g, f.carbs_g
       FROM log_items li
       JOIN foods f ON li.food_id = f.food_id
       WHERE li.log_id = $1`,
      [logData.log_id]
    );

    res.status(200).json({
      logId: logData.log_id,
      userId: logData.user_id,
      date: logData.date,
      items: itemsResult.rows.map(row => ({
        itemId: row.item_id,
        foodId: row.food_id,
        name: row.name,
        servingQuantity: row.serving_quantity,
        consumedCalories: row.consumed_calories,
        caloriesPerServing: row.calories_per_serving,
        proteinG: row.protein_g,
        fatG: row.fat_g,
        carbsG: row.carbs_g,
      })),
      totalCaloriesConsumed: logData.total_calories_consumed,
    });
  } catch (error) {
    console.error('Get log by date error:', error);
    next(error);
  }
};

export const deleteLogItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId;

    // Get log item details
    const itemResult = await query(
      `SELECT li.log_id, li.consumed_calories, dl.user_id
       FROM log_items li
       JOIN daily_logs dl ON li.log_id = dl.log_id
       WHERE li.item_id = $1`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ message: 'Item log tidak ditemukan' });
    }

    const { log_id, consumed_calories, user_id } = itemResult.rows[0];

    if (user_id !== userId) {
      return res.status(403).json({ message: 'Tidak diizinkan menghapus item ini' });
    }

    // Delete item
    await query('DELETE FROM log_items WHERE item_id = $1', [itemId]);

    // Update daily log total
    await query(
      'UPDATE daily_logs SET total_calories_consumed = total_calories_consumed - $1 WHERE log_id = $2',
      [consumed_calories, log_id]
    );

    res.status(200).json({ message: 'Item log berhasil dihapus' });
  } catch (error) {
    console.error('Delete log item error:', error);
    next(error);
  }
};

export default { addFoodLog, getTodayLog, getLogByDate, deleteLogItem };
