# Penjelasan Layout dan UI Website ThinkStep

Dokumen ini berisi panduan dan penjelasan mengenai struktur tata letak (layout) dan desain antarmuka (UI) dari website ThinkStep. Anda dapat menggunakan panduan ini sebagai referensi untuk mengimplementasikan desain dan layout yang serupa pada proyek website lain.

## 1. Teknologi yang Digunakan (Tech Stack)

Website ini dibangun menggunakan stack modern yang sangat mendukung performa dan fleksibilitas desain:
- **Framework Utama**: Next.js (App Router) & React.
- **Styling**: Tailwind CSS v4 (menggunakan file `globals.css` sebagai core styling).
- **Ikonografi**: `lucide-react` (menyediakan ikon SVG yang minimalis dan konsisten).
- **Tema (Dark/Light Mode)**: `next-themes` untuk transisi mode gelap dan terang yang mulus.
- **Font**: Google Fonts (`Inter` untuk teks biasa, `Plus Jakarta Sans` untuk heading/judul).

## 2. Sistem Desain & Tema (Design System)

Desain website ini mengusung gaya **Modern, Bersih, dan Premium** dengan sentuhan **Glassmorphism** (efek kaca buram). Semua desain ini dikendalikan dari file `app/globals.css`.

### A. Tipografi (Typography)
Terdapat dua jenis font utama:
- `--font-display` (Plus Jakarta Sans): Digunakan untuk Heading, Judul, dan Elemen penegas (`text-display-lg`, `text-heading-md`).
- `--font-sans` (Inter): Digunakan untuk body teks, paragraf, dan antarmuka umum (`text-body-md`, `text-body-sm`).

### B. Palet Warna (Color Palette)
Sistem warna menggunakan pendekatan CSS Variables untuk mendukung Dark Mode.
- **Surface (Latar Belakang)**: `--color-surface` (putih di mode terang, hitam keabuan di mode gelap).
- **Ink (Skala Abu-abu)**: `--color-ink-50` hingga `--color-ink-900` untuk teks, border, dan elemen UI netral.
- **Brand**: `--color-brand-main` (biasanya hitam/kontras) untuk tombol utama atau aksen utama.
- **Status**: Menggunakan warna semantik:
  - Success (Hijau): `--color-success-main`
  - Warning/Hint (Kuning/Oranye): `--color-hint-main`
  - Danger (Merah): `--color-danger-main`

### C. Komponen UI Global
Terdapat beberapa komponen utilitas yang langsung dibuat di CSS agar mudah digunakan (bisa di cek di `globals.css`):
1. **Tombol Premium (`.btn-primary`, `.btn-secondary`, `.btn-ghost`)**
   - Dilengkapi efek animasi halus saat disentuh/hover (`transition-all duration-200`, `translate-y-[-1px]`, `scale-[0.98]`).
2. **Input Modern (`.input-base`)**
   - Latar belakang bersih, border tipis, dan efek cincin (ring) saat fokus (focus state).
3. **Card & Glassmorphism (`.card`, `.glass-panel`, `.glass-card`)**
   - `.card`: Kotak putih/gelap biasa dengan shadow lembut.
   - `.glass-panel` / `.glass-card`: Menggunakan `backdrop-blur-xl` dan `bg-surface/80` (background tembus pandang) untuk memberikan efek kaca premium layaknya UI modern iOS/macOS.
4. **Status & Badges (`.status-badge`, `.badge`)**
   - Label status online/offline berbentuk pil kecil dengan titik (dot) yang berdenyut (pulse).
5. **Chat Bubbles (`.chat-bubble`)**
   - Digunakan untuk tampilan percakapan AI, dengan sisi melengkung (rounded) dan ekor pesan yang halus.

---

## 3. Struktur Layout Utama (AppLayout)

Layout utama website menggunakan pola **Dashboard Layout** yang responsif (berbeda untuk Desktop dan Mobile). File utamanya berada di `components/layout/AppLayout.tsx`.

Strukturnya adalah `flex h-screen overflow-hidden` yang membagi layar menjadi beberapa area:

### A. Sidebar (Desktop) / Drawer (Mobile)
- **Desktop**: Tampil sebagai panel tetap (`fixed` atau `static` dengan lebar `w-72`) di sebelah kiri.
- **Mobile**: Tersembunyi (berada di luar layar `-translate-x-full`), dan akan muncul meluncur ke dalam sebagai *Drawer* yang menimpa layar dengan latar transparan hitam (`backdrop-blur-sm`).
- **Isi Sidebar**: Berisi Logo, Profil Pengguna (Siswa/Guru/Ortu), dan Navigasi Menu.

### B. Header (Top Navigation)
- Terletak di atas konten utama (`sticky top-0`).
- Menggunakan efek Glassmorphism (`bg-surface/80 backdrop-blur-xl border-b`).
- Berisi: Tombol hamburger (di mobile), Judul Halaman aktif, Indikator Status Koneksi (Online/Offline), Tombol Tema (Dark Mode), Notifikasi, dan Avatar Profil singkat (di desktop).

### C. Main Content Area (Area Konten Utama)
- Tempat di mana halaman aktual di-render (`{children}`).
- Area ini dapat digulir ke bawah (`overflow-y-auto flex-1`), sementara Sidebar dan Header tetap pada tempatnya.
- Pada tampilan mobile, diberikan jarak padding bawah (`pb-20`) agar konten tidak tertutup oleh navigasi bawah.

### D. Bottom Navigation (Khusus Mobile)
- Karena sidebar disembunyikan di mobile, ada navigasi bawah (`fixed bottom-0`).
- Menggunakan efek Glassmorphism.
- Berisi ikon dan label kecil menu utama yang tersusun sejajar (`flex overflow-x-auto`).

---

## 4. Cara Menggunakan Layout dan UI ini di Proyek Lain

Jika Anda ingin meniru desain ini di website/proyek Next.js lain:

1. **Copy File Konfigurasi Styling**:
   - Pindahkan file `app/globals.css` ke proyek Anda. Pastikan Anda menyesuaikan variabel warnanya jika ingin memiliki *branding* yang berbeda.
   - Install dependencies pendukung: `npm install lucide-react next-themes`.
2. **Copy Font**:
   - Pada file `layout.tsx` (atau layout root proyek Anda), muat font `Inter` dan `Plus_Jakarta_Sans` lalu daftarkan variablenya.
3. **Copy Komponen Layout Utama**:
   - Salin file `components/layout/AppLayout.tsx` (dan dependensinya seperti `ThemeToggle.tsx` dan `NotificationBell.tsx`).
   - Jadikan `AppLayout` ini sebagai pembungkus halaman (wrapper) di root aplikasi atau halaman-halaman yang membutuhkan layout dashboard.
4. **Gunakan Utility Classes**:
   - Alih-alih membuat div panjang berisi Tailwind utilities yang berulang, gunakan class yang sudah dibuat seperti `<button className="btn-primary">Klik</button>` atau `<div className="glass-card">Konten</div>`.
