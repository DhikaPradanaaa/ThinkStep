export interface CalculatePointsParams {
  isCorrect: boolean;
  hintsUsed: number;
  timeSpent: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export function calculatePoints(params: CalculatePointsParams): number {
  if (!params.isCorrect) return 5; // tetap dapat poin kecil untuk usaha

  const BASE_POINTS = {
    EASY: 10,
    MEDIUM: 20,
    HARD: 35,
  };

  const HINT_PENALTY: Record<number, number> = {
    0: 1.0,   // tanpa hint → 100% poin
    1: 0.75,  // 1 hint    → 75% poin
    2: 0.50,  // 2 hint    → 50% poin
    3: 0.25,  // 3 hint    → 25% poin
  };

  const base = BASE_POINTS[params.difficulty];
  const multiplier = HINT_PENALTY[params.hintsUsed] ?? 0.1;
  const timeBonus = params.timeSpent < 60 ? 5 : 0;

  return Math.round(base * multiplier) + timeBonus;
}

export function calculateAutonomyIndex(params: {
  totalSessions: number;
  totalCorrect: number;
  totalNoHintCorrect: number;
  avgHintsPerQuestion: number;
}): number {
  if (params.totalSessions === 0) return 0;

  const noHintRatio = params.totalNoHintCorrect / Math.max(params.totalSessions, 1);
  const correctRatio = params.totalCorrect / Math.max(params.totalSessions, 1);
  const hintPenalty = Math.min(params.avgHintsPerQuestion / 3, 1);

  // Weighted formula
  const score = (
    noHintRatio * 50 +        // 50% dari tanpa hint
    correctRatio * 30 +       // 30% dari akurasi
    (1 - hintPenalty) * 20    // 20% dari rendahnya penggunaan hint
  );

  return Math.min(100, Math.round(score));
}

export function getAutonomyLabel(index: number): { label: string; color: string } {
  if (index >= 80) return { label: 'Sangat Mandiri', color: 'autonomy-very-high' };
  if (index >= 60) return { label: 'Mandiri', color: 'autonomy-high' };
  if (index >= 40) return { label: 'Berkembang', color: 'autonomy-medium' };
  return { label: 'Perlu Bantuan', color: 'autonomy-low' };
}
