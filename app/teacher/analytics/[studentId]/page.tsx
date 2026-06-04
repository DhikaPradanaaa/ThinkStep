import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { getAutonomyLabel } from '@/lib/gamification/scoring';

export default async function StudentAnalyticsDetail({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as any;
  if (user.role !== 'TEACHER') redirect('/student/dashboard');

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      userStats: true,
      sessions: {
        orderBy: { startedAt: 'desc' },
        take: 50,
        include: { question: true }
      }
    }
  });

  if (!student || student.role !== 'STUDENT') {
    return (
      <AppLayout role="TEACHER">
        <div className="p-8 text-center text-text-muted">Siswa tidak ditemukan.</div>
      </AppLayout>
    );
  }

  const autonomy = getAutonomyLabel(student.userStats?.autonomyIndex || 0);

  return (
    <AppLayout role="TEACHER" userName={user.name || 'Guru'} avatarColor={user.avatarColor || '#059669'}>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        
        {/* Header & Back button */}
        <div className="space-y-4">
          <Link href="/teacher/analytics" className="text-sm font-semibold text-text-secondary hover:text-text-primary flex items-center gap-2 w-fit">
            &larr; Kembali ke Analitik
          </Link>
          
          <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-display font-bold text-brand-text shadow-lg"
              style={{ backgroundColor: student.avatarColor }}
            >
              {student.name.charAt(0)}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-heading-lg text-text-primary">{student.name}</h1>
              <p className="text-text-secondary">Kelas {student.gradeLevel || 'Tidak diketahui'} • {student.email}</p>
            </div>
            
            <div className="flex gap-4">
              <div className="text-center bg-surface-alt p-3 rounded-xl border border-border min-w-24">
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Kemandirian</p>
                <p className="text-lg font-bold text-text-primary">{student.userStats?.autonomyIndex || 0}%</p>
              </div>
              <div className="text-center bg-surface-alt p-3 rounded-xl border border-border min-w-24">
                <p className="text-xs text-text-muted font-bold uppercase mb-1">Streak</p>
                <p className="text-lg font-bold text-danger-main">{student.userStats?.currentStreak || 0} Hari</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions History */}
        <div className="glass-card p-6">
          <h2 className="text-heading-sm text-text-primary mb-6">Riwayat Sesi Belajar (50 Terakhir)</h2>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {student.sessions.length > 0 ? (
              student.sessions.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border hover:border-ink-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0
                      ${s.isCorrect ? 'bg-success-light text-success-dark' : s.isCompleted ? 'bg-danger-light text-danger-dark' : 'bg-amber-100 text-amber-700'}`}>
                      {s.isCorrect ? '✅' : s.isCompleted ? '❌' : '⏸️'}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{s.subject} <span className="text-text-muted font-normal">— {s.question?.topic || 'General'}</span></p>
                      <p className="text-xs text-text-secondary mt-1">
                        {new Date(s.startedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text-primary">{s.hintsUsed} Hint</p>
                      <p className="text-xs text-brand-main font-bold">+{s.pointsEarned} XP</p>
                    </div>
                    {/* Link ke chat history */}
                    <Link href={`/teacher/assignments/review/${s.id}`} className="btn-secondary py-1.5 px-3 text-xs shrink-0">
                      Lihat Chat
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-muted">Siswa belum memiliki riwayat belajar.</div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
