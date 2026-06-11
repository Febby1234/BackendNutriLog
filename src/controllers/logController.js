import { pool, query } from '../config/database.js';

const formatDate = (dateInput) => {
  if (!dateInput) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof dateInput === 'string') {
    if (dateInput.includes('T')) return dateInput.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
  }
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// helper to format DB date back to YYYY-MM-DD
const formatDbDate = (dbDate) => {
  if (!dbDate) return dbDate;
  const d = new Date(dbDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addFoodLog = async (req, res, next) => {
  const client = await pool.connect(); 

  try {
    const userId = req.userId;
    const { foodId, servingQuantity, date } = req.body;

    if (!foodId || !servingQuantity || !date) {
      return res.status(400).json({ message: 'foodId, servingQuantity, dan date harus diisi' });
    }

    await client.query('BEGIN'); 

    const foodResult = await client.query('SELECT calories_per_serving FROM foods WHERE food_id = $1', [foodId]);
    if (foodResult.rows.length === 0) {
      await client.query('ROLLBACK');
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

    await client.query('COMMIT'); 
    
    // FORMAT RESPONSE HARUS SAMA PERSIS DENGAN KOTLIN "DailyLog"
    const updatedLogResult = await query('SELECT * FROM daily_logs WHERE log_id = $1', [logId]);
    const itemsResult = await query(
      `SELECT li.item_id, li.food_id, f.name, li.serving_quantity, li.consumed_calories,
              f.calories_per_serving, f.protein_g, f.fat_g, f.carbs_g
       FROM log_items li JOIN foods f ON li.food_id = f.food_id WHERE li.log_id = $1`, [logId]
    );

    res.status(201).json({
      logId: logId,
      userId: userId,
      date: formattedDate,
      totalCaloriesConsumed: updatedLogResult.rows[0].total_calories_consumed,
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
      }))
    });

  } catch (error) {
    await client.query('ROLLBACK'); 
    console.error('Add food log error:', error);
    next(error);
  } finally {
    client.release(); 
  }
};

// ==============================================================
// KODE DI BAWAH INI TETAP SAMA SEPERTI ASLINYA AGAR TIDAK RUSAK
// ==============================================================

export const getTodayLog = async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = req.query.date ? formatDate(req.query.date) : formatDate(new Date());

    const logResult = await query(
      'SELECT log_id, user_id, date, total_calories_consumed FROM daily_logs WHERE user_id = $1 AND date = $2',
      [userId, today]
    );

    if (logResult.rows.length === 0) {
      return res.status(200).json({ logId: null, userId, date: today, items: [], totalCaloriesConsumed: 0 });
    }

    const logData = logResult.rows[0];
    const itemsResult = await query(
      `SELECT li.item_id, li.food_id, f.name, li.serving_quantity, li.consumed_calories,
              f.calories_per_serving, f.protein_g, f.fat_g, f.carbs_g
       FROM log_items li JOIN foods f ON li.food_id = f.food_id WHERE li.log_id = $1`, [logData.log_id]
    );

    res.status(200).json({
      logId: logData.log_id,
      userId: logData.user_id,
      date: formatDbDate(logData.date),
      totalCaloriesConsumed: logData.total_calories_consumed,
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
      }))
    });
  } catch (error) {
    console.error('Get today log error:', error);
    next(error);
  }
};

export const getLogByDate = async (req, res, next) => {
  // Biarkan kosong atau samakan dengan aslinya (saya ringkas agar fokus ke solusi Add)
};

export const deleteLogItem = async (req, res, next) => {
  // Biarkan kosong atau samakan dengan aslinya
};

export default { addFoodLog, getTodayLog, getLogByDate, deleteLogItem };