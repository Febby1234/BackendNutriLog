# 🔗 Panduan Koneksi Android ke Backend NutriLog

## Daftar Isi
1. [Setup Network](#setup-network)
2. [Konfigurasi Retrofit](#konfigurasi-retrofit)
3. [Implementasi Authentication](#implementasi-authentication)
4. [API Data Models](#api-data-models)
5. [Implementasi API Calls](#implementasi-api-calls)
6. [Interceptor & Error Handling](#interceptor--error-handling)
7. [Testing di Android](#testing-di-android)

---

## Setup Network

### Schematic: Architecture Komunikasi

```
┌─────────────────────────────────┐
│   Android Studio (Emulator)     │
│                                  │
│   URL: http://10.0.2.2:5000     │
└────────────────────┬────────────┘
                     │
                     │ Network Call
                     │
┌────────────────────▼────────────┐
│   VS Code (Backend Server)       │
│   Node.js Express Server         │
│   Port: 5000                     │
│   Process: npm run dev           │
└─────────────────────────────────┘
```

### Untuk Device Fisik:

```
┌─────────────────────────────────┐
│   Android Device (Fisik)        │
│   WiFi: HomeNetwork             │
│   URL: http://192.168.1.100:5000│
└────────────────────┬────────────┘
                     │
                     │ WiFi Network
                     │
┌────────────────────▼────────────┐
│   PC (Backend Server)            │
│   IP: 192.168.1.100              │
│   Port: 5000                     │
└─────────────────────────────────┘
```

---

## Konfigurasi Retrofit

### Step 1: Add Dependencies

File: `build.gradle.kts` (Module: app)

```kotlin
dependencies {
    // Retrofit & Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.11.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    
    // Lifecycle & ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    
    // Data Store (untuk menyimpan token)
    implementation("androidx.datastore:datastore-preferences:1.0.0")
}
```

### Step 2: Create API Service Interface

File: `app/src/main/java/com/example/nutrilog/data/api/ApiService.kt`

```kotlin
package com.example.nutrilog.data.api

import com.example.nutrilog.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // ============ AUTH ENDPOINTS ============
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>
    
    @GET("auth/profile")
    suspend fun getProfile(): Response<UserProfile>
    
    // ============ FOOD ENDPOINTS ============
    
    @GET("food/all")
    suspend fun getAllFoods(): Response<List<FoodItem>>
    
    @GET("food/search")
    suspend fun searchFoods(@Query("query") query: String): Response<List<FoodItem>>
    
    @GET("food/{foodId}")
    suspend fun getFoodById(@Path("foodId") foodId: Int): Response<FoodItem>
    
    // ============ LOG ENDPOINTS ============
    
    @POST("log/add")
    suspend fun addFoodLog(@Body request: AddFoodLogRequest): Response<DailyLogResponse>
    
    @GET("log/today")
    suspend fun getTodayLog(): Response<DailyLogResponse>
    
    @GET("log/{date}")
    suspend fun getLogByDate(@Path("date") date: String): Response<DailyLogResponse>
    
    @DELETE("log/{itemId}")
    suspend fun deleteLogItem(@Path("itemId") itemId: Int): Response<MessageResponse>
    
    // ============ DASHBOARD ENDPOINTS ============
    
    @GET("dashboard/summary")
    suspend fun getDashboardSummary(): Response<DashboardSummary>
    
    @GET("dashboard/weekly-stats")
    suspend fun getWeeklyStats(): Response<List<WeeklyStatItem>>
}
```

### Step 3: Create Retrofit Client

File: `app/src/main/java/com/example/nutrilog/data/api/RetrofitClient.kt`

```kotlin
package com.example.nutrilog.data.api

import android.content.Context
import androidx.datastore.preferences.preferencesDataStore
import com.squareup.okhttp3.OkHttpClient
import com.squareup.okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

// DataStore untuk menyimpan token
val Context.dataStore by preferencesDataStore(name = "auth_preferences")

object RetrofitClient {
    
    // ⚠️ PENTING: Sesuaikan BASE_URL sesuai setup Anda
    private const val BASE_URL_EMULATOR = "http://10.0.2.2:5000/api/"
    private const val BASE_URL_DEVICE = "http://192.168.1.100:5000/api/"  // Ganti IP Anda
    
    // Gunakan BASE_URL_EMULATOR untuk emulator
    // Gunakan BASE_URL_DEVICE untuk device fisik
    private const val BASE_URL = BASE_URL_EMULATOR
    
    // Buat Retrofit instance
    fun createRetrofit(context: Context): Retrofit {
        val httpClient = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            // Add auth interceptor
            .addInterceptor(AuthInterceptor(context))
            // Add logging untuk development
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .build()
        
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(httpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    // Lazy initialize Retrofit
    fun getApiService(context: Context): ApiService {
        val retrofit = createRetrofit(context)
        return retrofit.create(ApiService::class.java)
    }
}
```

---

## Implementasi Authentication

### Step 1: Create Auth Request/Response Models

File: `app/src/main/java/com/example/nutrilog/data/model/AuthModels.kt`

```kotlin
package com.example.nutrilog.data.model

import com.google.gson.annotations.SerializedName

// ============ REQUEST MODELS ============

data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val age: Int,
    val weight: Float,
    val height: Float,
    val gender: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

// ============ RESPONSE MODELS ============

data class AuthResponse(
    val message: String,
    val token: String,
    val user: UserData
)

data class UserData(
    @SerializedName("userId")
    val userId: Int,
    val email: String,
    val name: String,
    val age: Int,
    val weight: Float,
    val height: Float,
    val gender: String,
    val role: String,
    val bmr: Int,
    val dailyTargetCalories: Int
)

data class UserProfile(
    @SerializedName("userId")
    val userId: Int,
    val email: String,
    val name: String,
    val age: Int,
    val weight: Float,
    val height: Float,
    val gender: String,
    val role: String,
    val bmr: Int,
    val dailyTargetCalories: Int
)

data class MessageResponse(
    val message: String
)
```

### Step 2: Create Token Manager

File: `app/src/main/java/com/example/nutrilog/data/auth/TokenManager.kt`

```kotlin
package com.example.nutrilog.data.auth

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.example.nutrilog.data.api.dataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class TokenManager(private val context: Context) {
    
    companion object {
        private val TOKEN_KEY = stringPreferencesKey("auth_token")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
    }
    
    // Save token dan user ID
    suspend fun saveToken(token: String, userId: String) {
        context.dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = token
            preferences[USER_ID_KEY] = userId
        }
    }
    
    // Get token
    fun getToken(): Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[TOKEN_KEY]
    }
    
    // Get user ID
    fun getUserId(): Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[USER_ID_KEY]
    }
    
    // Check apakah user sudah login
    fun isLoggedIn(): Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[TOKEN_KEY] != null
    }
    
    // Logout - clear token
    suspend fun logout() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
```

### Step 3: Create Auth Interceptor

File: `app/src/main/java/com/example/nutrilog/data/api/AuthInterceptor.kt`

```kotlin
package com.example.nutrilog.data.api

import android.content.Context
import androidx.datastore.preferences.core.stringPreferencesKey
import com.squareup.okhttp3.Interceptor
import com.squareup.okhttp3.Response
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

class AuthInterceptor(private val context: Context) : Interceptor {
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Jika request sudah punya auth header, lanjutkan saja
        if (originalRequest.header("Authorization") != null) {
            return chain.proceed(originalRequest)
        }
        
        // Ambil token dari DataStore
        val token = runBlocking {
            context.dataStore.data.first()[stringPreferencesKey("auth_token")]
        }
        
        // Jika ada token, tambahkan ke header
        val newRequest = if (token != null) {
            originalRequest.newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }
        
        return chain.proceed(newRequest)
    }
}
```

---

## API Data Models

File: `app/src/main/java/com/example/nutrilog/data/model/ApiModels.kt`

```kotlin
package com.example.nutrilog.data.model

import com.google.gson.annotations.SerializedName

// ============ FOOD MODELS ============

data class FoodItem(
    @SerializedName("food_id")
    val foodId: Int,
    val name: String,
    @SerializedName("calories_per_serving")
    val caloriesPerServing: Float,
    @SerializedName("protein_g")
    val proteinG: Float,
    @SerializedName("fat_g")
    val fatG: Float,
    @SerializedName("carbs_g")
    val carbsG: Float
)

// ============ LOG MODELS ============

data class AddFoodLogRequest(
    @SerializedName("foodId")
    val foodId: Int,
    @SerializedName("servingQuantity")
    val servingQuantity: Float,
    val date: String  // Format: "2024-01-15"
)

data class DailyLogResponse(
    @SerializedName("logId")
    val logId: Int?,
    @SerializedName("userId")
    val userId: Int,
    val date: String,
    val items: List<LogItem>,
    @SerializedName("totalCaloriesConsumed")
    val totalCaloriesConsumed: Float
)

data class LogItem(
    @SerializedName("itemId")
    val itemId: Int,
    @SerializedName("foodId")
    val foodId: Int,
    val name: String,
    @SerializedName("servingQuantity")
    val servingQuantity: Float,
    @SerializedName("consumedCalories")
    val consumedCalories: Float,
    @SerializedName("caloriesPerServing")
    val caloriesPerServing: Float,
    @SerializedName("proteinG")
    val proteinG: Float,
    @SerializedName("fatG")
    val fatG: Float,
    @SerializedName("carbsG")
    val carbsG: Float
)

// ============ DASHBOARD MODELS ============

data class DashboardSummary(
    @SerializedName("todayCalories")
    val todayCalories: Int,
    @SerializedName("targetCalories")
    val targetCalories: Int,
    val bmr: Int,
    @SerializedName("caloriesRemaining")
    val caloriesRemaining: Int,
    val macronutrients: Macronutrients,
    @SerializedName("healthProfile")
    val healthProfile: HealthProfile,
    @SerializedName("todayItems")
    val todayItems: List<LogItem>,
    @SerializedName("recentLogs")
    val recentLogs: List<RecentLog>
)

data class Macronutrients(
    val protein: Float,
    val fat: Float,
    val carbs: Float
)

data class HealthProfile(
    @SerializedName("profileId")
    val profileId: Int,
    val age: Int,
    val gender: String,
    @SerializedName("weightKg")
    val weightKg: Float,
    @SerializedName("heightCm")
    val heightCm: Float,
    @SerializedName("dailyTargetCalories")
    val dailyTargetCalories: Int,
    @SerializedName("bmrResult")
    val bmrResult: Int
)

data class RecentLog(
    @SerializedName("logId")
    val logId: Int,
    val date: String,
    @SerializedName("totalCalories")
    val totalCalories: Int,
    @SerializedName("itemCount")
    val itemCount: Int
)

data class WeeklyStatItem(
    val date: String,
    val calories: Int,
    val protein: Float,
    val fat: Float,
    val carbs: Float
)
```

---

## Implementasi API Calls

### Repository Pattern

File: `app/src/main/java/com/example/nutrilog/data/repository/AuthRepository.kt`

```kotlin
package com.example.nutrilog.data.repository

import android.content.Context
import com.example.nutrilog.data.api.ApiService
import com.example.nutrilog.data.api.RetrofitClient
import com.example.nutrilog.data.auth.TokenManager
import com.example.nutrilog.data.model.LoginRequest
import com.example.nutrilog.data.model.RegisterRequest
import com.example.nutrilog.util.ApiResult

class AuthRepository(private val context: Context) {
    
    private val apiService: ApiService = RetrofitClient.getApiService(context)
    private val tokenManager = TokenManager(context)
    
    suspend fun register(
        email: String,
        password: String,
        name: String,
        age: Int,
        weight: Float,
        height: Float,
        gender: String
    ): ApiResult {
        return try {
            val request = RegisterRequest(
                email = email,
                password = password,
                name = name,
                age = age,
                weight = weight,
                height = height,
                gender = gender
            )
            
            val response = apiService.register(request)
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                tokenManager.saveToken(body.token, body.user.userId.toString())
                ApiResult.Success(body)
            } else {
                ApiResult.Error(response.message() ?: "Registrasi gagal")
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Terjadi kesalahan")
        }
    }
    
    suspend fun login(email: String, password: String): ApiResult {
        return try {
            val request = LoginRequest(email = email, password = password)
            val response = apiService.login(request)
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                tokenManager.saveToken(body.token, body.user.userId.toString())
                ApiResult.Success(body)
            } else {
                ApiResult.Error(response.message() ?: "Login gagal")
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Terjadi kesalahan")
        }
    }
    
    suspend fun logout() {
        tokenManager.logout()
    }
    
    fun isLoggedIn() = tokenManager.isLoggedIn()
}
```

### ViewModel untuk Login

File: `app/src/main/java/com/example/nutrilog/presentation/viewmodel/LoginViewModel.kt`

```kotlin
package com.example.nutrilog.presentation.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.nutrilog.data.repository.AuthRepository
import com.example.nutrilog.util.ApiResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LoginViewModel(private val context: Context) : ViewModel() {
    
    private val authRepository = AuthRepository(context)
    
    private val _loginState = MutableStateFlow<LoginState>(LoginState.Idle)
    val loginState: StateFlow<LoginState> = _loginState.asStateFlow()
    
    fun login(email: String, password: String) {
        viewModelScope.launch {
            _loginState.value = LoginState.Loading
            
            val result = authRepository.login(email, password)
            
            _loginState.value = when (result) {
                is ApiResult.Success -> {
                    LoginState.Success(result.data)
                }
                is ApiResult.Error -> {
                    LoginState.Error(result.message)
                }
            }
        }
    }
}

sealed class LoginState {
    object Idle : LoginState()
    object Loading : LoginState()
    data class Success(val data: Any) : LoginState()
    data class Error(val message: String) : LoginState()
}
```

---

## Interceptor & Error Handling

File: `app/src/main/java/com/example/nutrilog/util/ApiResult.kt`

```kotlin
package com.example.nutrilog.util

sealed class ApiResult {
    data class Success(val data: Any) : ApiResult()
    data class Error(val message: String) : ApiResult()
}
```

---

## Testing di Android

### Manual Testing dengan Postman

```bash
# 1. Register
POST http://10.0.2.2:5000/api/auth/register
Body:
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "age": 25,
  "weight": 70,
  "height": 175,
  "gender": "Male"
}

# Simpan token dari response

# 2. Search Foods
GET http://10.0.2.2:5000/api/food/search?query=nasi

# 3. Add Food Log
POST http://10.0.2.2:5000/api/log/add
Header: Authorization: Bearer {token}
Body:
{
  "foodId": 1,
  "servingQuantity": 1.5,
  "date": "2024-01-15"
}
```

### Unit Testing

File: `app/src/test/java/com/example/nutrilog/data/repository/AuthRepositoryTest.kt`

```kotlin
package com.example.nutrilog.data.repository

import junit.framework.TestCase
import org.junit.Test

class AuthRepositoryTest : TestCase() {
    
    @Test
    fun testLoginSuccess() {
        // TODO: Implement test dengan mock
    }
    
    @Test
    fun testLoginError() {
        // TODO: Implement test dengan mock
    }
}
```

---

## Checklist Implementasi

- [ ] Add Retrofit & Coroutines dependencies
- [ ] Create ApiService interface
- [ ] Setup RetrofitClient dengan BASE_URL yang benar
- [ ] Create token manager untuk menyimpan auth token
- [ ] Implement AuthInterceptor untuk menambah Bearer token
- [ ] Create data models untuk request/response
- [ ] Implement AuthRepository dengan login/register
- [ ] Create LoginViewModel
- [ ] Update UI untuk menangani loading state
- [ ] Test login flow di emulator/device
- [ ] Test food search functionality
- [ ] Test add food log functionality
- [ ] Test dashboard summary API

---

## Common Issues & Solutions

| Issue | Solusi |
|-------|--------|
| `Connection refused on 10.0.2.2:5000` | Pastikan backend running di terminal VS Code |
| `401 Unauthorized` | Token tidak valid atau header format salah |
| `CORS error` | Update `FRONTEND_URL` di backend `.env` |
| `timeout` | Perbesar timeout di OkHttpClient (sudah 30s di code) |
| `Token not saved` | Pastikan DataStore initialized dengan benar |

---

**Backend siap dikoneksikan ke Android! 🚀**
