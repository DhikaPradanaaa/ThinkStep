import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// ── Helper: verifikasi kepemilikan task ──
async function verifyTaskOwner(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) return null
  if (task.userId !== userId) return null
  return task
}

// ── PATCH: Update task ──
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id } = await params

    const task = await verifyTaskOwner(id, userId)
    if (!task) {
      return NextResponse.json(
        { error: 'Tugas tidak ditemukan atau bukan milik Anda.' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { title, description, subject, deadline, priority, status } = body

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH']
    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE']

    const updateData: any = {}
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return NextResponse.json({ error: 'Judul tidak boleh kosong.' }, { status: 400 })
      }
      updateData.title = title.trim()
    }
    if (description !== undefined) updateData.description = description?.trim() || null
    if (subject !== undefined) updateData.subject = subject?.trim() || null
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null
    if (priority !== undefined && validPriorities.includes(priority)) updateData.priority = priority
    if (status !== undefined && validStatuses.includes(status)) updateData.status = status

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('[TASKS_PATCH_ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate tugas.' },
      { status: 500 }
    )
  }
}

// ── DELETE: Hapus task ──
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { id } = await params

    const task = await verifyTaskOwner(id, userId)
    if (!task) {
      return NextResponse.json(
        { error: 'Tugas tidak ditemukan atau bukan milik Anda.' },
        { status: 404 }
      )
    }

    await prisma.task.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Tugas berhasil dihapus.' })
  } catch (error) {
    console.error('[TASKS_DELETE_ERROR]', error)
    return NextResponse.json(
      { error: 'Gagal menghapus tugas.' },
      { status: 500 }
    )
  }
}
