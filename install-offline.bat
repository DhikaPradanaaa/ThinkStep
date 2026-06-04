@echo off
setlocal
echo ===================================================
echo   Instalasi ThinkStep Mode Offline (1-Klik) Windows
echo ===================================================

:: 1. Cek Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js tidak ditemukan! Silakan install dari https://nodejs.org/
    pause
    exit /b
)

:: 2. Install dependensi
echo.
echo [1/5] Menginstal pustaka aplikasi (NPM)...
call npm install

:: 3. Setup Environment
echo.
echo [2/5] Menyiapkan konfigurasi environment...
if not exist .env (
    copy .env.example .env >nul
    echo File .env berhasil dibuat dari .env.example.
) else (
    echo File .env sudah ada, mengabaikan pembuatan.
)

:: 4. Setup Database
echo.
echo [3/5] Menyiapkan database lokal...
call npx prisma db push
call npx prisma generate
call npx prisma db seed

:: 5. Setup Ollama (AI Offline)
echo.
echo [4/5] Menyiapkan AI Lokal (Ollama)...
ollama -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama belum terinstal. Sedang mengunduh OllamaSetup.exe...
    curl -L "https://ollama.com/download/OllamaSetup.exe" -o OllamaSetup.exe
    echo Membuka instalasi Ollama... Silakan klik "Install" pada jendela yang muncul.
    start /wait OllamaSetup.exe
    echo Harap pastikan Ollama sudah berjalan (cek icon Llama di taskbar sudut kanan bawah).
    pause
)

echo Mengunduh model AI (Qwen 2.5 7B)... Ini akan memakan waktu tergantung koneksi internet (sekitar 4.7GB).
call ollama pull qwen2.5:7b

:: 6. Menjalankan aplikasi
echo.
echo [5/5] Memulai server aplikasi...
echo Aplikasi akan terbuka di browser Anda (http://localhost:3000).
timeout /t 3 >nul
start http://localhost:3000
call npm run dev

endlocal
