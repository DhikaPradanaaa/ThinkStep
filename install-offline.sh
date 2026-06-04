#!/bin/bash

echo "==================================================="
echo "  Instalasi ThinkStep Mode Offline (1-Klik) Unix"
echo "==================================================="

# 1. Cek Node.js
if ! command -v node &> /dev/null; then
    echo "[X] Node.js tidak ditemukan! Silakan install dari https://nodejs.org/"
    exit 1
fi

# 2. Install dependensi
echo ""
echo "[1/5] Menginstal pustaka aplikasi (NPM)..."
npm install

# 3. Setup Environment
echo ""
echo "[2/5] Menyiapkan konfigurasi environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "File .env berhasil dibuat dari .env.example."
else
    echo "File .env sudah ada, mengabaikan pembuatan."
fi

# 4. Setup Database
echo ""
echo "[3/5] Menyiapkan database lokal..."
npx prisma db push
npx prisma generate
npx prisma db seed

# 5. Setup Ollama
echo ""
echo "[4/5] Menyiapkan AI Lokal (Ollama)..."
if ! command -v ollama &> /dev/null; then
    echo "Ollama belum terinstal. Sedang menginstal Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

echo "Mengunduh model AI (Qwen 2.5 7B)... Ini akan memakan waktu tergantung koneksi internet (sekitar 4.7GB)."
ollama pull qwen2.5:7b

# 6. Menjalankan aplikasi
echo ""
echo "[5/5] Memulai server aplikasi..."
echo "Aplikasi akan berjalan di http://localhost:3000"
sleep 2
# Optional: buka browser otomatis jika di macOS atau Linux desktop
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 &
fi

npm run dev
