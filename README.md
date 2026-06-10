# 🥗 NutriLog Backend Server

Node.js/Express backend untuk aplikasi Android NutriLog - calorie tracking & nutrition logging application.

## 📋 Overview

Backend ini menyediakan REST API untuk:
- **Authentication**: Register, Login, Profile management
- **Food Database**: Cari makanan, informasi nutrisi
- **Daily Logging**: Catat makanan harian, tracking kalori
- **Dashboard**: Ringkasan nutrisi, statistik mingguan, BMI calculation

## 🏗️ Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Token)
- **Security**: bcryptjs untuk password hashing
- **Validation**: express-validator

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js                 # Express app entry point
│   ├── config/
│   │   └── database.js           # PostgreSQL connection pool
│   ├── controllers/              # Business logic
│   │   ├── authController.js     # Register, Login, Profile
│   │   ├── foodController.js     # Food search & retrieval
│   │   ├── logController.js      # Daily food logging
│   │   └── dashboardController.js# Stats & summary
│   ├── routes/                   # API endpoints
│   │   ├── authRoutes.js
│   │   ├── foodRoutes.js
│   │   ├── logRoutes.js
│   │   └── dashboardRoutes.js
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── errorHandler.js       # Error handling
│   ├── utils/
│   │   └── jwt.js                # JWT utilities
│   └── database/
│       ├── setup.js              # Create database schema
│       └── seed.js               # Insert sample data
├── .env.example                  # Environment template
├── package.json                  # Dependencies & scripts
└── [Documentation]
    ├── README.md                 # This file
    ├── QUICK_START.md            # 30-min quick setup
    ├── BACKEND_SETUP_TUTORIAL.md # Detailed setup guide
    └── ANDROID_CONNECTION_GUIDE.md # Android integration
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18+
- PostgreSQL v12+
- npm atau yarn

### 2. Installation

```bash
# Clone atau download project
cd backend

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Edit .env dengan config Anda
nano .env
```

### 3. Database Setup

```bash
# Create database schema & tables
npm run db:setup

# Insert sample data
npm run db:seed
```

### 4. Run Server

```bash
# Development (dengan auto-reload)
npm run dev

# Production
npm start
```

Server akan running di `http://localhost:8000`

### 5. Verify

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Response: {"message":"Server berjalan dengan baik"}
```

## 📚 Documentation

| File | Deskripsi |
|------|-----------|
| **QUICK_START.md** | Setup 30 menit + troubleshooting cepat |
| **BACKEND_SETUP_TUTORIAL.md** | Panduan lengkap setup & database |
| **ANDROID_CONNECTION_GUIDE.md** | Cara connect Android ke backend |

## 🔌 API Endpoints

**Base URL:** `http://localhost:8000/api/`

### Authentication
```
POST   /api/auth/register       # Register user baru
POST   /api/auth/login          # Login & get token
GET    /api/auth/profile        # Get user profile (needs token)
```

### Food
```
GET    /api/food/all            # Semua makanan
GET    /api/food/search         # Search makanan
GET    /api/food/:foodId        # Detail makanan
```

### Daily Log
```
POST   /api/log/add             # Tambah makanan ke log (needs token)
GET    /api/log/today           # Log hari ini (needs token)
GET    /api/log/:date           # Log tanggal spesifik (needs token)
DELETE /api/log/:itemId         # Hapus log item (needs token)
```

### Dashboard
```
GET    /api/dashboard/summary   # Ringkasan harian (needs token)
GET    /api/dashboard/weekly    # Statistik mingguan (needs token)
```

## 🔐 Authentication

Gunakan JWT Bearer token:

```bash
# Header format:
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# Contoh cURL:
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:5000/api/log/today
```

## 📊 Database Schema

### Tables

- **users** - User accounts
- **health_profiles** - User health data (age, weight, height, BMR)
- **foods** - Food master database
- **daily_logs** - Daily calorie logs
- **log_items** - Individual food items dalam daily log
- **food_proposals** - User-submitted food proposals (admin approval)

