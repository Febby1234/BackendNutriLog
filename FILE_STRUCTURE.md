# 📂 Backend File Structure & Architecture

## Complete Directory Tree

```
backend/
│
├── src/
│   │
│   ├── server.js
│   │   └── Main Express application entry point
│   │       - Initialize Express app
│   │       - Setup middleware (CORS, JSON parser)
│   │       - Register routes
│   │       - Error handling
│   │       - Start server on port 5000
│   │
│   ├── config/
│   │   └── database.js
│   │       - PostgreSQL connection pool setup
│   │       - Pool configuration
│   │       - Query helper function
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   │   - register()    : Create new user + health profile
│   │   │   - login()       : Authenticate & generate JWT token
│   │   │   - getProfile()  : Fetch user profile with health data
│   │   │   - calculateBMR() : Helper untuk hitung BMR
│   │   │
│   │   ├── foodController.js
│   │   │   - getAllFoods()     : Get semua makanan yang approved
│   │   │   - searchFoods()     : Search makanan by nama
│   │   │   - getFoodById()     : Get detail makanan specific
│   │   │
│   │   ├── logController.js
│   │   │   - addFoodLog()      : Tambah makanan ke daily log
│   │   │   - getTodayLog()     : Ambil log hari ini
│   │   │   - getLogByDate()    : Ambil log tanggal tertentu
│   │   │   - deleteLogItem()   : Hapus item dari log
│   │   │   - formatDate()      : Helper untuk formatting date
│   │   │
│   │   └── dashboardController.js
│   │       - getDashboardSummary() : Today's summary + macros + health profile
│   │       - getWeeklyStats()      : 7-day nutrition statistics
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   │   - POST   /auth/register  → register
│   │   │   - POST   /auth/login     → login
│   │   │   - GET    /auth/profile   → getProfile (+ auth middleware)
│   │   │
│   │   ├── foodRoutes.js
│   │   │   - GET    /food/all       → getAllFoods
│   │   │   - GET    /food/search    → searchFoods
│   │   │   - GET    /food/:foodId   → getFoodById
│   │   │
│   │   ├── logRoutes.js
│   │   │   - POST   /log/add        → addFoodLog (+ auth)
│   │   │   - GET    /log/today      → getTodayLog (+ auth)
│   │   │   - GET    /log/:date      → getLogByDate (+ auth)
│   │   │   - DELETE /log/:itemId    → deleteLogItem (+ auth)
│   │   │
│   │   └── dashboardRoutes.js
│   │       - GET    /dashboard/summary      → getDashboardSummary (+ auth)
│   │       - GET    /dashboard/weekly-stats → getWeeklyStats (+ auth)
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   │   - authenticateToken()  : Verify JWT dari Authorization header
│   │   │                            - Extract token dari "Bearer TOKEN"
│   │   │                            - Verify dengan JWT_SECRET
│   │   │                            - Attach userId ke req.userId
│   │   │
│   │   └── errorHandler.js
│   │       - errorHandler()      : Global error handler middleware
│   │                              - Format error responses
│   │                              - Handle validation errors
│   │                              - Handle database errors
│   │
│   ├── utils/
│   │   └── jwt.js
│   │       - generateToken()  : Generate JWT token (24h expiry)
│   │       - verifyToken()    : Verify & decode JWT token
│   │
│   └── database/
│       ├── setup.js
│       │   - Create all database tables:
│       │     * users
│       │     * health_profiles
│       │     * foods
│       │     * daily_logs
│       │     * log_items
│       │     * food_proposals
│       │   - Create indexes untuk performance
│       │
│       └── seed.js
│           - Insert 30 sample Indonesian foods
│           - Setup initial data untuk testing
│           - Run: npm run db:seed
│
├── .env
│   └── Environment variables (LOCAL ONLY - tidak commit)
│       DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
│       PORT, NODE_ENV, JWT_SECRET, FRONTEND_URL
│
├── .env.example
│   └── Template untuk .env (COMMIT ini)
│
├── .gitignore
│   └── Ignore node_modules, .env, logs, etc.
│
├── package.json
│   └── Project metadata & dependencies
│       "dependencies": {
│         "express": "^4.18.2",
│         "pg": "^8.11.3",
│         "dotenv": "^16.3.1",
│         "jsonwebtoken": "^9.1.2",
│         "bcryptjs": "^2.4.3"
│       }
│
├── package-lock.json
│   └── Lock file untuk exact dependency versions
│
└── [Documentation]
    ├── README.md
    │   └── Project overview & setup guide
    │
    ├── QUICK_START.md
    │   └── 30-minute setup guide dengan troubleshooting
    │
    ├── BACKEND_SETUP_TUTORIAL.md
    │   └── Detailed setup guide + API reference
    │
    ├── ANDROID_CONNECTION_GUIDE.md
    │   └── Android Retrofit integration + code examples
    │
    └── FILE_STRUCTURE.md
        └── This file - architecture documentation
```

## Database Schema

