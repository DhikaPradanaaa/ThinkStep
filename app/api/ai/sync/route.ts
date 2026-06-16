import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await req.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    // Ambil data siswa untuk fitur AI
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        userStats: true,
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 50
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Jika userStats belum ada (misal user baru registrasi), buat default
    if (!student.userStats) {
      student.userStats = await prisma.userStats.create({
        data: {
          userId: student.id,
          totalPoints: 0,
          totalSessions: 0,
          totalCorrect: 0,
          totalNoHintCorrect: 0,
          currentStreak: 0,
          longestStreak: 0,
          autonomyIndex: 0.0,
          aiCluster: "0",
          predictedScore: 0.0,
          recommendedDiff: "MEDIUM"
        }
      });
    }

    // Hitung fitur dari sesi terakhir
    const recentSessions = student.sessions;
    let avgQuizScore = 0;
    let completionRate = 0;
    let avgSessionMins = 0;
    let loginFreq = 1; // dummy for now
    let weeksActive = 1; // dummy for now

    if (recentSessions.length > 0) {
      const completed = recentSessions.filter(s => s.isCompleted);
      completionRate = completed.length / recentSessions.length;

      const correct = recentSessions.filter(s => s.isCorrect);
      avgQuizScore = (correct.length / recentSessions.length) * 100;

      avgSessionMins = 10; // Placeholder for actual duration tracking
    }

    const features = {
      avg_quiz_score: avgQuizScore,
      assignment_avg_score: 0, // Placeholder
      completion_rate: completionRate,
      login_frequency: loginFreq,
      avg_session_mins: avgSessionMins,
      forum_participation: 0, // Placeholder
      weeks_active: weeksActive,
      ai_cluster: student.userStats.aiCluster ? parseInt(student.userStats.aiCluster) : 0
    };

    // 1. Prediksi Performa
    const predRes = await fetch(`${AI_ENGINE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, features })
    });
    const predData = await predRes.json();

    // 2. Prediksi Cluster
    const clusterRes = await fetch(`${AI_ENGINE_URL}/cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, features })
    });
    const clusterData = await clusterRes.json();

    // 3. Adaptive Difficulty
    let currentLevel = 2; // MEDIUM default
    if (student.userStats.recommendedDiff === 'EASY') currentLevel = 1;
    if (student.userStats.recommendedDiff === 'HARD') currentLevel = 3;

    const diffRes = await fetch(`${AI_ENGINE_URL}/adaptive-difficulty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_score_pct: avgQuizScore / 100, current_level: currentLevel })
    });
    const diffData = await diffRes.json();

    // 4. Update Database
    await prisma.userStats.update({
      where: { userId: studentId },
      data: {
        predictedScore: predData.predicted_score,
        aiCluster: clusterData.cluster.toString(),
        recommendedDiff: diffData.new_level_str
      }
    });

    return NextResponse.json({
      success: true,
      prediction: predData,
      cluster: clusterData,
      difficulty: diffData
    });

  } catch (error: any) {
    console.error('Error syncing AI:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
