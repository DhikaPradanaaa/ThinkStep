import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { BADGES } from '@/lib/gamification/badges'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any

  try {
    const earnedBadges = await prisma.userBadge.findMany({
      where: { userId: user.id },
    })

    const earnedKeys = new Set(earnedBadges.map(ub => ub.badgeId))

    const badges = BADGES.map(def => ({
      key: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      color: def.color,
      earned: earnedKeys.has(def.id),
      earnedAt: earnedBadges.find(ub => ub.badgeId === def.id)?.earnedAt ?? null,
    }))

    return NextResponse.json({ badges })
  } catch (error) {
    console.error('Badges error:', error)
    return NextResponse.json({
      badges: BADGES.map((b, i) => ({
        key: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        color: b.color,
        earned: false,
        earnedAt: null,
      })),
    })
  }
}
