export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGES: Badge[] = [
  {
    id: 'first_no_hint',
    name: 'Pemikir Pertama',
    description: 'Pertama kali menjawab benar tanpa hint',
    icon: '🧠',
    color: '#3B82F6',
  },
  {
    id: 'streak_5',
    name: 'Konsisten 5',
    description: '5 soal berturut-turut dijawab benar',
    icon: '🔥',
    color: '#F59E0B',
  },
  {
    id: 'independence_master',
    name: 'Master Mandiri',
    description: '20 soal diselesaikan tanpa hint sama sekali',
    icon: '🏆',
    color: '#10B981',
  },
  {
    id: 'hard_solver',
    name: 'Penakluk Sulit',
    description: 'Selesaikan 5 soal Sulit tanpa hint',
    icon: '⚡',
    color: '#8B5CF6',
  },
  {
    id: 'weekly_warrior',
    name: 'Pejuang Mingguan',
    description: 'Belajar setiap hari selama 7 hari berturut-turut',
    icon: '📅',
    color: '#EC4899',
  },
  {
    id: 'first_session',
    name: 'Langkah Pertama',
    description: 'Menyelesaikan sesi belajar pertama',
    icon: '🌱',
    color: '#059669',
  },
  {
    id: 'math_master',
    name: 'Ahli Matematika',
    description: '10 soal Matematika selesai dengan benar',
    icon: '📐',
    color: '#2563EB',
  },
  {
    id: 'science_explorer',
    name: 'Penjelajah Sains',
    description: '10 soal IPA selesai dengan benar',
    icon: '🔬',
    color: '#7C3AED',
  },
];

export interface BadgeCheckParams {
  totalNoHintCorrect: number;
  currentStreak: number;
  totalCorrect: number;
  isFirstSession: boolean;
  hardNoHintCorrect: number;
  dailyStreak: number;
  mathCorrect: number;
  scienceCorrect: number;
}

export function checkEarnedBadges(params: BadgeCheckParams): string[] {
  const earned: string[] = [];

  if (params.isFirstSession) earned.push('first_session');
  if (params.totalNoHintCorrect >= 1) earned.push('first_no_hint');
  if (params.currentStreak >= 5) earned.push('streak_5');
  if (params.totalNoHintCorrect >= 20) earned.push('independence_master');
  if (params.hardNoHintCorrect >= 5) earned.push('hard_solver');
  if (params.dailyStreak >= 7) earned.push('weekly_warrior');
  if (params.mathCorrect >= 10) earned.push('math_master');
  if (params.scienceCorrect >= 10) earned.push('science_explorer');

  return earned;
}

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id);
}
