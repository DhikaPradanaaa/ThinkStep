@echo off
setlocal EnableDelayedExpansion

echo 11111111 11    11 1111111 111    11 11   11       011110  11111111 1111111 11111110
echo    11    11    11   11    1111   11 11  11       11    11    11    11      11    11
echo    11    11111111   11    11 11  11 11111         011110     11    11111   11111110
echo    11    11    11   11    11  11 11 11  11             11    11    11      11
echo    11    11    11 1111111 11   1111 11   11       011110     11    1111111 11
echo.
echo =================================================================================
echo   Instalasi ThinkStep Mode Offline (1-Klik) Windows
echo =================================================================================
echo.

choice /m "Apakah Anda ingin melanjutkan proses instalasi?"
if errorlevel 2 (
    echo Instalasi dibatalkan.
    pause
    exit /b
)

:: 1. Cek & Install Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [1/5] Node.js tidak ditemukan! Sedang menginstal Node.js secara otomatis...
    echo Mohon tunggu sebentar...
    winget install OpenJS.NodeJS -e --silent --accept-package-agreements --accept-source-agreements
    
    :: Menambahkan path node ke environment session saat ini jika diperlukan
    set "PATH=%PATH%;C:\Program Files\nodejs"
    
    node -v >nul 2>&1
    if !errorlevel! neq 0 (
        echo [X] Gagal menginstal Node.js secara otomatis atau CMD perlu direstart.
        echo Silakan tutup jendela ini, lalu install manual dari https://nodejs.org/ dan jalankan ulang script ini.
        pause
        exit /b
    )
    echo Node.js berhasil diinstal!
) else (
    echo [1/5] Node.js sudah terinstal. Lanjut...
)

:: 2. Setup Environment & Pilih AI
echo.
echo [2/5] Menyiapkan konfigurasi environment...
if not exist .env (
    copy .env.example .env >nul
    echo File .env berhasil dibuat dari .env.example.
) else (
    echo File .env sudah ada.
)

echo.
echo ===================================================
echo   PILIHAN MODEL AI LOKAL
echo ===================================================
echo 1. Qwen 2.5 (7B) - Sangat cerdas berbahasa Indonesia (Rekomendasi, ~4.7 GB)
echo 2. Llama 3.1 (8B)- Standar industri, performa penalaran sangat kuat (~4.7 GB)
echo 3. Phi-3 Mini    - Sangat ringan, cocok untuk laptop spek rendah (~2.3 GB)
echo ===================================================
choice /c 123 /m "Pilih Model AI yang ingin diunduh (1/2/3): "

if errorlevel 3 (
    set AI_MODEL=phi3:mini
) else if errorlevel 2 (
    set AI_MODEL=llama3.1
) else if errorlevel 1 (
    set AI_MODEL=qwen2.5:7b
)

echo.
echo Memperbarui konfigurasi aplikasi untuk menggunakan model: !AI_MODEL!
powershell -Command "(Get-Content .env) -replace '^OLLAMA_MODEL=.*', 'OLLAMA_MODEL=\"!AI_MODEL!\"' | Set-Content .env"

:: 3. Install dependensi
echo.
echo [3/5] Menginstal pustaka aplikasi (NPM)... Ini mungkin memakan waktu beberapa menit.
call npm install

:: 4. Setup Database
echo.
echo [4/5] Menyiapkan database lokal...
call npx prisma db push --accept-data-loss
call npx prisma generate
:: Seed error dapat diabaikan jika data sudah ada
call npx prisma db seed

:: 5. Setup Ollama (AI Offline)
echo.
echo [5/5] Menyiapkan AI Lokal (Ollama)...
ollama -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama belum terinstal. Sedang mengunduh OllamaSetup.exe...
    curl -L "https://ollama.com/download/OllamaSetup.exe" -o OllamaSetup.exe
    echo.
    echo Membuka instalasi Ollama... Silakan ikuti instruksi di layar dan klik "Install".
    start /wait OllamaSetup.exe
    echo.
    echo PENTING: Harap pastikan Ollama sudah berjalan (cek icon Llama di taskbar sudut kanan bawah).
    pause
)

echo.
echo Mengunduh model AI (!AI_MODEL!)... Ini memakan waktu tergantung koneksi internet Anda.
call ollama pull !AI_MODEL!

:: 6. Menjalankan aplikasi
echo.
echo ===================================================
echo   INSTALASI SELESAI!
echo ===================================================
echo Memulai server aplikasi...
echo Aplikasi akan otomatis terbuka di browser (http://localhost:3000).
timeout /t 3 >nul
start http://localhost:3000
call npm run dev

endlocal