## 📱 Android Integration

### Configure Base URL

Buka `RetrofitClient.kt` di Android project:

```kotlin
// Untuk Emulator:
private const val BASE_URL = "http://10.0.2.2:5000/api/"

// Untuk Device Fisik:
private const val BASE_URL = "http://192.168.1.100:5000/api/"  // Ganti IP
```

### Interceptor untuk Token

```kotlin
// Add auth token to setiap request
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val token = sharedPreferences.getString("token", "")
        
        return chain.proceed(
            request.newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        )
    }
}
```

Lihat **ANDROID_CONNECTION_GUIDE.md** untuk detail lengkap.

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Development dengan nodemon
npm start            # Production
npm run db:setup    # Create database schema
npm run db:seed     # Insert sample data
```

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nutrilog_db
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://10.0.2.2:5000
```

### Modifying Database

Edit schema di `src/database/setup.js`:

```javascript
await query(`
  CREATE TABLE IF NOT EXISTS new_table (
    id SERIAL PRIMARY KEY,
    ...
  )
`);
```

Jalankan: `npm run db:setup`

## 🧪 Testing

### Manual Testing dengan cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123",...}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Get Foods
curl http://localhost:5000/api/food/all

# Get Today Log (dengan token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/log/today
```

### Testing dengan Postman

1. Import API collection
2. Create environment:
   - `baseUrl` = `http://localhost:5000`
   - `token` = (auto-set setelah login)
3. Run requests

### Unit Tests (Coming Soon)

```bash
npm test  # Run jest tests
```

## ⚠️ Error Handling

### Common Error Responses

| Status | Message | Solusi |
|--------|---------|--------|
| 400 | Validation Error | Check required fields |
| 401 | Unauthorized | Login dulu, token required |
| 403 | Forbidden | Token expired atau invalid |
| 404 | Not Found | Endpoint atau resource tidak ada |
| 409 | Conflict | Email sudah terdaftar |
| 500 | Server Error | Check server logs |

### Debug Logging

Server akan output:
```
📍 POST /api/auth/login
📍 GET /api/food/search?query=nasi
📍 🔒 Protected: GET /api/log/today
```

## 🚢 Deployment

### Production Checklist

- [ ] Update `JWT_SECRET` dengan random string
- [ ] Set `NODE_ENV=production`
- [ ] Migrate ke PostgreSQL cloud (AWS RDS, Heroku)
- [ ] Setup environment variables di production
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS untuk production domain
- [ ] Setup monitoring & logging
- [ ] Enable rate limiting
- [ ] Backup database regularly

### Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create nutrilog-backend

# Set environment variables
heroku config:set DB_HOST=... DB_PASSWORD=... JWT_SECRET=...

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

### Deploy to Railway

```bash
# Visit railway.app
# Connect GitHub
# Create new project
# Link PostgreSQL database
# Deploy!
```

## 📞 Troubleshooting

### "Port already in use"
```bash
# Windows:
netstat -ano | findstr :5000

# Kill process:
taskkill /PID <PID> /F

# Atau ubah PORT di .env
```

### "Database connection refused"
```bash
# Start PostgreSQL:
# Windows: net start postgresql-x64-15
# Mac: brew services start postgresql
# Linux: sudo service postgresql start
```

### "CORS policy: Response to preflight request"
```
Check FRONTEND_URL di .env
Pastikan sesuai dengan Android app URL
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/new-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push branch: `git push origin feature/new-feature`
4. Submit pull request

## 📄 License

MIT License

## 📧 Support

Untuk pertanyaan atau issues:
1. Check documentation files
2. Review error logs
3. Check database status
4. Test dengan Postman/cURL

---

## 🎯 Next Steps

1. **Setup Server**: Ikuti QUICK_START.md
2. **Integrate Android**: Baca ANDROID_CONNECTION_GUIDE.md
3. **Test API**: Gunakan Postman atau cURL
4. **Deploy**: Pilih cloud provider & deploy

---

**Happy Coding! 🚀**

Last Updated: June 3, 2026
