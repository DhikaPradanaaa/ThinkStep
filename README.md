# ThinkStep — Belajar Bersama Lumina AI

ThinkStep adalah platform pembelajaran interaktif berbasis Artificial Intelligence (AI) yang dirancang untuk memandu siswa belajar secara mandiri dengan metode socrates. Bukan sekadar AI yang memberikan jawaban langsung, Lumina AI akan membimbing siswa untuk menemukan jawaban sendiri, merangsang pemikiran kritis dan analitis sesuai dengan prinsip Kurikulum Merdeka.

## ✨ Fitur Utama

- **Lumina AI Tutor**: Chatbot cerdas yang membantu proses berpikir, bukan memberi jawaban. (Ditenagai oleh Gemini AI & Ollama).
- **Dashboard Multi-Peran**: 
  - **Siswa**: Pantau indeks kemandirian, perolehan badge (gamifikasi), dan tugas aktif.
  - **Guru**: Analisis performa siswa, tingkat ketergantungan pada hint, dan manajemen ujian/tugas.
  - **Orang Tua**: Laporan kemajuan belajar siswa secara berkala.
- **Sistem Tugas Pribadi (CRUD)**: Siswa dapat menambahkan, mengubah, menghapus, dan mengatur prioritas tugas pribadi.
- **Ujian Terjadwal & Latihan Essay**: Mendukung berbagai jenis penilaian sekolah.
- **Autentikasi Aman**: Registrasi dan login multi-peran (Siswa, Guru, Orang Tua) menggunakan NextAuth.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: SQLite (untuk lokal/pengembangan) / PostgreSQL (production)
- **Autentikasi**: [NextAuth.js v5](https://authjs.dev/)
- **Styling**: Vanilla CSS (CSS Modules & Global CSS)
- **AI Integration**: Gemini API & Ollama lokal
- **Language**: TypeScript

## 🚀 Cara Menjalankan Secara Lokal

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/DhikaPradanaaa/ThinkStep.git
   cd ThinkStep
   cd thinkstep-app
   ```

2. **Install dependency:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment:**
   Buat file `.env` (atau `.env.local`) di folder `thinkstep-app` dan sesuaikan nilainya:
   ```env
   DATABASE_URL="file:./dev.db"
   AUTH_SECRET="secret-anda-disini"
   NEXTAUTH_URL="http://localhost:3000"
   GEMINI_API_KEY="api-key-gemini-anda"
   OLLAMA_URL="http://127.0.0.1:11434"
   ```

4. **Inisialisasi Database (Prisma):**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   *(Opsional) Masukkan data awal:*
   ```bash
   npx prisma db seed
   ```

5. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

---
*Dibuat untuk mendorong kemandirian belajar anak Indonesia!*
