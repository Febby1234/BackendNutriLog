# 📱 NutriLog Backend Setup & Connection Guide

## Daftar Isi
1. [Struktur Backend](#struktur-backend)
2. [Setup Database PostgreSQL](#setup-database-postgresql)
3. [Setup Backend Node.js](#setup-backend-nodejs)
4. [Koneksi Frontend Android ke Backend](#koneksi-frontend-android-ke-backend)
5. [Testing API](#testing-api)
6. [Troubleshooting](#troubleshooting)

---

## Struktur Backend

```
backend/
├── src/
│   ├── server.js                 # Express server entry point
│   ├── config/
│   │   └── database.js           # Database connection config
│   ├── controllers/
│   │   ├── authController.js     # Auth logic (register, login)
│   │   ├── foodController.js     # Food search & retrieval
│   │   ├── logController.js      # Daily food logging
│   │   └── dashboardController.js # Dashboard stats
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── foodRoutes.js         # Food endpoints
│   │   ├── logRoutes.js          # Log endpoints
│   │   └── dashboardRoutes.js    # Dashboard endpoints
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── errorHandler.js       # Error handling
│   ├── utils/
│   │   └── jwt.js                # JWT utilities
│   └── database/
│       ├── setup.js              # Database schema creation
│       └── seed.js               # Sample data insertion
├── .env.example                  # Environment template
├── package.json                  # Dependencies
└── README.md                     # This file
```

---

## Setup Database PostgreSQL

### Step 1: Install PostgreSQL

**Windows:**
- Download dari https://www.postgresql.org/download/windows/
- Install dengan default settings
- Username: `postgres`, Password: ingat password ini

**Mac:**
```bash
brew install postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
```

### Step 2: Buat Database

```sql
-- Buka PostgreSQL command line
psql -U postgres

-- Atau gunakan pgAdmin (GUI)

-- Jalankan SQL berikut:
CREATE DATABASE nutrilog_db;
```

### Step 3: Konfigurasi Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nutrilog_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password    # Ganti dengan password Anda
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_key      # Ganti dengan key unik
JWT_EXPIRE=7d
FRONTEND_URL=http://10.0.2.2:5000     # Untuk Android Emulator
```

---

## Setup Backend Node.js

### Step 1: Install Node.js & npm

Download dari https://nodejs.org/ (LTS version)

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Setup Database Schema & Data

```bash
# Create tables
npm run db:setup

# Insert sample data
npm run db:seed
```

Anda akan melihat output:
```
✓ Users table created
✓ Health profiles table created
✓ Foods table created
...
✅ Database setup completed successfully!
```

### Step 4: Jalankan Backend Server

**Development Mode (dengan auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Output yang diharapkan:
```
╔════════════════════════════════════╗
║   🚀 NutriLog Backend Server       ║
║   Server berjalan di port 5000     ║
║   📍 http://localhost:5000        ║
╚════════════════════════════════════╝
```

### Step 5: Test Health Check

Buka browser dan akses:
```
http://localhost:5000/api/health
```

Respon:
```json
{"message":"Server berjalan dengan baik"}
```

---

## Koneksi Frontend Android ke Backend

### Bagian A: Dapatkan IP Komputer Lokal Anda

**Windows:**
1. Buka Command Prompt
2. Ketik: `ipconfig`
3. Cari "IPv4 Address" (biasanya `192.168.x.x`)

**Mac/Linux:**
```bash
ifconfig
```

Contoh: `192.168.1.100`

### Bagian B: Konfigurasi URL Backend

Anda punya 2 opsi:

#### Option 1: Android Emulator (Lebih mudah)
- Emulator di PC sudah support `10.0.2.2` sebagai localhost
- URL Backend: `http://10.0.2.2:5000`
- Tidak perlu ubah IP

#### Option 2: Android Device Fisik (Harus same WiFi)
- Pastikan device dan PC di network WiFi yang sama
- URL Backend: `http://192.168.1.100:5000` (ganti dengan IP Anda)
- Edit di: `FRONTEND_URL` dalam `.env`

### Bagian C: Update Android Frontend

Buka file yang handle API requests (biasanya di `RetrofitClient.kt` atau `ApiService.kt`):

```kotlin
// RetrofitClient.kt atau ApiConfig.kt
object ApiClient {
    // Untuk Emulator:
    private const val BASE_URL = "http://10.0.2.2:5000/api/"
    
    // Untuk Device Fisik:
    // private const val BASE_URL = "http://192.168.1.100:5000/api/"
    
    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    val apiService: ApiService = retrofit.create(ApiService.kt::class.java)
}
```

### Bagian D: API Endpoints di Android

Contoh penggunaan di Android:

```kotlin
// Login
apiService.login(
    LoginRequest(
        email = "user@example.com",
        password = "password123"
    )
).enqueue(object : Callback<LoginResponse> {
    override fun onResponse(
        call: Call<LoginResponse>,
        response: Response<LoginResponse>
    ) {
        if (response.isSuccessful) {
            val token = response.body()?.token
            val user = response.body()?.user
            
            // Simpan token ke SharedPreferences atau DataStore
            saveToken(token)
            
            // Lanjut ke Main Activity
        }
    }
    
    override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
        Toast.makeText(context, "Login gagal: ${t.message}", Toast.LENGTH_SHORT).show()
    }
})
```

### Bagian E: Implement Bearer Token untuk Authenticated Requests

Di Android, ketika call API yang butuh auth (log, dashboard):

```kotlin
// Interceptor untuk menambah token ke header
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        val token = SharedPreferences.getString("auth_token", "")
        
        val newRequest = originalRequest.newBuilder()
            .addHeader("Authorization", "Bearer $token")
            .build()
        
        return chain.proceed(newRequest)
    }
}

// Tambahkan ke Retrofit client:
val httpClient = OkHttpClient.Builder()
    .addInterceptor(AuthInterceptor())
    .build()

val retrofit = Retrofit.Builder()
    .baseUrl(BASE_URL)
    .client(httpClient)
    .addConverterFactory(GsonConverterFactory.create())
    .build()
```

---

## API Endpoints Reference

### Authentication

#### Register
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "age": 25,
  "weight": 70.5,
  "height": 175.0,
  "gender": "Male"
}
```

Response:
```json
{
  "message": "Registrasi berhasil",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "age": 25,
    "weight": 70.5,
    "height": 175.0,
    "gender": "Male",
    "role": "user",
    "bmr": 1600,
    "dailyTargetCalories": 2400
  }
}
```

#### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```bash
GET http://localhost:5000/api/auth/profile
Authorization: Bearer {token}
```

### Food

#### Get All Foods
```bash
GET http://localhost:5000/api/food/all
```

#### Search Foods
```bash
GET http://localhost:5000/api/food/search?query=nasi
```

### Daily Log

#### Add Food to Log
```bash
POST http://localhost:5000/api/log/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "foodId": 1,
  "servingQuantity": 1.5,
  "date": "2024-01-15"
}
```

#### Get Today's Log
```bash
GET http://localhost:5000/api/log/today
Authorization: Bearer {token}
```

#### Get Log by Date
```bash
GET http://localhost:5000/api/log/2024-01-15
Authorization: Bearer {token}
```

### Dashboard

#### Get Dashboard Summary
```bash
GET http://localhost:5000/api/dashboard/summary
Authorization: Bearer {token}
```

Response:
```json
{
  "todayCalories": 1250,
  "targetCalories": 2400,
  "bmr": 1600,
  "caloriesRemaining": 1150,
  "macronutrients": {
    "protein": 45.5,
    "fat": 32.3,
    "carbs": 125.0
  },
  "healthProfile": {
    "profileId": 1,
    "age": 25,
    "gender": "Male",
    "weightKg": 70.5,
    "heightCm": 175.0,
    "dailyTargetCalories": 2400,
    "bmrResult": 1600
  },
  "todayItems": [...],
  "recentLogs": [...]
}
```

---

## Testing API

### Option 1: Postman (Recommended)

1. Download Postman: https://www.postman.com/downloads/
2. Import collection atau buat requests manual
3. Set environment variables:
   - `baseUrl`: http://localhost:5000
   - `token`: (akan di-set setelah login)

### Option 2: cURL (Terminal)

```bash
# Test health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "age": 25,
    "weight": 70,
    "height": 175,
    "gender": "Male"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get all foods (simpan token dari response login)
curl http://localhost:5000/api/food/all

# Get today's log (dengan token)
curl http://localhost:5000/api/log/today \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Option 3: Insomnia

Mirip seperti Postman. Download: https://insomnia.rest/

---

## Troubleshooting

### Error: `connect ECONNREFUSED 127.0.0.1:5432`
**Masalah:** PostgreSQL tidak running
**Solusi:**
```bash
# Windows
net start postgresql-x64-15

# Mac
brew services start postgresql

# Linux
sudo service postgresql start
```

### Error: `FATAL: password authentication failed`
**Masalah:** Password PostgreSQL salah
**Solusi:**
1. Buka pgAdmin
2. Reset password untuk user `postgres`
3. Update `.env` dengan password yang benar

### Error: `relation "users" does not exist`
**Masalah:** Database belum di-setup
**Solusi:**
```bash
npm run db:setup
npm run db:seed
```

### Error: `CORS policy: Response to preflight request`
**Masalah:** CORS tidak dikonfigurasi dengan benar
**Solusi:**
Edit `.env`:
```env
FRONTEND_URL=http://10.0.2.2:5000   # Untuk emulator
# atau
FRONTEND_URL=http://192.168.1.100:5000  # Untuk device
```

### Error: `Token not valid or expired` di Android
**Masalah:** Token tidak dikirim atau format salah
**Solusi:**
- Pastikan token disimpan dengan benar
- Header format: `Authorization: Bearer {token}`
- Pastikan token tidak expired (default 7 hari)

### Android Emulator tidak bisa connect ke localhost
**Solusi:**
- Emulator address: `10.0.2.2` (bukan `localhost`)
- Update `BASE_URL` di `RetrofitClient.kt`

### Device Fisik tidak bisa connect
**Solusi:**
1. Pastikan device dan PC di WiFi yang sama
2. Dapatkan IP PC: `ipconfig` (Windows) atau `ifconfig` (Mac/Linux)
3. Update `BASE_URL` dengan IP tersebut
4. Port forward jika perlu (optional)

---

## Development Tips

### Enable Request Logging
Di `server.js` sudah ada request logging:
```
📍 POST /api/auth/login
📍 GET /api/food/all
```

### Database Management

View data menggunakan pgAdmin:
1. Buka pgAdmin (http://localhost:5050)
2. Connect ke PostgreSQL
3. Lihat data di tables

Atau gunakan psql:
```bash
psql -U postgres -d nutrilog_db

# Query examples:
SELECT * FROM users;
SELECT * FROM foods LIMIT 5;
SELECT * FROM daily_logs;
```

### Adding New Food Items

```bash
psql -U postgres -d nutrilog_db

INSERT INTO foods (name, calories_per_serving, protein_g, fat_g, carbs_g, is_approved)
VALUES ('Pizza', 285, 12, 10, 36, true);
```

---

## Deployment Checklist

- [ ] Update `JWT_SECRET` dengan nilai random yang aman
- [ ] Set `NODE_ENV=production`
- [ ] Backup database PostgreSQL
- [ ] Test semua endpoints dengan network yang berbeda
- [ ] Monitor server logs untuk errors
- [ ] Setup backup otomatis untuk database
- [ ] Use HTTPS (SSL/TLS) untuk production
- [ ] Add rate limiting untuk API security
- [ ] Validate input lebih ketat

---

## Quick Start Command Summary

```bash
# Setup
cd backend
npm install
cp .env.example .env

# Database
npm run db:setup
npm run db:seed

# Development
npm run dev

# Production
npm start

# Test
curl http://localhost:5000/api/health
```

---

**Untuk pertanyaan lebih lanjut atau issues, periksa error logs atau hubungi tim development!** 🚀
