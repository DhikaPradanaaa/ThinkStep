import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateDailyQuestions } from '@/lib/ai/question-generator';

// Grade levels yang di-cover (SD s/d SMA sesuai pilihan user)
const GRADE_LEVELS = [
  'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6',  // SD
  'Kelas 7', 'Kelas 8', 'Kelas 9',                                      // SMP
  'Kelas 10', 'Kelas 11', 'Kelas 12',                                   // SMA
];

const SUBJECTS = ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris'];

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // "2026-06-04"
}

// Cari satu user admin/teacher untuk jadi "pemilik" soal yang digenerate
async function getSystemUserId(): Promise<string | null> {
  const teacher = await prisma.user.findFirst({
    where: { role: 'TEACHER' },
    select: { id: true },
  });
  if (teacher) return teacher.id;

  // Fallback ke user manapun
  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  return anyUser?.id ?? null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Untuk cron job (GET), kita cek CRON_SECRET. 
  // Untuk trigger manual (POST) dari UI, kita biarkan lewat untuk mempermudah (ideal: cek NextAuth session).
  if (request.method === 'GET' && process.env.NODE_ENV === 'production') {
    if (!cronSecret) {
      console.error('[CRON] CRON_SECRET env variable is not set. Aborting for safety.');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[CRON] Unauthorized access attempt blocked.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const today = getTodayString();
  const results = {
    date: today,
    generated: 0,
    skipped: 0,
    errors: [] as string[],
    details: [] as { grade: string; subject: string; status: string }[],
  };

  const systemUserId = await getSystemUserId();
  if (!systemUserId) {
    return NextResponse.json({ error: 'No users in system to attribute questions to' }, { status: 500 });
  }

  // Cek grade levels yang AKTIF (ada minimal 1 siswa terdaftar)
  const activeGrades = await prisma.user.findMany({
    where: { role: 'STUDENT', gradeLevel: { not: null } },
    select: { gradeLevel: true },
    distinct: ['gradeLevel'],
  });

  const gradesToProcess = activeGrades.length > 0
    ? activeGrades.map(g => g.gradeLevel!).filter(g => GRADE_LEVELS.includes(g))
    : GRADE_LEVELS; // fallback: generate semua jika belum ada siswa

  console.log(`[CRON] Generating daily questions for ${today}. Grades: ${gradesToProcess.join(', ')}`);

  for (const gradeLevel of gradesToProcess) {
    for (const subject of SUBJECTS) {
      // Skip jika sudah ada soal hari ini untuk grade+subject ini
      const existing = await prisma.dailyQuestionSet.findUnique({
        where: { date_gradeLevel_subject: { date: today, gradeLevel, subject } },
      });

      if (existing) {
        results.skipped++;
        results.details.push({ grade: gradeLevel, subject, status: '⏭️ skipped (already exists)' });
        continue;
      }

      try {
        console.log(`[CRON] Generating ${subject} for ${gradeLevel}...`);
        const generatedQs = await generateDailyQuestions(subject, gradeLevel, today);

        // Simpan questions ke DB
        const savedIds: string[] = [];
        for (const q of generatedQs) {
          const saved = await prisma.question.create({
            data: {
              content: q.content,
              type: q.type,
              difficulty: q.difficulty,
              subject,
              topic: q.topic,
              subtopic: q.subtopic ?? '',
              gradeLevel,
              phase: q.phase,
              capaianPembelajaran: q.capaianPembelajaran ?? '',
              hintTier1: q.hintTier1,
              hintTier2: q.hintTier2,
              hintTier3: q.hintTier3,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              isHots: q.isHots,
              isDailyGenerated: true,
              isPublic: true,
              createdById: systemUserId,
              tags: JSON.stringify(['harian', today, q.bloomLevel ?? '']),
            },
          });
          savedIds.push(saved.id);
        }

        // Simpan DailyQuestionSet
        await prisma.dailyQuestionSet.create({
          data: {
            date: today,
            gradeLevel,
            subject,
            questionIds: JSON.stringify(savedIds),
          },
        });

        results.generated++;
        results.details.push({ grade: gradeLevel, subject, status: `✅ generated (${savedIds.length} soal)` });
      } catch (error: any) {
        const errMsg = `${gradeLevel} / ${subject}: ${error?.message?.slice(0, 100) ?? 'Unknown error'}`;
        results.errors.push(errMsg);
        results.details.push({ grade: gradeLevel, subject, status: `❌ error: ${error?.message?.slice(0, 60)}` });
        console.error(`[CRON] Error generating ${subject} for ${gradeLevel}:`, error?.message);
      }

      // Rate limiting: pause between Gemini calls
      await new Promise(r => setTimeout(r, 800));
    }
  }

  console.log(`[CRON] Done! Generated: ${results.generated}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);
  return NextResponse.json(results);
}

// POST endpoint untuk trigger manual dari teacher dashboard
export async function POST(request: Request) {
  return GET(request);
}
