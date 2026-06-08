import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import SendReportButton from '@/components/parent/SendReportButton'
import AddChildButton from '@/components/parent/AddChildButton'
import ChildCard from '@/components/parent/ChildCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ParentDashboard() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  if ((session.user as any).onboardingCompleted === false) {
    redirect('/onboarding')
  }

  const user = session.user as any
  if (user.role !== 'PARENT') redirect('/student/dashboard')

  // Dapatkan anak yang di-link
  const links = await prisma.parentStudentLink.findMany({
    where: { parentId: user.id },
    include: {
      student: {
        include: {
          userStats: true,
          sessions: {
            take: 5,
            orderBy: { startedAt: 'desc' },
            include: { question: { select: { subject: true, topic: true } } }
          },
          studentWritingSessions: {
            where: { status: 'IN_PROGRESS' },
            include: { assignment: true }
          }
        }
      }
    }
  });

  const children = links.map(l => l.student);

  return (
    <AppLayout role="PARENT" userName={user.name || 'Orang Tua'} avatarColor={user.avatarColor}>
      {/* Premium Hero Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-80 bg-gradient-hero -z-10 opacity-70 mask-image-b" />
      
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 fade-in">
          <div className="space-y-2">
            <h1 className="text-display-md text-gradient text-gradient-primary">
              Halo, {user.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-body-lg text-text-secondary font-medium">
              Pantau perkembangan belajar anak Anda setiap saat.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <SendReportButton />
            <AddChildButton />
          </div>
        </div>

        {children.length > 0 ? (
          <div className="space-y-8 slide-up" style={{ animationDelay: '200ms' }}>
            
            {children.map(student => (
              <div key={student.id} className="space-y-6 mb-12">
                <ChildCard student={student} />

                {/* Tugas Belum Selesai */}
                {student.studentWritingSessions.length > 0 && (
                  <div className="glass-card p-6 border-amber-200 border">
                    <h3 className="text-heading-sm text-text-primary mb-4 flex items-center gap-2">
                      ⚠️ Tugas Belum Dikumpulkan
                    </h3>
                    <div className="space-y-3">
                      {student.studentWritingSessions.map(ws => (
                        <div key={ws.id} className="flex justify-between items-center bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                          <div>
                            <p className="font-bold text-amber-900">{ws.assignment.title}</p>
                            <p className="text-xs text-amber-700 mt-1">
                              Tenggat: {new Date(ws.assignment.deadline).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <span className="badge-base bg-amber-100 text-amber-800">Sedang Dikerjakan</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="glass-card p-6">
                  <h3 className="text-heading-sm text-text-primary mb-4 flex items-center gap-2">
                    ⏱️ Aktivitas Belajar Terakhir
                  </h3>
                  
                  {student.sessions.length > 0 ? (
                    <div className="space-y-3">
                      {student.sessions.map((s) => (
                        <div key={s.id} className="flex justify-between items-center p-4 rounded-xl bg-surface-alt border border-border hover:border-brand-main/30 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                              {s.isCorrect ? '✅' : '📝'}
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary">{s.subject} <span className="text-text-muted font-normal">— {s.question?.topic}</span></p>
                              <p className="text-sm text-text-secondary mt-1">{new Date(s.startedAt).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`badge-base mb-1 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${s.isCorrect ? 'bg-success-light text-success-dark border border-success-main/20' : 'bg-surface border border-border text-text-secondary'}`}>
                              {s.isCorrect ? 'Selesai' : 'Belum Selesai'}
                            </div>
                            <div className="text-xs text-text-muted font-medium block">
                              {s.hintsUsed} Bantuan
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-text-secondary">Anak Anda belum memulai sesi belajar.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center slide-up" style={{ animationDelay: '200ms' }}>
            <div className="w-20 h-20 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-6 text-4xl">
              👨‍👩‍👧
            </div>
            <h2 className="text-heading-md text-text-primary mb-2">Menunggu Data Siswa</h2>
            <p className="text-text-secondary max-w-md mx-auto mb-6">
              Akun Anda belum terhubung dengan data anak Anda. Silakan klik tombol "Tambah Anak" di atas.
            </p>
            <AddChildButton />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
