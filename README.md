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

## 🚀 Cara Menjalankan Aplikasi

Kami telah menyediakan skrip **Instalasi 1-Klik** untuk menjalankan aplikasi secara lokal dan offline (menggunakan AI Ollama secara lokal, tanpa kunci API tambahan). 

### Opsi 1: Mode Offline (Instalasi 1-Klik Terotomatisasi) 🌟

Pastikan kamu sudah mengunduh / melakukan `git clone` repositori ini:
```bash
git clone https://github.com/DhikaPradanaaa/ThinkStep.git
cd ThinkStep/thinkstep-app
```

Bagi **pengguna Windows**:
- Cukup **klik dua kali** (double click) pada file `install-offline.bat`.

Bagi **pengguna macOS/Linux**:
- Buka terminal di folder aplikasi dan jalankan: `bash install-offline.sh`

Skrip ini secara otomatis akan:
1. Menginstal semua library Node.js.
2. Membuat file lingkungan (`.env`).
3. Mengatur database dan mengisinya dengan data awal.
4. Mengecek, mengunduh, dan menginstal AI Lokal (Ollama) beserta model ringan `Qwen 2.5 7B`.
5. Menjalankan aplikasi secara otomatis.

---

Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

---
*Dibuat untuk mendorong kemandirian belajar anak Indonesia!*
