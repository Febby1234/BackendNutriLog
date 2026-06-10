# 📱 Android Studio Setup - Connect ke Backend

## Step 1: Add Dependencies ke build.gradle.kts (Module: app)

Buka `build.gradle.kts` dan tambahkan di bagian `dependencies`:

```kotlin
dependencies {
    // ... existing dependencies ...
    
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
    
    // DataStore (untuk simpan token)
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Gson
    implementation("com.google.code.gson:gson:2.10.1")
}
```

Sync gradle setelah tambah dependencies.

---

## Step 2: Create API Models

Buat folder `data/model` jika belum ada, kemudian create file:

**File: `app/src/main/java/com/example/nutrilog/data/model/ApiModels.kt`**

```kotlin
package com.example.nutrilog.data.model

import com.google.gson.annotations.SerializedName

// ============ AUTH MODELS ============

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

data class MessageResponse(
    val message: String
)
```

---

## Step 3: Create API Service Interface

**File: `app/src/main/java/com/example/nutrilog/data/api/ApiService.kt`**

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
}
```

---

## Step 4: Create Token Manager

**File: `app/src/main/java/com/example/nutrilog/data/auth/TokenManager.kt`**

```kotlin
package com.example.nutrilog.data.auth

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore by preferencesDataStore(name = "auth_preferences")

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
    
    // Check if logged in
    fun isLoggedIn(): Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[TOKEN_KEY] != null
    }
    
    // Logout
    suspend fun logout() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
```

---

## Step 5: Create Auth Interceptor

**File: `app/src/main/java/com/example/nutrilog/data/api/AuthInterceptor.kt`**

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

## Step 6: Create Retrofit Client

**File: `app/src/main/java/com/example/nutrilog/data/api/RetrofitClient.kt`**

```kotlin
package com.example.nutrilog.data.api

import android.content.Context
import com.squareup.okhttp3.OkHttpClient
import com.squareup.okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    
    // ⚠️ PENTING: Update BASE_URL sesuai setup Anda
    private const val BASE_URL = "http://10.0.2.2:8000/api/"
    
    // Untuk device fisik, ganti ke:
    // private const val BASE_URL = "http://192.168.1.100:8000/api/"
    
    fun createRetrofit(context: Context): Retrofit {
        val httpClient = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            // Add auth interceptor untuk auto-attach token
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
    
    fun getApiService(context: Context): ApiService {
        val retrofit = createRetrofit(context)
        return retrofit.create(ApiService::class.java)
    }
}
```

---

## Step 7: Test Login di MainActivity

**Contoh di MainActivity atau Activity manapun:**

```kotlin
package com.example.nutrilog.ui

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.nutrilog.R
import com.example.nutrilog.data.api.RetrofitClient
import com.example.nutrilog.data.auth.TokenManager
import com.example.nutrilog.data.model.LoginRequest
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {
    
    private lateinit var tokenManager: TokenManager
    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: Button
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)
        
        tokenManager = TokenManager(this)
        emailInput = findViewById(R.id.emailInput)
        passwordInput = findViewById(R.id.passwordInput)
        loginButton = findViewById(R.id.loginButton)
        
        loginButton.setOnClickListener {
            performLogin()
        }
    }
    
    private fun performLogin() {
        val email = emailInput.text.toString().trim()
        val password = passwordInput.text.toString().trim()
        
        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Email dan password harus diisi", Toast.LENGTH_SHORT).show()
            return
        }
        
        lifecycleScope.launch {
            try {
                val apiService = RetrofitClient.getApiService(this@LoginActivity)
                val loginRequest = LoginRequest(email = email, password = password)
                
                val response = apiService.login(loginRequest)
                
                if (response.isSuccessful && response.body() != null) {
                    val authResponse = response.body()!!
                    
                    // Save token
                    tokenManager.saveToken(
                        authResponse.token,
                        authResponse.user.userId.toString()
                    )
                    
                    Toast.makeText(
                        this@LoginActivity,
                        "Login berhasil! ${authResponse.user.name}",
                        Toast.LENGTH_SHORT
                    ).show()
                    
                    // Navigate ke main activity
                    // startActivity(Intent(this@LoginActivity, MainActivity::class.java))
                    // finish()
                } else {
                    Toast.makeText(
                        this@LoginActivity,
                        "Login gagal: ${response.message()}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (e: Exception) {
                Toast.makeText(
                    this@LoginActivity,
                    "Error: ${e.message}",
                    Toast.LENGTH_SHORT
                ).show()
                e.printStackTrace()
            }
        }
    }
}
```

---

## ✅ Backend URL Configuration

**Untuk Emulator (Default):**
```kotlin
private const val BASE_URL = "http://10.0.2.2:8000/api/"
```

**Untuk Device Fisik (Edit sesuai IP PC):**
```kotlin
// 1. Buka Command Prompt di PC, ketik: ipconfig
// 2. Cari "IPv4 Address" (contoh: 192.168.1.100)
// 3. Update BASE_URL:
private const val BASE_URL = "http://192.168.1.100:8000/api/"
```

---

## 🧪 Test Login

Gunakan data ini:
```
Email: user@example.com
Password: password123
```

Atau buat user baru dengan register endpoint.

---

## 🔗 Verify Connection

1. **Check backend running** di terminal:
   ```
   Terminal seharusnya show: 📍 POST /api/auth/login
   ```

2. **Check app logs** di Android Studio Logcat:
   ```
   Logcat akan show HTTP requests & responses
   ```

---

## 📱 Next: Integration Checklist

- [ ] Dependencies added to build.gradle.kts
- [ ] API models created
- [ ] ApiService interface created
- [ ] TokenManager created
- [ ] AuthInterceptor created
- [ ] RetrofitClient created
- [ ] Test login in MainActivity
- [ ] Token saved to DataStore
- [ ] Check backend logs for 📍 requests
- [ ] Navigate to next screen after login success

---

**Backend siap! Sekarang setup di Android Studio! 🚀**
