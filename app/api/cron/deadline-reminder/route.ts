import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateDeadlineReminderHTML } from '@/lib/email/deadline-reminder'
import nodemailer from 'nodemailer'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET env variable is not set. Aborting for safety.')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[CRON] Unauthorized deadline-reminder access attempt blocked.')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Find all active assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        isPublished: true,
        deadline: { gt: now }
      },
      include: {
        writingSessions: { select: { studentId: true, status: true, reminderSentStatus: true, id: true } }
      }
    })

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const sentEmails = []

    for (const assignment of assignments) {
      const msLeft = assignment.deadline.getTime() - now.getTime()
      const daysLeft = msLeft / (1000 * 60 * 60 * 24)
      
      let isH3 = false
      let isH1 = false
      
      // We trigger H-3 if deadline is between 2 and 3 days away
      if (daysLeft > 2 && daysLeft <= 3) isH3 = true
      // We trigger H-1 if deadline is between 0 and 1 day away
      if (daysLeft > 0 && daysLeft <= 1) isH1 = true

      if (!isH3 && !isH1) continue

      // Find students who should receive the assignment
      const targetStudents = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          ...(assignment.classId 
            ? { joinedClasses: { some: { id: assignment.classId } } }
            : { schoolId: assignment.schoolId }
          )
        },
        select: { id: true, email: true, name: true }
      })

      for (const student of targetStudents) {
        // Check if student already submitted or already received this reminder
        const session = assignment.writingSessions.find(s => s.studentId === student.id)
        if (session && (session.status === 'SUBMITTED' || session.status === 'TIMED_OUT')) {
          continue
        }

        const reminderStatus = session?.reminderSentStatus || 0
        
        // If H-3 reminder already sent and we are in H-3 window, skip
        if (isH3 && reminderStatus >= 1) continue
        
        // If H-1 reminder already sent and we are in H-1 window, skip
        if (isH1 && reminderStatus >= 2) continue

        // Send email
        const htmlReport = generateDeadlineReminderHTML(
          student.name, 
          assignment.title, 
          assignment.deadline, 
          isH1 ? 1 : 3
        )

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            await transporter.sendMail({
              from: `"ThinkStep AI" <${process.env.EMAIL_USER}>`,
              to: student.email,
              subject: `⚠️ Pengingat: Tugas "${assignment.title}" Berakhir dalam ${isH1 ? '1' : '3'} Hari!`,
              html: htmlReport,
            })
            sentEmails.push(student.email)
            console.log(`[CRON] Deadline reminder terkirim ke ${student.email}`)
          } catch (err) {
            console.error(`[CRON] Gagal mengirim email ke ${student.email}`, err)
          }
        } else {
          console.log(`[MOCK EMAIL] To: ${student.email}\n${htmlReport}`)
        }

        // Update reminder status
        const newStatus = isH1 ? 2 : 1
        if (session) {
          await prisma.writingSession.update({
            where: { id: session.id },
            data: { reminderSentStatus: newStatus }
          })
        } else {
          await prisma.writingSession.create({
            data: {
              assignmentId: assignment.id,
              studentId: student.id,
              status: 'IN_PROGRESS',
              reminderSentStatus: newStatus
            }
          })
        }
      }
    }

    return NextResponse.json({ 
      ok: true, 
      sentTo: sentEmails.length, 
      actualEmailsSent: sentEmails,
    })
  } catch (error) {
    console.error('Failed to run deadline reminder cron:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
