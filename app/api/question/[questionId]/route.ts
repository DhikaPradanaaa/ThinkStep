import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ questionId: string }>
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'TEACHER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { questionId } = await params

  try {
    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Only the creator can delete
    if (question.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden — not your question' }, { status: 403 })
    }

    await prisma.question.delete({ where: { id: questionId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete question:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
