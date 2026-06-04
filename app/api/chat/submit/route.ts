import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculatePoints, calculateAutonomyIndex } from '@/lib/gamification/scoring';
import { checkEarnedBadges } from '@/lib/gamification/badges';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
    const user = session.user as any;

    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string;
    const text = formData.get('text') as string | null;
    const file = formData.get('file') as File | null;

    if (!sessionId || (!text && !file)) {
      return new NextResponse('Bad Request: Missing data', { status: 400 });
    }

    const learningSession = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { question: true, messages: true },
    });

    if (!learningSession || learningSession.userId !== user.id) {
      return new NextResponse('Not found', { status: 404 });
    }

    // ─── Handle file upload ────────────────────────────────────
    let fileUrl = null;
    let mimeType = null;
    let base64Data = null;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const originalName = file.name || 'image.jpg';
      const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const filename = `${Date.now()}-${safeName}`;

      await writeFile(join(uploadDir, filename), buffer);
      fileUrl = `/uploads/${filename}`;

      mimeType = file.type || 'image/jpeg';
      base64Data = buffer.toString('base64');
    }

    // ─── AI Scoring ────────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Anda adalah guru penilai.
Tugas Anda adalah menilai jawaban siswa berdasarkan soal berikut:
Topik: ${learningSession.question?.topic}
Pertanyaan: ${learningSession.question?.content}
Kunci Jawaban yang Benar: ${learningSession.question?.correctAnswer}

Jawaban siswa (teks): ${text || 'Tidak ada teks.'}
${file ? 'Siswa juga mengunggah gambar penyelesaian (lihat lampiran gambar).' : ''}