```
PostgreSQL: nutrilog_db
│
├── users (primary)
│   ├── user_id (PK)
│   ├── email (UNIQUE)
│   ├── password_hash
│   ├── name
│   ├── role ('user' | 'admin')
│   ├── created_at
│   └── updated_at
│
├── health_profiles (1-to-1 with users)
│   ├── profile_id (PK)
│   ├── user_id (FK → users.user_id)
│   ├── age
│   ├── gender
│   ├── weight_kg
│   ├── height_cm
│   ├── daily_target_calories
│   ├── bmr_result
│   ├── created_at
│   └── updated_at
│
├── foods (master data)
│   ├── food_id (PK)
│   ├── name (UNIQUE)
│   ├── calories_per_serving
│   ├── protein_g
│   ├── fat_g
│   ├── carbs_g
│   ├── is_approved (true = visible di app)
│   └── created_at
│
├── daily_logs (1-to-N with users)
│   ├── log_id (PK)
│   ├── user_id (FK → users.user_id)
│   ├── date (UNIQUE per user_id)
│   ├── total_calories_consumed
│   ├── created_at
│   └── updated_at
│
├── log_items (1-to-N with daily_logs & foods)
│   ├── item_id (PK)
│   ├── log_id (FK → daily_logs.log_id)
│   ├── food_id (FK → foods.food_id)
│   ├── serving_quantity
│   ├── consumed_calories
│   └── created_at
│
└── food_proposals (admin moderation)
    ├── proposal_id (PK)
    ├── proposed_food_name
    ├── proposed_calories
    ├── proposed_protein_g
    ├── proposed_fat_g
    ├── proposed_carbs_g
    ├── status ('PENDING' | 'APPROVED' | 'REJECTED')
    ├── submitted_by (FK → users.user_id)
    ├── approved_by (FK → users.user_id)
    ├── created_at
    └── updated_at
```

## Request/Response Flow

### Register Flow
```
Client (Android)
    ↓
POST /api/auth/register
    ↓
authRoutes.js (routing)
    ↓
authController.register()
    ↓
[Validate input]
    ↓
[Hash password with bcrypt]
    ↓
INSERT users table
    ↓
[Calculate BMR]
    ↓
INSERT health_profiles table
    ↓
[Generate JWT token]
    ↓
Response: { token, user, bmr, ... }
    ↓
Client (saves token)
```

### Login & Protected Request Flow
```
Client (Android)
    ↓
POST /api/auth/login
    ↓
[Verify email & password]
    ↓
[Generate JWT token]
    ↓
Response: { token, user }
    ↓
Client (saves token to SharedPreferences)
    ↓
Next request: GET /api/log/today
    ↓
Header: Authorization: Bearer <TOKEN>
    ↓
authMiddleware.authenticateToken()
    ↓
[Verify JWT]
    ↓
req.userId = <decoded userId>
    ↓
logController.getTodayLog()
    ↓
Response: { logId, items, totalCalories }
```

### Add Food Log Flow
```
Client (Android)
    ↓
POST /api/log/add
{
  foodId: 1,
  servingQuantity: 1.5,
  date: "2024-01-15"
}
    ↓
[Authenticate with middleware]
    ↓
logController.addFoodLog()
    ↓
[Get food details from foods table]
    ↓
[Calculate consumed_calories = caloriesPerServing × quantity]
    ↓
[Get or create daily_logs entry]
    ↓
INSERT log_items
    ↓
UPDATE daily_logs total_calories_consumed
    ↓
SELECT dengan JOIN untuk ambil full data
    ↓
Response: {
  logId,
  items: [{foodId, name, quantity, calories, ...}],
  totalCalories
}
```

## API Authentication Flow

```
Step 1: Login
┌──────────────┐
│   Android    │
└──────┬───────┘
       │ POST /auth/login
       │ {"email": "...", "password": "..."}
       ↓
┌──────────────────────────────────────┐
│   Backend                            │
│   - Verify password                  │
│   - Generate JWT token               │
│   - Return token                     │
└──────┬───────────────────────────────┘
       │ {token: "eyJhbGc...", user: {...}}
       ↓
┌──────────────┐
│   Android    │
│   Save token │
│   to phone   │
└──────────────┘

Step 2: Protected Request
┌──────────────┐
│   Android    │
│   Add header │
└──────┬───────┘
       │ GET /log/today
       │ Header: Authorization: Bearer eyJhbGc...
       ↓
┌──────────────────────────────────────┐
│   Backend                            │
│   - Verify JWT signature             │
│   - Extract userId                   │
│   - Check if expired                 │
│   - Continue to controller           │
└──────┬───────────────────────────────┘
       │
       ├─ Valid? → Execute controller
       │
       └─ Invalid? → Return 401/403 error
       ↓
┌──────────────┐
│   Android    │
│   Receive    │
│   response   │
└──────────────┘
```

## Dependencies Explanation

```json
{
  "express": "Web framework untuk HTTP server",
  "pg": "PostgreSQL client untuk Node.js",
  "dotenv": "Load environment variables dari .env",
  "jsonwebtoken": "Create & verify JWT tokens",
  "bcryptjs": "Hash & compare passwords",
  "cors": "Enable CORS untuk Android app",
  "express-validator": "Input validation middleware",
  "nodemon": "Auto-restart server saat file berubah (dev only)"
}
```

## Key Features

### ✅ Implemented
- [x] JWT authentication dengan bearer tokens
- [x] Password hashing dengan bcrypt
- [x] Role-based access (user/admin)
- [x] BMR calculation (Basal Metabolic Rate)
- [x] Food database dengan 30+ sample items
- [x] Daily food logging dengan calorie tracking
- [x] Dashboard summary dengan macronutrients
- [x] Error handling & validation
- [x] CORS setup untuk Android
- [x] Request logging untuk debugging

### 🚀 Future Enhancements
- [ ] Food photo upload
- [ ] Barcode scanning integration
- [ ] Recipe management
- [ ] Social features (friend connections)
- [ ] Push notifications
- [ ] Meal planning
- [ ] Advanced analytics
- [ ] Integration dengan fitness trackers

---

**Architecture ready for production with proper security practices! 🎯**
