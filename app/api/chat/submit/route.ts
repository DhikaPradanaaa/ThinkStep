import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculatePoints, calculateAutonomyIndex } from '@/lib/gamification/scoring';
import { checkEarnedBadges } from '@/lib/gamification/badges';
import { generateOllamaCompletion, checkOllamaAvailability, OllamaMessage } from '@/lib/ai/ollama-client';

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
      // SECURITY: Enforce max file size (5MB)
      const MAX_SIZE_BYTES = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE_BYTES) {
        return new NextResponse('File too large. Maximum size is 5MB.', { status: 413 });
      }

      // SECURITY: Whitelist allowed MIME types — reject everything else at server level
      const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
      const clientMime = file.type?.toLowerCase() || '';
      if (!ALLOWED_MIME_TYPES.has(clientMime)) {
        return new NextResponse('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.', { status: 415 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // SECURITY: Verify actual file signature (magic bytes) — not just the declared MIME
      const magicBytes = buffer.slice(0, 4);
      const isJpeg = magicBytes[0] === 0xFF && magicBytes[1] === 0xD8;
      const isPng = magicBytes[0] === 0x89 && magicBytes[1] === 0x50;
      const isWebp = buffer.slice(0, 12).toString('ascii').includes('WEBP');
      const isGif = magicBytes[0] === 0x47 && magicBytes[1] === 0x49;
      if (!isJpeg && !isPng && !isWebp && !isGif) {
        return new NextResponse('File content does not match declared type.', { status: 415 });
      }

      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      // SECURITY: Strip all characters except alphanumeric, dash, underscore
      // Prefix with timestamp + random to prevent name collisions and enumeration
      const originalName = file.name || 'image';
      const nameWithoutExt = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 40);
      const ext = clientMime === 'image/jpeg' ? '.jpg' : clientMime === 'image/png' ? '.png' : clientMime === 'image/webp' ? '.webp' : '.gif';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${nameWithoutExt}${ext}`;

      await writeFile(join(uploadDir, filename), buffer);
      fileUrl = `/uploads/${filename}`;

      mimeType = clientMime;
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
      console.warn('Gemini API failed during submission, falling back to Ollama:', aiError.message);
      
      const isOllamaOnline = await checkOllamaAvailability();
      if (isOllamaOnline) {
        try {
          const ollamaModelName = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
          const isVisionModel = ollamaModelName.toLowerCase().includes('llava') || ollamaModelName.toLowerCase().includes('vision') || ollamaModelName.toLowerCase().includes('moondream');
          
          let offlinePrompt = prompt;
          if (file && base64Data && !isVisionModel) {
             offlinePrompt += '\n\n[SISTEM]: Siswa melampirkan sebuah gambar, namun karena Anda adalah model teks, Anda tidak dapat melihat gambar tersebut. Berikan penilaian HANYA berdasarkan penjelasan teks yang diberikan siswa di atas.';
          }

          const ollamaMsg: OllamaMessage = {
            role: 'user',
            content: offlinePrompt,
          };

          if (file && base64Data && isVisionModel) {
            ollamaMsg.images = [base64Data];
          }

          const responseText = await generateOllamaCompletion([
            { role: 'system', content: 'Anda adalah guru penilai. Anda harus SELALU mengembalikan respons dalam format JSON murni.' },
            ollamaMsg
          ]);

          try {
            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            score = typeof parsed.score === 'number' ? parsed.score : 0;
            feedback = parsed.feedback || feedback;
          } catch (e) {
            console.error('Failed to parse Ollama response', responseText);
            feedback = responseText;
          }
          isCorrect = score >= 70;
        } catch (ollamaError: any) {
          console.error('Ollama fallback failed:', ollamaError.message);
          feedback = 'Maaf, AI saat ini sedang sibuk dan mode offline gagal memproses. Jawabanmu diteruskan ke Guru.';
          score = 0;
          isCorrect = false;
        }
      } else {
        feedback = 'Maaf, sistem sedang offline dan AI lokal tidak aktif. Jawabanmu telah disimpan dan diteruskan ke Guru untuk dinilai.';
        score = 0;
        isCorrect = false;
      }
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
    // SECURITY: Never expose internal error details to the client
    console.error('Submit API Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
