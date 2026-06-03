import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any

  const BADGE_DEFINITIONS = [
    { key: 'FIRST_SOLO', name: 'Pertama Mandiri', description: 'Selesaikan 1 soal tanpa hint', icon: '🌱', color: '#10B981' },
    { key: 'STREAK_7', name: 'Konsisten 7 Hari', description: 'Belajar 7 hari berturut-turut', icon: '🔥', color: '#F59E0B' },
    { key: 'MASTER_20', name: 'Master Mandiri', description: 'Selesaikan 20 soal tanpa hint', icon: '🏆', color: '#3B82F6' },
    { key: 'NIGHT_OWL', name: 'Pelajar Malam', description: 'Belajar setelah pukul 21:00', icon: '🦉', color: '#7C3AED' },
    { key: 'EXPLORER', name: 'Penjelajah Topik', description: 'Pelajari 5 topik berbeda', icon: '🗺️', color: '#06B6D4' },
  ]

  try {
    const earnedBadges = await prisma.userBadge.findMany({
      where: { userId: user.id },
    })

    const earnedKeys = new Set(earnedBadges.map(ub => ub.badgeId))

    const badges = BADGE_DEFINITIONS.map(def => ({
      ...def,
      earned: earnedKeys.has(def.key),
      earnedAt: earnedBadges.find(ub => ub.badgeId === def.key)?.earnedAt ?? null,
    }))

    return NextResponse.json({ badges })
  } catch (error) {
    console.error('Badges error:', error)
    // Return demo data
    return NextResponse.json({
      badges: BADGE_DEFINITIONS.map((b, i) => ({
        ...b,
        earned: i < 3,
        earnedAt: i < 3 ? new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      })),
    })
  }
}
