import React from 'react';

interface PodiumItem {
  rank: number;
  userId: string;
  name: string;
  avatarColor: string;
  points: number;
  streak: number;
  sessions: number;
  badgeCount: number;
}

interface LeaderboardPodiumProps {
  top3: PodiumItem[];
  category: 'points' | 'streak' | 'sessions';
}

export default function LeaderboardPodium({ top3, category }: LeaderboardPodiumProps) {
  // Pad with nulls if < 3
  const podiumData = [...top3];
  while (podiumData.length < 3) {
    podiumData.push(null as any);
  }

  // Order for visual display: 2nd, 1st, 3rd
  const displayOrder = [podiumData[1], podiumData[0], podiumData[2]];

  const getCategoryValue = (item: PodiumItem) => {
    if (!item) return 0;
    if (category === 'points') return item.points.toLocaleString() + ' XP';
    if (category === 'streak') return item.streak + ' Hari';
    return item.sessions + ' Sesi';
  };

  const getRankStyle = (rank: number) => {
    switch(rank) {
      case 1: return { height: '140px', bg: 'bg-amber-400', crown: '👑' };
      case 2: return { height: '110px', bg: 'bg-slate-300', crown: '🥈' };
      case 3: return { height: '90px', bg: 'bg-amber-600', crown: '🥉' };
      default: return { height: '70px', bg: 'bg-ink-200', crown: '' };
    }
  };

  return (
    <div className="flex items-end justify-center gap-2 md:gap-4 h-64 mt-8 mb-4">
      {displayOrder.map((item, idx) => {
        const visualRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
        const style = getRankStyle(visualRank);
        
        return (
          <div key={idx} className="flex flex-col items-center w-24 md:w-32 slide-up" style={{ animationDelay: `${idx * 150}ms` }}>
            {item ? (
              <>
                <div className="text-3xl mb-1 animate-bounce" style={{ animationDelay: `${idx * 0.2}s` }}>
                  {style.crown}
                </div>
                <div 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-xl md:text-2xl font-bold text-brand-text mb-2 shadow-lg z-10 border-4 border-surface"
                  style={{ backgroundColor: item.avatarColor }}
                >
                  {item.name.charAt(0)}
                </div>
                <p className="font-bold text-text-primary text-sm truncate w-full text-center mb-1">
                  {item.name.split(' ')[0]}
                </p>
                <p className="text-xs font-semibold text-brand-main mb-2">
                  {getCategoryValue(item)}
                </p>
              </>
            ) : (
              <div className="w-16 h-16 mb-8" /> // Empty placeholder
            )}
            
            <div 
              className={`w-full rounded-t-xl ${style.bg} relative overflow-hidden shadow-inner flex items-start justify-center pt-4 transition-all duration-500`}
              style={{ height: style.height }}
            >
              <div className="absolute inset-0 bg-surface/20" />
              <span className="text-2xl font-bold text-brand-text/80 drop-shadow-sm relative z-10">
                {visualRank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
