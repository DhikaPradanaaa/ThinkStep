import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Brain, ShieldCheck, Target, Sparkles, BookOpen, Mail, User } from 'lucide-react'
import ContactForm from '@/components/landing/ContactForm'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-ink-100/50 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-main/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-ink-200/40 blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-panel flex items-center justify-between px-6 py-4 mx-4 mt-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-ink-900 flex items-center justify-center shadow-md overflow-hidden relative">
            <Image src="/logo-light.png" alt="ThinkStep Logo" fill className="object-cover dark:hidden" />
            <Image src="/logo-dark.png" alt="ThinkStep Logo" fill className="object-cover hidden dark:block" />
          </div>
          <span className="font-bold text-xl tracking-tight text-text-primary font-display">
            ThinkStep
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-alt border border-border text-xs font-bold text-text-secondary tracking-widest uppercase">
            <ShieldCheck size={14} className="text-success-main" />
            LIDM 2026
          </div>
          <Link href="/login">
            <button className="btn-primary rounded-xl px-6 py-2.5 shadow-lg shadow-brand-main/20">
              Masuk <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-16 sm:px-6 sm:py-24 md:py-32 w-full max-w-5xl mx-auto">
        <div className="slide-up mb-6 md:mb-8">
          <span className="inline-flex items-center gap-2 bg-surface/60 backdrop-blur-md border border-border/80 shadow-sm rounded-full px-4 py-1.5 md:px-5 md:py-2 text-[10px] sm:text-xs md:text-sm font-semibold text-text-secondary">
            <Sparkles size={14} className="text-text-primary md:w-4 md:h-4" /> Sesuai Regulasi Pendidikan 2026
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-display-md lg:text-display-lg font-extrabold tracking-tight leading-[1.15] md:leading-[1.1] slide-up mb-6 md:mb-8 text-text-primary max-w-4xl mx-auto drop-shadow-sm">
          Bukan AI yang Menjawab —<br className="hidden md:block" />
          Tapi AI yang <span className="text-text-muted">Membimbing</span><br className="hidden md:block" />
          Kamu Menemukan Jawaban.
        </h1>

        <p className="text-sm sm:text-base md:text-body-lg slide-up text-text-secondary max-w-2xl mx-auto mb-8 md:mb-12 delay-100 leading-relaxed">
          ThinkStep menggunakan <strong>Lumina AI</strong> — sistem tutor pintar yang memandu siswa berpikir analitis melalui metode bimbingan terstruktur.
        </p>

        <div className="slide-up flex flex-col sm:flex-row w-full sm:w-auto gap-3 md:gap-4 justify-center delay-200">
          <Link href="/login" className="w-full sm:w-auto">
            <button className="btn-primary w-full sm:w-auto py-3.5 px-6 md:py-4 md:px-10 text-sm md:text-base font-semibold rounded-xl shadow-xl shadow-brand-main/20">
              Mulai Belajar Sekarang
            </button>
          </Link>
          <Link href="#features" className="w-full sm:w-auto">
            <button className="btn-secondary w-full sm:w-auto py-3.5 px-6 md:py-4 md:px-10 text-sm md:text-base font-semibold rounded-xl bg-surface/60 backdrop-blur-md">
              Pelajari Lebih Lanjut
            </button>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="relative z-10 px-6 py-24 bg-surface-alt/50 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-heading-lg md:text-display-sm text-text-primary mb-5">Satu Platform, Tiga Pendekatan</h2>
            <p className="text-body-md text-text-secondary max-w-2xl mx-auto">
              Didesain khusus untuk ekosistem pendidikan modern dengan transparansi penuh untuk siswa, guru, dan orang tua.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card card-hover group p-8 rounded-3xl bg-surface shadow-sm border-border">
              <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-border flex items-center justify-center mb-6 text-text-primary group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Brain size={28} />
              </div>
              <h3 className="text-heading-md mb-4 text-text-primary">Bimbingan Lumina AI</h3>
              <p className="text-body-md text-text-secondary">
                Siswa dipandu secara bertahap (scaffolding). Mereka akan berdiskusi dan dibimbing menemukan alur berpikir mandiri. Tidak ada *shortcut* ke kunci jawaban.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card card-hover group p-8 rounded-3xl bg-surface shadow-sm border-border">
              <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-border flex items-center justify-center mb-6 text-text-primary group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <Target size={28} />
              </div>
              <h3 className="text-heading-md mb-4 text-text-primary">Pemantauan Guru</h3>
              <p className="text-body-md text-text-secondary">
                Guru memiliki kontrol penuh atas bank soal. Metrik pemahaman dan kendala siswa dapat dilacak secara real-time di Dashboard Guru.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card card-hover group p-8 rounded-3xl bg-surface shadow-sm border-border">
              <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-border flex items-center justify-center mb-6 text-text-primary group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <BookOpen size={28} />
              </div>
              <h3 className="text-heading-md mb-4 text-text-primary">Laporan Orang Tua</h3>
              <p className="text-body-md text-text-secondary">
                Sistem mengirimkan ringkasan kemajuan belajar mingguan langsung kepada orang tua untuk menjamin transparansi pendidikan di rumah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Biodata & Contact Section */}
      <section className="relative z-10 px-6 py-24 bg-surface border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-heading-lg md:text-display-sm text-text-primary mb-5">Di Balik Layar ThinkStep</h2>
            <p className="text-body-md text-text-secondary max-w-2xl mx-auto">
              Berkomitmen untuk masa depan pendidikan Indonesia yang lebih adaptif dan memberdayakan.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-10 items-center justify-center bg-surface-alt p-8 md:p-12 rounded-3xl border border-border shadow-sm mb-16">
            <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 bg-brand-main rounded-full flex items-center justify-center text-brand-text shadow-lg border-4 border-surface overflow-hidden relative">
              <Image 
                src="/profile.jpg" 
                alt="Dhika Pradana - Chief Technology Officer" 
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 128px, 160px"
              />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-display-sm text-text-primary font-bold font-display mb-1">Dhika Pradana</h3>
              <p className="text-brand-main font-semibold text-sm uppercase tracking-widest mb-4 italic">
                Chief Technology Officer
              </p>
              <blockquote className="text-body-md md:text-body-lg text-text-secondary italic border-l-4 border-brand-main/30 pl-4 py-1">
                "ThinkStep dibuat untuk membantu mutu pendidikan Indonesia. AI adalah alat yang seharusnya digunakan untuk membimbing."
              </blockquote>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-border bg-surface-alt text-center">
        <div className="flex items-center justify-center gap-3 mb-4 opacity-80">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-ink-900 overflow-hidden relative shadow-sm">
            <Image src="/logo-light.png" alt="ThinkStep Logo" fill className="object-cover dark:hidden" />
            <Image src="/logo-dark.png" alt="ThinkStep Logo" fill className="object-cover hidden dark:block" />
          </div>
          <span className="font-bold text-ink-500 font-display text-lg">ThinkStep</span>
        </div>
        <p className="text-text-muted text-sm">
          © 2026 Tim ThinkStep. Dibuat untuk Lomba Inovasi Digital Mahasiswa (LIDM).
        </p>
      </footer>
    </div>
  )
}
