import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ResultPage({ params, searchParams }: { params: Promise<{ questionId: string }>, searchParams: Promise<{ session: string }> }) {
  const authSession = await auth();
  if (!authSession?.user) redirect('/login');
  
  const user = authSession.user as any;
  const { questionId } = await params;
  const resolvedSearchParams = await searchParams;
  const sessionId = resolvedSearchParams.session;

  if (!sessionId) {
    redirect(`/student/study`);
  }

  const learningSession = await prisma.learningSession.findUnique({
    where: { id: sessionId },
    include: { question: true }
  });

  if (!learningSession || learningSession.userId !== user.id) {
    redirect(`/student/study`);
  }

  // Determine which score to show (teacher overrides AI)
  const finalScore = learningSession.teacherScore !== null ? learningSession.teacherScore : learningSession.aiScore;
  const isEvaluatedByTeacher = learningSession.teacherScore !== null;
  const isPassing = (finalScore ?? 0) >= 70;

  return (
    <AppLayout role="STUDENT" userName={user.name || 'Siswa'} avatarColor={user.avatarColor}>
      <div className="max-w-3xl mx-auto py-10 px-6">
        
        <div className="text-center mb-10">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl shadow-lg mb-4 ${isPassing ? 'bg-success-light text-success-dark' : 'bg-danger-light text-danger-dark'}`}>
            {isPassing ? '🏆' : '💪'}
          </div>
          <h1 className="text-display-md text-ink-900 mb-2">Sesi Selesai!</h1>
          <p className="text-text-secondary">Kamu telah menyelesaikan sesi belajar untuk materi ini.</p>
        </div>

        <div className="card !p-8 shadow-sm border-border/60 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-6 mb-6">
            <div>
              <p className="text-sm font-bold text-brand-main uppercase tracking-wider mb-1">Nilai Akhir</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-display font-black text-ink-900">{finalScore ?? '-'}</span>
                <span className="text-lg text-text-muted mb-1">/ 100</span>
              </div>
              {isEvaluatedByTeacher && (
                <span className="badge-base autonomy-high mt-3 inline-block">✅ Telah ditinjau oleh Guru</span>
              )}
            </div>
            
            <div className="mt-4 md:mt-0 text-left md:text-right">
              <p className="text-sm font-semibold text-text-muted mb-1">Topik</p>
              <p className="font-bold text-ink-900">{learningSession.question?.topic || 'Latihan Mandiri'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-ink-900 mb-3 flex items-center gap-2">
              🤖 Analisis Lumina AI
            </h3>
            <div className="bg-surface-alt rounded-xl p-5 border border-border/50 text-text-primary leading-relaxed whitespace-pre-wrap">
              {learningSession.aiFeedback || 'Tidak ada catatan analisis dari AI.'}
            </div>
          </div>
          
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-sm font-bold text-ink-900 mb-4 uppercase tracking-wider text-text-muted">Jawaban Tersimpan</h3>
            
            {learningSession.finalAnswerText && (
              <div className="bg-white border border-border rounded-lg p-4 mb-4 text-sm whitespace-pre-wrap text-text-primary shadow-sm">
                {learningSession.finalAnswerText}
              </div>
            )}
            
            {learningSession.finalAnswerImageUrl && (
              <div className="rounded-lg overflow-hidden border border-border inline-block max-w-full">
                <img src={learningSession.finalAnswerImageUrl} alt="Jawaban terlampir" className="max-w-full max-h-96 object-contain bg-surface-alt" />
              </div>
            )}
            
            {!learningSession.finalAnswerText && !learningSession.finalAnswerImageUrl && (
              <p className="text-text-muted italic text-sm">Tidak ada jawaban akhir yang disubmit (diselesaikan secara paksa).</p>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link href="/student/dashboard">
            <button className="btn-secondary">Kembali ke Dashboard</button>
          </Link>
          <Link href="/student/study">
            <button className="btn-primary">Lanjutkan Belajar</button>
          </Link>
        </div>
        
      </div>
    </AppLayout>
  );
}
