# 🚀 Quick Start Guide - Backend & Frontend Connection

**Estimasi waktu:** 30 menit

---

## Phase 1: Setup Backend di VS Code (15 menit)

### Step 1: Open Backend in VS Code

```bash
# Di VS Code:
# File > Open Folder > Pilih folder 'backend'
```

### Step 2: Open Terminal & Install Dependencies

```bash
# Terminal di VS Code (Ctrl + `)
npm install
```

### Step 3: Setup Database

#### Install PostgreSQL (jika belum)
- Download: https://www.postgresql.org/download/
- Install dengan default settings (username: `postgres`)

#### Create Database & Tables

```bash
# Terminal command:
npm run db:setup

# Output:
# ✓ Users table created
# ✓ Health profiles table created
# ...
# ✅ Database setup completed successfully!
```

#### Seed Sample Data

```bash
npm run db:seed

# Output:
# ✓ Inserted 30 foods
# ✅ Database seeding completed successfully!
```

### Step 4: Configure .env

```bash
# Copy template
cp .env.example .env

# Edit .env file:
# - Set DB_PASSWORD dengan password PostgreSQL Anda
# - Biarkan port 5000
# - Biarkan JWT_SECRET default untuk development
```

### Step 5: Run Backend Server

```bash
npm run dev

# Output:
# ╔════════════════════════════════════╗
# ║   🚀 NutriLog Backend Server       ║
# ║   Server berjalan di port 5000     ║
# ║   📍 http://localhost:5000        ║
# ╚════════════════════════════════════╝
```

✅ **Backend siap!** Biarkan terminal ini running.

---

## Phase 2: Setup & Test di Android Studio (10 menit)

### Step 1: Get Your PC IP Address

**Windows:**
```bash
# Command Prompt
ipconfig

# Cari "IPv4 Address"
# Contoh: 192.168.1.100
```

**Mac/Linux:**
```bash
ifconfig
```

### Step 2: Update Backend URL di Android

Di Android Studio, buka file `RetrofitClient.kt`:

```kotlin
// Jika pakai Emulator:
private const val BASE_URL = "http://10.0.2.2:5000/api/"

// Jika pakai Device Fisik (ganti IP sesuai hasil ipconfig):
private const val BASE_URL = "http://192.168.1.100:5000/api/"
```

### Step 3: Test Backend Connection

**Option A: Emulator**
- Jalankan Android Emulator
- App akan auto-connect ke `http://10.0.2.2:5000`

**Option B: Device Fisik**
- Pastikan phone & PC di WiFi yang sama
- App akan connect ke IP PC Anda

### Step 4: Test Login

Di Android app, coba login dengan:
```
Email: user@example.com
Password: password123
```

Atau register user baru dulu.

✅ **Android siap!**

---

## Phase 3: Verify Everything Works (5 menit)

### Check 1: Backend Health

Buka di browser: `http://localhost:8000/api/health`

Respon:
```json
{"message":"Server berjalan dengan baik"}
```

### Check 2: Backend Logs

Di terminal VS Code, Anda akan melihat:
```
📍 GET /api/health
📍 POST /api/auth/login
📍 GET /api/food/all
```

### Check 3: Android App

- Login success ✓
- Can search foods ✓
- Can add food log ✓
- Can see dashboard ✓

---

## Troubleshooting Quick Fix

### "Connection refused" di Android

**Emulator:**
```
Masalah: BASE_URL salah
Solusi: Ubah ke "http://10.0.2.2:8000/api/"
```

**Device:**
```
Masalah: WiFi berbeda
Solusi: 
1. Pastikan phone & PC di network yang sama
2. Dapatkan IP PC: ipconfig
3. Update BASE_URL dengan IP tersebut (port 8000)
```

### "CORS error"

```
Masalah: Backend CORS setting
Solusi: Update .env FRONTEND_URL ke URL Android Anda
FRONTEND_URL=http://10.0.2.2:5000
```

