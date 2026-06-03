import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// ── GET: Ambil semua task milik user ──
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const where: any = { userId }
    if (status && status !== 'ALL') where.status = status
    if (priority && priority !== 'ALL') where.priority = priority

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('[TASKS_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data tugas.' },
      { status: 500 }
    )
  }
}

// ── POST: Buat task baru ──
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await req.json()
    const { title, description, subject, deadline, priority } = body

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Judul tugas tidak boleh kosong.' },
        { status: 400 }
      )
    }

    if (title.trim().length > 200) {
      return NextResponse.json(
        { error: 'Judul tugas maksimal 200 karakter.' },
        { status: 400 }
      )
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH']
    const taskPriority = validPriorities.includes(priority) ? priority : 'MEDIUM'

    const task = await prisma.task.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        subject: subject?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        priority: taskPriority,
        status: 'TODO',
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('[TASKS_POST_ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal membuat tugas baru.' },
      { status: 500 }
    )
  }
}
