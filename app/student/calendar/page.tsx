import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import CalendarClient from '@/components/calendar/CalendarClient';

export default async function StudentCalendarPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  
  const role = (session.user as any).role;
  if (role !== 'STUDENT') redirect('/teacher/dashboard');

  return (
    <AppLayout role="STUDENT" userName={session.user.name ?? 'Siswa'} avatarColor={(session.user as any).avatarColor}>
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand-main/5 to-transparent -z-10" />
      
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="space-y-2 fade-in">
          <h1 className="text-display-md text-gradient text-gradient-primary">
            Kalender Akademik 🗓️
          </h1>
          <p className="text-body-lg text-text-secondary font-medium">
            Kelola jadwal belajarmu, tenggat tugas, dan ujian di satu tempat.
          </p>
        </div>

        <CalendarClient role="STUDENT" />
      </div>
    </AppLayout>
  );
}
