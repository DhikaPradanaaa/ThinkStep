import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ResultsClient from './ResultsClient';

export const dynamic = 'force-dynamic';

export default async function TeacherQuestionResultsPage({ params }: { params: Promise<{ questionId: string }> }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  
  const user = session.user as any;
  if (user.role !== 'TEACHER') redirect('/student/dashboard');

  const question = await prisma.question.findUnique({
    where: { id: resolvedParams.questionId }
  });

  if (!question) redirect('/teacher/question-bank');

  // Fetch all completed learning sessions for this question
  const sessions = await prisma.learningSession.findMany({
    where: { 
      questionId: resolvedParams.questionId,
      isCompleted: true 
    },
    include: {
      user: {
        select: { name: true, gradeLevel: true, id: true }
      }
    },
    orderBy: { endedAt: 'desc' }
  });

  return (
    <AppLayout role="TEACHER" userName={user.name || 'Guru'} avatarColor={user.avatarColor}>
      <div className="max-w-5xl mx-auto py-8 px-6">
        
        <div className="mb-8">
          <Link href="/teacher/question-bank" className="text-sm font-semibold text-text-muted hover:text-brand-main transition-colors flex items-center gap-1 w-fit mb-4">
            <ArrowLeft size={16} /> Kembali ke Bank Soal
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-display-sm text-text-primary mb-2">Hasil Evaluasi Soal</h1>
              <p className="text-text-secondary">Topik: <strong className="text-text-primary">{question.topic}</strong></p>
            </div>
            <div className="bg-surface-alt py-2 px-4 rounded-lg border border-border text-sm">
              <span className="text-text-muted">Total Pengumpulan: </span>
              <span className="font-bold text-text-primary text-lg ml-1">{sessions.length}</span>
            </div>
          </div>
        </div>

        <div className="card !p-6 shadow-sm mb-8 border-border">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider text-text-muted mb-3">Konten Soal</h3>
          <p className="text-text-primary leading-relaxed">{question.content}</p>
        </div>

        <ResultsClient question={question} sessions={sessions} />
        
      </div>
    </AppLayout>
  );
}