### Database Error

```bash
# PostgreSQL tidak running?
# Windows:
net start postgresql-x64-15

# Mac:
brew services start postgresql

# Linux:
sudo service postgresql start
```

---

## API Testing dengan Postman (Optional)

### Import API Collection

1. Buka Postman
2. New > Import
3. Pilih raw text atau paste ini:

```json
{
  "info": {
    "name": "NutriLog API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/auth/register",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test\",\"age\":25,\"weight\":70,\"height\":175,\"gender\":\"Male\"}"
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/auth/login",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
        }
      }
    },
    {
      "name": "Get Foods",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/food/all"
      }
    }
  ]
}
```

---

## Full Architecture Overview

```
YOUR COMPUTER
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  Terminal 1 (VS Code)              Terminal 2 (Optional) │
│  npm run dev                       (Other tasks)         │
│  └─ Backend Server                                      │
│     Port: 5000                                          │
│     http://localhost:5000                              │
│                                                         │
│  Database                                               │
│  PostgreSQL                                            │
│  nutrilog_db                                           │
│                                                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Network (WiFi/USB)
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
  ┌──────────────┐      ┌──────────────┐
  │   EMULATOR   │      │ PHONE/TABLET │
  │              │      │   (Fisik)    │
  │ Android App  │      │  Android App │
  │              │      │              │
  │10.0.2.2:5000 │      │192.168.1.x:5│
  │              │      │000           │
  └──────────────┘      └──────────────┘
```

---

## Next Steps

### Development

1. **Modify API responses** → Edit file di `src/controllers/`
2. **Add new endpoints** → Create route di `src/routes/`
3. **Change database** → Modify `src/database/setup.js`
4. **Frontend testing** → Use Android emulator atau device

### Production Deployment

1. Setup cloud database (AWS RDS, Heroku Postgres)
2. Deploy backend ke cloud (Heroku, Railway, Render)
3. Update `BASE_URL` di Android ke cloud API
4. Setup SSL/HTTPS

---

## File Structure Reference

```
backend/
├── src/
│   ├── server.js                 ← Main entry point
│   ├── routes/                   ← API endpoints
│   ├── controllers/              ← Business logic
│   ├── middleware/               ← Auth, errors
│   ├── database/                 ← Setup & seed
│   └── config/                   ← Database connection
├── .env                          ← Configuration (JANGAN commit)
├── .env.example                  ← Template (commit ini)
├── package.json                  ← Dependencies
└── [Documentation files]
```

---

## Important Commands Reference

```bash
# Development
npm run dev              # Start with auto-reload
npm run db:setup        # Create tables
npm run db:seed         # Insert sample data

# Production
npm start                # Start server
npm install              # Install dependencies

# Database
npm run db:status        # Check migrations (jika use Prisma)
```

---

## Security Notes ⚠️

### For Development
- JWT_SECRET bisa default
- CORS bisa * (semua)
- No HTTPS needed

### For Production
- **Change JWT_SECRET** ke random string panjang
- **Use HTTPS only**
- **Restrict CORS** ke frontend domain only
- **Use environment variables** untuk sensitive data
- **Enable rate limiting**
- **Validate all inputs**
- **Use database backups**

---

## Support

**Jika ada masalah:**

1. Check terminal logs di VS Code
2. Check Android logcat
3. Use Postman untuk test API
4. Read `BACKEND_SETUP_TUTORIAL.md`
5. Read `ANDROID_CONNECTION_GUIDE.md`

---

## ✅ Completion Checklist

- [ ] Backend running di port 5000
- [ ] Database created & seeded
- [ ] Android configured dengan BASE_URL
- [ ] Login test successful
- [ ] Can search foods
- [ ] Can add food log
- [ ] Dashboard shows data
- [ ] No network errors

**Selesai! Backend & Frontend Anda sekarang terhubung! 🎉**
