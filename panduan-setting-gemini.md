# Panduan Setting AI Gemini di Workspace

Dokumen ini menjelaskan langkah-langkah yang perlu Anda lakukan untuk menyetel (setting) dan memaksimalkan penggunaan AI Gemini di lingkungan pengembangan (IDE) Anda.

## 1. Memilih Model AI (Model Selection)
Untuk mendapatkan performa terbaik dalam penulisan kode (*coding*) dan analisis proyek, sangat penting untuk menggunakan model yang paling mutakhir.
*   Buka bagian **Settings** (Pengaturan) di antarmuka AI.
*   Cari bagian **Model Selection**.
*   Pastikan Anda memilih **Gemini 3.1 Pro (High)** (seperti yang baru saja Anda atur). Model *Pro* sangat direkomendasikan karena memiliki logika penalaran yang kuat untuk arsitektur *software* dan *debugging*.

## 2. Memanfaatkan Konteks Workspace
AI Gemini secara otomatis mendeteksi file apa yang sedang Anda kerjakan. Untuk membantu Gemini memahami tugas Anda dengan lebih baik:
*   **Buka file terkait:** Buka file yang ingin Anda edit atau diskusikan di tab editor Anda (misalnya file `page.tsx` atau `route.ts`).
*   **Arahkan kursor:** Terkadang AI menggunakan posisi kursor Anda untuk mengetahui baris kode mana yang sedang Anda fokuskan.
*   **Lokasi Direktori:** Pastikan direktori kerja Anda (contohnya `d:\ThinkStep\thinkstep-app`) sudah dikenali dan merupakan direktori yang benar.

## 3. Fitur Perintah Cepat (Slash Commands)
Untuk mempermudah pekerjaan spesifik atau yang memakan waktu, Anda dapat memanfaatkan perintah *slash* berikut di kolom chat:
*   `/goal` : Gunakan ini jika Anda memiliki tugas yang besar dan kompleks (seperti memfaktorkan ulang seluruh *codebase* atau membuat fitur lengkap semalaman). AI tidak akan berhenti sampai tujuannya selesai.
*   `/schedule` : Berguna jika Anda ingin AI menjalankan tugas secara berkala (misal: "cek error log setiap 1 jam") atau memberikan pengingat waktu.
*   `/grill-me` : Gunakan perintah ini jika Anda sedang merancang sistem namun masih ragu dengan beberapa keputusan desain. AI akan mewawancarai Anda secara interaktif untuk merapikan konsep sebelum *coding* dimulai.

## 4. Alur Kerja "Planning Mode" (Perencanaan)
Untuk permintaan yang rumit atau mengubah banyak file, AI tidak akan langsung menulis kode, melainkan:
1.  **Melakukan Riset:** AI akan membaca file proyek Anda.
2.  **Membuat Rencana:** AI akan menyajikan dokumen rencana kerja (`implementation_plan.md`).
3.  **Meminta Persetujuan:** AI akan berhenti sejenak dan menunggu persetujuan (approval) Anda.
4.  **Eksekusi:** Setelah Anda setuju (bisa dengan menjawab "Lanjutkan" atau "Setuju"), barulah AI mengubah kode-kode Anda.

## 5. Tips Ekstra
*   **Artefak:** Terkadang AI akan membuat dokumen penjelasan, diagram, atau catatan dengan format rapi (disebut artefak). Ini berguna untuk dokumentasi yang persisten (seperti file yang sedang Anda baca ini).
*   **Perintah Terperinci:** Semakin detail spesifikasi desain atau *logic* yang Anda minta, akan semakin akurat kode yang dihasilkan. Jika ingin *styling* khusus (seperti memprioritaskan Vanilla CSS atau animasi responsif), sebutkan secara spesifik di *prompt*.

Dengan menerapkan pengaturan dan memahami fitur-fitur di atas, Anda siap untuk melakukan *pair-programming* bersama Gemini dengan lancar!
