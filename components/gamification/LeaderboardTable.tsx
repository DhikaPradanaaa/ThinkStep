import React from 'react';

interface LeaderboardItem {
  rank: number;
  userId: string;
  name: string;
  avatarColor: string;
  points: number;
  streak: number;
  sessions: number;
  badgeCount: number;
}

interface LeaderboardTableProps {
  data: LeaderboardItem[];
  category: 'points' | 'streak' | 'sessions';
  currentUserId: string;
}

export default function LeaderboardTable({ data, category, currentUserId }: LeaderboardTableProps) {
  
  const getCategoryValue = (item: LeaderboardItem) => {
    if (category === 'points') return item.points.toLocaleString() + ' XP';
    if (category === 'streak') return item.streak + ' Hari';
    return item.sessions + ' Sesi';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return <span className="text-text-muted font-bold">{rank}</span>;
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-alt border-b border-border text-xs uppercase tracking-wider text-text-secondary">
              <th className="p-4 font-semibold w-16 text-center">Rank</th>
              <th className="p-4 font-semibold">Siswa</th>
              <th className="p-4 font-semibold text-right">
                {category === 'points' ? 'Poin' : category === 'streak' ? 'Streak' : 'Sesi'}
              </th>
              <th className="p-4 font-semibold text-right hidden sm:table-cell">Badges</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => {
              const isCurrentUser = item.userId === currentUserId;
              
              return (
                <tr 
                  key={item.userId} 
                  className={`transition-colors hover:bg-surface-alt ${isCurrentUser ? 'bg-brand-light/50 border-l-4 border-l-brand-main' : 'border-l-4 border-l-transparent'}`}
                >
                  <td className="p-4 text-center text-lg w-16">
                    {getRankIcon(item.rank)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-brand-text shadow-sm"
                        style={{ backgroundColor: item.avatarColor }}
                      >
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-semibold ${isCurrentUser ? 'text-brand-main' : 'text-text-primary'}`}>
                          {item.name} {isCurrentUser && '(Kamu)'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-bold text-text-primary bg-ink-100 px-3 py-1 rounded-full text-sm">
                      {getCategoryValue(item)}
                    </span>
                  </td>
                  <td className="p-4 text-right hidden sm:table-cell">
                    <span className="text-sm font-medium text-text-secondary flex items-center justify-end gap-1">
                      {item.badgeCount > 0 ? '🏅' : ''} {item.badgeCount}
                    </span>
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-text-muted">
                  Belum ada data untuk periode ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
