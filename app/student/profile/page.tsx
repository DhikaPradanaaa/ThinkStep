import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AppLayout from '@/components/layout/AppLayout'
import BadgeCard from '@/components/gamification/BadgeCard'
import Leaderboard from '@/components/gamification/Leaderboard'
import { BADGES } from '@/lib/gamification/badges'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      school: true,
    }
  })

  const stats = await prisma.userStats.findUnique({
    where: { userId }
  })

  const userBadges = await prisma.userBadge.findMany({
    where: { userId }
  })
  
  const earnedBadgeIds = new Set(userBadges.map(b => b.badgeId))

  const leaderboard = await prisma.userStats.findMany({
    where: {
      user: {
        schoolId: user?.schoolId,
        gradeLevel: user?.gradeLevel,
        role: 'STUDENT',
      }
    },
    include: {
      user: { select: { id: true, name: true, avatarColor: true } }
    },
    orderBy: {
      totalPoints: 'desc'
    },
    take: 10
  })

  return (
    <AppLayout role="STUDENT" userName={session.user.name ?? 'Siswa'} avatarColor={(session.user as any).avatarColor}>
      <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h1 className="text-display-sm mb-8">🏆 Profil & Pencapaian</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                 <div className="w-16 h-16 rounded-full text-brand-text flex items-center justify-center text-xl font-bold" style={{ backgroundColor: user?.avatarColor || '#3B82F6' }}>
                   {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                 </div>
                 <div>
                   <h2 className="text-heading-md">{user?.name}</h2>
                   <p className="text-text-secondary">{user?.gradeLevel} · {user?.school?.name}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                 <div>
                   <p className="text-label-sm text-text-muted uppercase tracking-wide">Total Poin</p>
                   <p className="text-heading-lg text-[#f59e0b] font-bold">{stats?.totalPoints || 0}</p>
                 </div>
                 <div>
                   <p className="text-label-sm text-text-muted uppercase tracking-wide">Soal Benar</p>
                   <p className="text-heading-lg text-ink-600 font-bold">{stats?.totalCorrect || 0}</p>
                 </div>
                 <div>
                   <p className="text-label-sm text-text-muted uppercase tracking-wide">Tanpa Hint</p>
                   <p className="text-heading-lg text-success-main font-bold">{stats?.totalNoHintCorrect || 0}</p>
                 </div>
                 <div>
                   <p className="text-label-sm text-text-muted uppercase tracking-wide">Streak</p>
                   <p className="text-heading-lg text-[#f43f5e] font-bold">{stats?.currentStreak || 0}🔥</p>
                 </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-heading-sm mb-4">Koleksi Badge</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {BADGES.map((badge) => (
                   <BadgeCard 
                     key={badge.id} 
                     badge={badge} 
                     earned={earnedBadgeIds.has(badge.id)} 
                     earnedAt={userBadges.find(b => b.badgeId === badge.id)?.earnedAt}
                   />
                 ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
             <div className="card p-6 sticky top-24">
                <Leaderboard users={leaderboard} currentUserId={userId} />
             </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
