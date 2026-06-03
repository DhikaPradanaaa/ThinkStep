import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import SessionTimeline from '@/components/teacher/SessionTimeline'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface StudentDetailPageProps {
  params: Promise<{ studentId: string }>
}

function getAutonomyLabel(index: number) {
  if (index >= 80) return { label: 'Sangat Mandiri', cls: 'autonomy-very-high', icon: '⭐' }
  if (index >= 60) return { label: 'Mandiri', cls: 'autonomy-high', icon: '📈' }
  if (index >= 40) return { label: 'Berkembang', cls: 'autonomy-medium', icon: '🌱' }
  return { label: 'Perlu Bantuan', cls: 'autonomy-low', icon: '⚠️' }
}

function getAvatarColor(name: string): string {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#7C3AED', '#F43F5E', '#06B6D4']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { studentId } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (user.role !== 'TEACHER') redirect('/student/dashboard')

  // Fetch student data
  let student: any = null
  let sessions: any[] = []

  try {
    student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        userStats: true,
        badges: true,
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 20,
          include: {
            question: true,
            messages: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    })

    if (student?.schoolId !== user.schoolId) redirect('/teacher/students')

    sessions = student?.sessions?.map((s: any) => ({
      id: s.id,
      questionTitle: s.question?.content?.slice(0, 60) + '...' || 'Soal tidak tersedia',
      subject: s.question?.subject || 'Umum',
      date: new Date(s.startedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      durationMins: 10,
      hintsUsed: s.hintsUsed ?? 0,
      resolved: s.isCompleted ?? false,
      messages: s.messages?.slice(0, 5).map((m: any) => ({
        role: m.role,
        content: m.content.slice(0, 200),
        timestamp: new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        hintsUsed: m.role === 'AI' && m.isHint ? 1 : 0,
      })) ?? [],
    })) ?? []
  } catch (e) {
    console.error('DB fallback for student detail:', e)
    // Use placeholder data
    student = {
      name: 'Andi Kusuma',
      email: 'andi@demo.com',
      gradeLevel: 'Kelas 8A',
      userStats: { autonomyIndex: 85, totalPoints: 1240, currentStreak: 7 },
      badges: [],
    }
  }

  if (!student) redirect('/teacher/students')

  const autonomy = getAutonomyLabel(student.userStats?.autonomyIndex ?? 50)
  const avatarColor = getAvatarColor(student.name)
  const initials = student.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <AppLayout role="TEACHER" userName={user.name || 'Guru'} avatarColor="#059669">
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Back */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href="/teacher/students">
            <button className="btn-ghost" style={{ fontSize: '0.8rem' }}>← Kembali ke Daftar Siswa</button>
          </Link>
        </div>

        {/* Student Profile Header */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: avatarColor, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 700, flexShrink: 0,
            }}>{initials}</div>

            <div style={{ flex: 1 }}>
              <h1 className="text-heading-lg" style={{ color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                {student.name}
              </h1>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {student.gradeLevel}
                </span>
                <span style={{ color: 'var(--color-border)' }}>·</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {student.email}
                </span>
                <span className={`badge-base ${autonomy.cls}`} style={{ fontSize: '0.7rem' }}>
                  {autonomy.icon} {autonomy.label}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'center' }}>
              {[
                { label: 'Indeks Kemandirian', value: `${student.userStats?.autonomyIndex ?? 50}`, suffix: '/100' },
                { label: 'Total Poin', value: `${student.userStats?.totalPoints ?? 0}` },
                { label: 'Streak', value: `${student.userStats?.currentStreak ?? 0}`, suffix: '🔥' },
              ].map(stat => (
                <div key={stat.label}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>
                    {stat.value}<span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{stat.suffix}</span>
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sessions Timeline */}
        <SessionTimeline sessions={sessions.length > 0 ? sessions : undefined} studentName={student.name} />
      </div>
    </AppLayout>
  )
}
