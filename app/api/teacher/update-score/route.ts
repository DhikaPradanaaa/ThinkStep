import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
    const user = session.user as any;

    if (user.role !== 'TEACHER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { sessionId, score } = await req.json();

    if (!sessionId || typeof score !== 'number') {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const updated = await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        teacherScore: score,
        isCorrect: score >= 70, // Re-evaluate passing threshold based on teacher's score
      }
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Update Score Error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
