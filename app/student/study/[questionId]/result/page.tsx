import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { BADGES } from '@/lib/gamification/badges';

export const dynamic = 'force-dynamic';

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ questionId: string }>;
  searchParams: Promise<{ session: string; newBadges?: string }>;
}) {
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
    include: { question: true },
  });

  if (!learningSession || learningSession.userId !== user.id) {
    redirect(`/student/study`);
  }

  // Fetch latest user stats to show updated totals
  const userStats = await prisma.userStats.findUnique({ where: { userId: user.id } });

  // Get new badges from query param (passed after submit)
  const newBadgeIds = resolvedSearchParams.newBadges
    ? resolvedSearchParams.newBadges.split(',').filter(Boolean)
    : [];
  const newBadgeObjects = newBadgeIds
    .map((id) => BADGES.find((b) => b.id === id))
    .filter(Boolean) as typeof BADGES;

  // Determine which score to show (teacher overrides AI)
  const finalScore =
    learningSession.teacherScore !== null ? learningSession.teacherScore : learningSession.aiScore;
  const isEvaluatedByTeacher = learningSession.teacherScore !== null;
  const isPassing = (finalScore ?? 0) >= 70;
  const pointsEarned = learningSession.pointsEarned ?? 0;

  return (
    <AppLayout role="STUDENT" userName={user.name || 'Siswa'} avatarColor={user.avatarColor}>
      <div className="max-w-3xl mx-auto py-10 px-6">

        {/* Hero */}
        <div className="text-center mb-10">
          <div
            className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl shadow-lg mb-4 ${
              isPassing ? 'bg-success-light text-success-dark' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isPassing ? '🏆' : '💪'}
          </div>
          <h1 className="text-display-md text-text-primary mb-2">Sesi Selesai!</h1>
          <p className="text-text-secondary">
            Kamu telah menyelesaikan sesi belajar untuk materi ini.
          </p>
        </div>

        {/* Points Earned Banner */}
        <div
          className={`rounded-2xl p-5 mb-6 flex items-center justify-between shadow-sm border ${
            pointsEarned > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-surface-alt border-border'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-inner">
              ⭐
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 uppercase tracking-wider">Poin Diperoleh</p>
              <p className="text-4xl font-black text-amber-600 font-display">+{pointsEarned}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted font-medium">Total Poin Kamu</p>
            <p className="text-2xl font-bold text-text-primary">{(userStats?.totalPoints ?? 0).toLocaleString('id-ID')}</p>
          </div>
        </div>

        {/* New Badges */}
        {newBadgeObjects.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 p-5 mb-6 shadow-sm">
            <p className="text-sm font-bold text-violet-900 uppercase tracking-wider mb-3">🎖️ Badge Baru Didapat!</p>
            <div className="flex flex-wrap gap-3">
              {newBadgeObjects.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-violet-200 shadow-sm"
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{badge.name}</p>
                    <p className="text-xs text-text-muted">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score Card */}
        <div className="card !p-8 shadow-sm border-border/60 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-6 mb-6">
            <div>
              <p className="text-sm font-bold text-brand-main uppercase tracking-wider mb-1">Nilai Akhir</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-display font-black text-text-primary">
                  {finalScore !== null && finalScore !== undefined ? Math.round(finalScore as number) : '-'}
                </span>
                <span className="text-lg text-text-muted mb-1">/ 100</span>
              </div>
              {isEvaluatedByTeacher && (
                <span className="badge-base autonomy-high mt-3 inline-block">✅ Telah ditinjau oleh Guru</span>
              )}
            </div>

            <div className="mt-4 md:mt-0 text-left md:text-right space-y-1">
              <p className="text-sm font-semibold text-text-muted">Topik</p>
              <p className="font-bold text-text-primary">{learningSession.question?.topic || 'Latihan Mandiri'}</p>
              <p className="text-xs text-text-muted">
                🧠 Hint digunakan: <strong className="text-ink-700">{learningSession.hintsUsed}</strong> / 3
              </p>
              <p className="text-xs text-text-muted">
                🔥 Streak saat ini: <strong className="text-rose-600">{userStats?.currentStreak ?? 0} hari</strong>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
              🤖 Analisis Lumina AI
            </h3>
            <div className="bg-surface-alt rounded-xl p-5 border border-border/50 text-text-primary leading-relaxed whitespace-pre-wrap">
              {learningSession.aiFeedback || 'Tidak ada catatan analisis dari AI.'}
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider text-text-muted">
              Jawaban Tersimpan
            </h3>

            {learningSession.finalAnswerText && (
              <div className="bg-surface border border-border rounded-lg p-4 mb-4 text-sm whitespace-pre-wrap text-text-primary shadow-sm">
                {learningSession.finalAnswerText}
              </div>
            )}

            {learningSession.finalAnswerImageUrl && (
              <div className="rounded-lg overflow-hidden border border-border inline-block max-w-full">
                <img
                  src={learningSession.finalAnswerImageUrl}
                  alt="Jawaban terlampir"
                  className="max-w-full max-h-96 object-contain bg-surface-alt"
                />
              </div>
            )}

            {!learningSession.finalAnswerText && !learningSession.finalAnswerImageUrl && (
              <p className="text-text-muted italic text-sm">
                Tidak ada jawaban akhir yang disubmit.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link href="/student/dashboard">
            <button className="btn-secondary">Kembali ke Dashboard</button>
          </Link>
          <Link href="/student/study">
            <button className="btn-primary">Lanjutkan Belajar →</button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
