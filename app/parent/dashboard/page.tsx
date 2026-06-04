import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import SendReportButton from '@/components/parent/SendReportButton'

export const dynamic = 'force-dynamic'

export default async function ParentDashboard() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (user.role !== 'PARENT') redirect('/student/dashboard')

  // BUG-004 FIX: Filter by schoolId for more relevant student data
  const student = await prisma.user.findFirst({
    where: { role: 'STUDENT', schoolId: user.schoolId ?? undefined },
    include: {
      userStats: true,
      sessions: {
        take: 5,
        orderBy: { startedAt: 'desc' },
        include: { question: { select: { subject: true, topic: true } } }
      }
    }
  })

  return (
    <AppLayout role="PARENT" userName={user.name || 'Orang Tua'} avatarColor={user.avatarColor}>
      {/* Premium Hero Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-hero -z-10 opacity-70 mask-image-b" />
      
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-2 fade-in">
          <h1 className="text-display-md text-gradient text-gradient-primary">
            Halo, {user.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-body-lg text-text-secondary font-medium">
            Pantau perkembangan belajar anak Anda setiap saat.
          </p>
        </div>

        {/* Fitur Demo: Tombol Email */}
        <div className="slide-up" style={{ animationDelay: '100ms' }}>
          <SendReportButton />
        </div>

        {student ? (
          <div className="space-y-8 slide-up" style={{ animationDelay: '200ms' }}>
            
            {/* Student Info Card */}
            <div className="glass-card p-6 flex items-center gap-6">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-display font-bold text-white shadow-lg shadow-brand-main/30 transform hover:scale-105 transition-transform"
                style={{ background: `linear-gradient(135deg, ${student.avatarColor}, var(--color-brand-main))` }}
              >
                {student.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-heading-lg text-ink-900">{student.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge-base bg-surface border border-border text-text-secondary">
                    Siswa Kelas {student.gradeLevel || '8'}
                  </span>
                  <span className="badge-base bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Akun Tertaut
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card hover-lift p-6">
                <p className="text-label-sm text-text-secondary uppercase tracking-wider mb-2">Total Poin XP</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center text-2xl">⭐</div>
                  <div className="text-display-sm text-ink-900 font-bold">{student.userStats?.totalPoints || 0}</div>
                </div>
              </div>
              <div className="glass-card hover-lift p-6">
                <p className="text-label-sm text-text-secondary uppercase tracking-wider mb-2">Soal Diselesaikan</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center text-2xl">📖</div>
                  <div className="text-display-sm text-ink-900 font-bold">{student.userStats?.totalCorrect || 0}</div>
                </div>
              </div>
              <div className="glass-card hover-lift p-6">
                <p className="text-label-sm text-text-secondary uppercase tracking-wider mb-2">Indeks Kemandirian</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">🧠</div>
                  <div className="text-display-sm text-ink-900 font-bold">{student.userStats?.autonomyIndex || 0}%</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-8">
              <h3 className="text-heading-sm text-ink-900 mb-6 flex items-center gap-2">
                ⏱️ Aktivitas Belajar Terakhir
              </h3>
              
              {student.sessions.length > 0 ? (
                <div className="space-y-4">
                  {student.sessions.map((s) => (
                    <div key={s.id} className="flex justify-between items-center p-4 rounded-xl bg-surface-alt border border-border hover:border-brand-main/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                          {s.isCorrect ? '✅' : '📝'}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">{s.subject} <span className="text-text-muted font-normal">— {s.question?.topic}</span></p>
                          <p className="text-sm text-text-secondary mt-1">{new Date(s.startedAt).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`badge-base mb-1 inline-block ${s.isCorrect ? 'bg-success-light text-success-dark border border-success-main/20' : 'bg-surface border border-border text-text-secondary'}`}>
                          {s.isCorrect ? 'Selesai' : 'Belum Selesai'}
                        </div>
                        <div className="text-xs text-text-muted font-medium block">
                          Menggunakan {s.hintsUsed} Bantuan
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-text-secondary">Anak Anda belum memulai sesi belajar.</p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="glass-card p-12 text-center slide-up" style={{ animationDelay: '200ms' }}>
            <div className="w-20 h-20 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-6 text-4xl">
              👨‍👩‍👧
            </div>
            <h2 className="text-heading-md text-ink-900 mb-2">Menunggu Data Siswa</h2>
            <p className="text-text-secondary max-w-md mx-auto">
              Akun Anda belum terhubung dengan data anak Anda. Pastikan anak Anda menggunakan kode sekolah yang sama atau undang mereka untuk bergabung.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