Berikan penilaian dari 0 hingga 100.
Berikan feedback konstruktif (saran perbaikan atau pujian jika benar).
Kembalikan format JSON murni TANPA markdown block, dengan struktur persis seperti ini:
{
  "score": 85,
  "feedback": "Langkah pengerjaanmu sudah sangat baik, namun..."
}
`;

    const parts: any[] = [];
    if (file && base64Data && mimeType) {
      parts.push({ inlineData: { data: base64Data, mimeType } });
    }
    parts.push({ text: prompt });

    let score = 0;
    let feedback = 'Tidak ada feedback';
    let isCorrect = false;

    try {
      const result = await model.generateContent(parts);
      const responseText = result.response.text();
      try {
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        score = typeof parsed.score === 'number' ? parsed.score : 0;
        feedback = parsed.feedback || feedback;
      } catch (e) {
        console.error('Failed to parse Gemini response', responseText);
        feedback = responseText;
      }
      isCorrect = score >= 70;
    } catch (aiError: any) {
      console.warn('Gemini API failed during submission:', aiError.message);
      feedback = 'Maaf, AI saat ini sedang sibuk. Jawabanmu telah disimpan dan diteruskan ke Guru untuk dinilai secara manual.';
      score = 0;
      isCorrect = false;
    }

    // ─── Hitung Poin ───────────────────────────────────────────
    const difficulty = (learningSession.question?.difficulty ?? 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD';
    const hintsUsed = learningSession.hintsUsed;
    const timeSpent = Math.round(
      (Date.now() - new Date(learningSession.startedAt).getTime()) / 1000
    );

    const pointsEarned = calculatePoints({ isCorrect, hintsUsed, timeSpent, difficulty });

    // ─── Update LearningSession ────────────────────────────────
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        isCompleted: true,
        finalAnswerText: text,
        finalAnswerImageUrl: fileUrl,
        aiScore: score,
        aiFeedback: feedback,
        isCorrect,
        pointsEarned,
        endedAt: new Date(),
      },
    });

    // ─── Update UserStats ──────────────────────────────────────
    const existingStats = await prisma.userStats.findUnique({ where: { userId: user.id } });

    // Streak logic: compare last active date (date-only)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    let newStreak = 1;
    if (existingStats?.lastActiveDate) {
      const lastDate = new Date(existingStats.lastActiveDate);
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((todayMidnight.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        newStreak = existingStats.currentStreak; // Same day, keep streak
      } else if (diffDays === 1) {
        newStreak = existingStats.currentStreak + 1; // Consecutive day
      } else {
        newStreak = 1; // Gap in days, reset
      }
    }

    const prevSessions = existingStats?.totalSessions ?? 0;
    const prevCorrect = existingStats?.totalCorrect ?? 0;
    const prevNoHint = existingStats?.totalNoHintCorrect ?? 0;

    const newTotalSessions = prevSessions + 1;
    const newTotalCorrect = prevCorrect + (isCorrect ? 1 : 0);
    const newTotalNoHint = prevNoHint + (isCorrect && hintsUsed === 0 ? 1 : 0);
    const newTotalPoints = (existingStats?.totalPoints ?? 0) + pointsEarned;
    const newLongestStreak = Math.max(existingStats?.longestStreak ?? 0, newStreak);

    // Re-compute autonomy index from aggregate
    const allSessionsAgg = await prisma.learningSession.aggregate({
      where: { userId: user.id, isCompleted: true },
      _avg: { hintsUsed: true },
    });
    const avgHints = allSessionsAgg._avg.hintsUsed ?? 0;

    const newAutonomyIndex = calculateAutonomyIndex({
      totalSessions: newTotalSessions,
      totalCorrect: newTotalCorrect,
      totalNoHintCorrect: newTotalNoHint,
      avgHintsPerQuestion: avgHints,
    });

    await prisma.userStats.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        totalPoints: newTotalPoints,
        totalSessions: newTotalSessions,
        totalCorrect: newTotalCorrect,
        totalNoHintCorrect: newTotalNoHint,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        autonomyIndex: newAutonomyIndex,
        lastActiveDate: new Date(),
      },
      update: {
        totalPoints: newTotalPoints,
        totalSessions: newTotalSessions,
        totalCorrect: newTotalCorrect,
        totalNoHintCorrect: newTotalNoHint,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        autonomyIndex: newAutonomyIndex,
        lastActiveDate: new Date(),
      },
    });

    // ─── Award Badges ──────────────────────────────────────────
    const isFirstSession = prevSessions === 0;

    const hardNoHintCount = await prisma.learningSession.count({
      where: {
        userId: user.id,
        isCompleted: true,
        isCorrect: true,
        hintsUsed: 0,
        question: { difficulty: 'HARD' },
      },
    });

    const mathCorrectCount = await prisma.learningSession.count({
      where: {
        userId: user.id,
        isCompleted: true,
        isCorrect: true,
        question: { subject: 'Matematika' },
      },
    });

    const scienceCorrectCount = await prisma.learningSession.count({
      where: {
        userId: user.id,
        isCompleted: true,
        isCorrect: true,
        question: { subject: 'IPA' },
      },
    });

    const candidateBadges = checkEarnedBadges({
      totalNoHintCorrect: newTotalNoHint,
      currentStreak: newStreak,
      totalCorrect: newTotalCorrect,
      isFirstSession,
      hardNoHintCorrect: hardNoHintCount,
      dailyStreak: newStreak,
      mathCorrect: mathCorrectCount,
      scienceCorrect: scienceCorrectCount,
    });

    const alreadyEarned = await prisma.userBadge.findMany({
      where: { userId: user.id },
      select: { badgeId: true },
    });
    const alreadyEarnedSet = new Set(alreadyEarned.map((b) => b.badgeId));
    const newBadges = candidateBadges.filter((bid) => !alreadyEarnedSet.has(bid));

    if (newBadges.length > 0) {
      await Promise.all(
        newBadges.map((badgeId) =>
          prisma.userBadge.upsert({
            where: { userId_badgeId: { userId: user.id, badgeId } },
            create: { userId: user.id, badgeId },
            update: {},
          })
        )
      );
    }

    return NextResponse.json({ success: true, score, feedback, pointsEarned, newBadges });
  } catch (error: any) {
    console.error('Submit API Error:', error);
    return new NextResponse(`Internal Error: ${error?.message || 'Unknown'}`, { status: 500 });
  }
}
