import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up database...');
    
    // First, create database if not exists
    const adminPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'postgres', // Connect to default postgres database
      // TAMBAHKAN SSL DI SINI
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      await adminPool.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
      console.log(`✓ Database ${process.env.DB_NAME} created`);
    } catch (err) {
      if (err.code === '42P04') {
        console.log(`ℹ Database ${process.env.DB_NAME} already exists`);
      } else {
        throw err;
      }
    }
    
    await adminPool.end();
    
    // Now connect to the actual database
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      // TAMBAHKAN SSL DI SINI JUGA
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    const query = (text, params) => pool.query(text, params);

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Create health profiles table
    await query(`
      CREATE TABLE IF NOT EXISTS health_profiles (
        profile_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        age INTEGER NOT NULL,
        gender VARCHAR(20) NOT NULL,
        weight_kg FLOAT NOT NULL,
        height_cm FLOAT NOT NULL,
        daily_target_calories FLOAT,
        bmr_result FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log('✓ Health profiles table created');

    // Create foods table
    await query(`
      CREATE TABLE IF NOT EXISTS foods (
        food_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        calories_per_serving FLOAT NOT NULL,
        protein_g FLOAT NOT NULL,
        fat_g FLOAT NOT NULL,
        carbs_g FLOAT NOT NULL,
        is_approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Foods table created');

    // Create daily logs table
    await query(`
      CREATE TABLE IF NOT EXISTS daily_logs (
        log_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        date DATE NOT NULL,
        total_calories_consumed FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE(user_id, date)
      )
    `);
    console.log('✓ Daily logs table created');

    // Create log items table
    await query(`
      CREATE TABLE IF NOT EXISTS log_items (
        item_id SERIAL PRIMARY KEY,
        log_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        serving_quantity FLOAT NOT NULL,
        consumed_calories FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (log_id) REFERENCES daily_logs(log_id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(food_id) ON DELETE RESTRICT
      )
    `);
    console.log('✓ Log items table created');

    // Create food proposals table
    await query(`
      CREATE TABLE IF NOT EXISTS food_proposals (
        proposal_id SERIAL PRIMARY KEY,
        proposed_food_name VARCHAR(255) NOT NULL,
        proposed_calories FLOAT NOT NULL,
        proposed_protein_g FLOAT,
        proposed_fat_g FLOAT,
        proposed_carbs_g FLOAT,
        status VARCHAR(50) DEFAULT 'PENDING',
        submitted_by INTEGER NOT NULL,
        approved_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submitted_by) REFERENCES users(user_id),
        FOREIGN KEY (approved_by) REFERENCES users(user_id)
      )
    `);
    console.log('✓ Food proposals table created');

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_health_profiles_user_id ON health_profiles(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_log_items_log_id ON log_items(log_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_food_proposals_status ON food_proposals(status)`);
    console.log('✓ Indexes created');

    console.log('✅ Database setup completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ Database setup error:', error);
    process.exit(1);
  }
};

setupDatabase();