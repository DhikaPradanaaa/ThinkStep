import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import AppLayout from '@/components/layout/AppLayout';
import AnalyticsClient from './AnalyticsClient';

export default async function TeacherAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = session.user as any;
  if (user.role !== 'TEACHER') redirect('/student/dashboard');

  const taughtClasses = await prisma.class.findMany({
    where: { teacherId: user.id },
    select: { id: true, name: true }
  });

  return (
    <AppLayout role="TEACHER" userName={user.name || 'Guru'} avatarColor={user.avatarColor || '#059669'}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="space-y-2 fade-in">
          <h1 className="text-display-md text-gradient text-gradient-primary">
            Analitik Pembelajaran 📊
          </h1>
          <p className="text-body-lg text-text-secondary font-medium">
            Pantau perkembangan dan identifikasi siswa yang tertinggal.
          </p>
        </div>

        <AnalyticsClient classes={taughtClasses} />
      </div>
    </AppLayout>
  );
}
