import { query } from '../config/database.js';

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = formatDate(new Date());

    // Get health profile
    const profileResult = await query(
      'SELECT * FROM health_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: 'Profil kesehatan tidak ditemukan' });
    }

    const profile = profileResult.rows[0];

    // Get today's log
    const logResult = await query(
      'SELECT log_id, total_calories_consumed FROM daily_logs WHERE user_id = $1 AND date = $2',
      [userId, today]
    );

    const todayCalories = logResult.rows.length > 0 ? logResult.rows[0].total_calories_consumed : 0;
    const logId = logResult.rows.length > 0 ? logResult.rows[0].log_id : null;

    // Get recent logs (last 7 days)
    const recentLogsResult = await query(
      `SELECT dl.log_id, dl.date, dl.total_calories_consumed, COUNT(li.item_id) as item_count
       FROM daily_logs dl
       LEFT JOIN log_items li ON dl.log_id = li.log_id
       WHERE dl.user_id = $1 AND dl.date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY dl.log_id, dl.date, dl.total_calories_consumed
       ORDER BY dl.date DESC`,
      [userId]
    );

    // Get today's items for detail
    let todayItems = [];
    if (logId) {
      const itemsResult = await query(
        `SELECT li.item_id, li.food_id, f.name, li.serving_quantity, li.consumed_calories,
                f.calories_per_serving, f.protein_g, f.fat_g, f.carbs_g
         FROM log_items li
         JOIN foods f ON li.food_id = f.food_id
         WHERE li.log_id = $1`,
        [logId]
      );
      todayItems = itemsResult.rows.map(row => ({
        itemId: row.item_id,
        foodId: row.food_id,
        name: row.name,
        servingQuantity: row.serving_quantity,
        consumedCalories: row.consumed_calories,
        caloriesPerServing: row.calories_per_serving,
        proteinG: row.protein_g,
        fatG: row.fat_g,
        carbsG: row.carbs_g,
      }));
    }

    // Calculate macronutrients for today
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    todayItems.forEach(item => {
      const servings = item.servingQuantity;
      totalProtein += (item.proteinG || 0) * servings;
      totalFat += (item.fatG || 0) * servings;
      totalCarbs += (item.carbsG || 0) * servings;
    });

    res.status(200).json({
      todayCalories: Math.round(todayCalories),
      targetCalories: Math.round(profile.daily_target_calories),
      bmr: Math.round(profile.bmr_result),
      caloriesRemaining: Math.round(profile.daily_target_calories - todayCalories),
      macronutrients: {
        protein: Math.round(totalProtein * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
      },
      healthProfile: {
        profileId: profile.profile_id,
        age: profile.age,
        gender: profile.gender,
        weightKg: profile.weight_kg,
        heightCm: profile.height_cm,
        dailyTargetCalories: Math.round(profile.daily_target_calories),
        bmrResult: Math.round(profile.bmr_result),
      },
      todayItems,
      recentLogs: recentLogsResult.rows.map(row => ({
        logId: row.log_id,
        date: row.date,
        totalCalories: Math.round(row.total_calories_consumed),
        itemCount: row.item_count,
      })),
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    next(error);
  }
};

export const getWeeklyStats = async (req, res, next) => {
  try {
    const userId = req.userId;

    const statsResult = await query(
      `SELECT 
        dl.date,
        dl.total_calories_consumed,
        SUM(li.served_quantity * f.protein_g) as total_protein,
        SUM(li.serving_quantity * f.fat_g) as total_fat,
        SUM(li.serving_quantity * f.carbs_g) as total_carbs
       FROM daily_logs dl
       LEFT JOIN log_items li ON dl.log_id = li.log_id
       LEFT JOIN foods f ON li.food_id = f.food_id
       WHERE dl.user_id = $1 AND dl.date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY dl.date, dl.total_calories_consumed
       ORDER BY dl.date ASC`,
      [userId]
    );

    res.status(200).json(statsResult.rows.map(row => ({
      date: row.date,
      calories: Math.round(row.total_calories_consumed),
      protein: Math.round((row.total_protein || 0) * 10) / 10,
      fat: Math.round((row.total_fat || 0) * 10) / 10,
      carbs: Math.round((row.total_carbs || 0) * 10) / 10,
    })));
  } catch (error) {
    console.error('Get weekly stats error:', error);
    next(error);
  }
};

export default { getDashboardSummary, getWeeklyStats };
