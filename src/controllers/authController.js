import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

// Helper function untuk hitung BMR (Basal Metabolic Rate)
const calculateBMR = (weight, height, age, gender) => {
  if (gender.toLowerCase() === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
};

export const register = async (req, res, next) => {
  try {
    const { email, password, name, age, weight, height, gender } = req.body;

    if (!email || !password || !name || !age || !weight || !height || !gender) {
      return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING user_id, email, name, role',
      [email, hashedPassword, name, 'user']
    );

    const userId = userResult.rows[0].user_id;
    const bmr = calculateBMR(weight, height, age, gender);
    const dailyTargetCalories = bmr * 1.5;

    await query(
      `INSERT INTO health_profiles (user_id, age, gender, weight_kg, height_cm, daily_target_calories, bmr_result) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, age, gender, weight, height, dailyTargetCalories, bmr]
    );

    const token = generateToken(userId);

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: {
        userId,
        email: userResult.rows[0].email,
        name: userResult.rows[0].name,
        age,
        weight,
        height,
        gender,
        role: userResult.rows[0].role,
        bmr: Math.round(bmr),
        dailyTargetCalories: Math.round(dailyTargetCalories),
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password harus diisi' });
    }

    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const user = userResult.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const profileResult = await query(
      'SELECT * FROM health_profiles WHERE user_id = $1',
      [user.user_id]
    );

    const profile = profileResult.rows[0] || {};
    const token = generateToken(user.user_id);

    res.status(200).json({
      message: 'Login berhasil',
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        age: profile.age,
        weight: profile.weight_kg,
        height: profile.height_cm,
        gender: profile.gender,
        role: user.role,
        bmr: Math.round(profile.bmr_result || 0),
        dailyTargetCalories: Math.round(profile.daily_target_calories || 0),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    const userResult = await query(
      'SELECT user_id, email, name, role FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const user = userResult.rows[0];
    const profileResult = await query(
      'SELECT * FROM health_profiles WHERE user_id = $1',
      [userId]
    );

    const profile = profileResult.rows[0] || {};

    res.status(200).json({
      userId: user.user_id,
      email: user.email,
      name: user.name,
      age: profile.age,
      weight: profile.weight_kg,
      height: profile.height_cm,
      gender: profile.gender,
      role: user.role,
      bmr: Math.round(profile.bmr_result || 0),
      dailyTargetCalories: Math.round(profile.daily_target_calories || 0),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
};

// ============ FUNGSI BARU UNTUK UPDATE PROFILE + REKALKULASI BMR ============
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, age, weight, height, gender } = req.body;

    if (!name || !age || !weight || !height || !gender) {
      return res.status(400).json({ message: 'Semua kolom harus diisi' });
    }

    // 1. Update nama di tabel users
    await query('UPDATE users SET name = $1 WHERE user_id = $2', [name, userId]);

    // 2. Hitung ulang BMR & Target Kalori otomatis berdasarkan input baru
    const bmr = calculateBMR(weight, height, age, gender);
    const dailyTargetCalories = bmr * 1.5;

    // 3. Update data kesehatan di tabel health_profiles
    await query(
      `UPDATE health_profiles 
       SET age = $1, gender = $2, weight_kg = $3, height_cm = $4, daily_target_calories = $5, bmr_result = $6, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $7`,
      [age, gender, weight, height, dailyTargetCalories, bmr, userId]
    );

    // Ambil data email user saat ini untuk dikembalikan ke Android
    const emailResult = await query('SELECT email, role FROM users WHERE user_id = $1', [userId]);

    res.status(200).json({
      userId: userId,
      email: emailResult.rows[0].email,
      name: name,
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      gender: gender,
      role: emailResult.rows[0].role,
      bmr: Math.round(bmr),
      dailyTargetCalories: Math.round(dailyTargetCalories)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    next(error);
  }
};

export default { register, login, getProfile, updateProfile };