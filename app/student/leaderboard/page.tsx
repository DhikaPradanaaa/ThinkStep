import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import AppLayout from '@/components/layout/AppLayout';
import LeaderboardClient from './LeaderboardClient';

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  
  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (role !== 'STUDENT') redirect('/teacher/dashboard');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { joinedClasses: true }
  });

  const classes = user?.joinedClasses || [];

  return (
    <AppLayout role="STUDENT" userName={session.user.name ?? 'Siswa'} avatarColor={(session.user as any).avatarColor}>
      {/* Premium Hero Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand-main/5 to-transparent -z-10" />
      
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="space-y-2 fade-in">
          <h1 className="text-display-md text-gradient text-gradient-primary">
            Peringkat Kelas 🏆
          </h1>
          <p className="text-body-lg text-text-secondary font-medium">
            Berkompetisi sehat dengan teman sekelasmu.
          </p>
        </div>

        {classes.length > 0 ? (
          <LeaderboardClient classes={classes} currentUserId={userId} />
        ) : (
          <div className="glass-card p-12 text-center mt-8">
            <div className="text-5xl mb-4">🏫</div>
            <h2 className="text-heading-md mb-2">Belum Bergabung Kelas</h2>
            <p className="text-text-secondary">
              Kamu perlu bergabung dengan kelas terlebih dahulu untuk melihat leaderboard.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
