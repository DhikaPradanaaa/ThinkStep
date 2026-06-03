import React from 'react';

interface LeaderboardUser {
  user: {
    id: string;
    name: string;
    avatarColor: string | null;
  };
  totalPoints: number;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  currentUserId: string;
}

export default function Leaderboard({ users, currentUserId }: LeaderboardProps) {
  return (
    <div>
      <h3 className="text-heading-sm mb-4 flex items-center justify-between">
        <span>Leaderboard Kelas</span>
        <span className="text-xl">🏆</span>
      </h3>
      
      <div className="flex flex-col gap-3">
        {users.map((u, index) => {
          const isCurrentUser = u.user.id === currentUserId;
          return (
            <div 
              key={u.user.id} 
              className={`
                flex items-center gap-3 p-2 rounded-xl
                ${isCurrentUser ? 'bg-ink-50 border border-ink-200' : ''}
              `}
            >
              <div className="w-6 text-center font-bold text-text-muted text-sm">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              
              <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: u.user.avatarColor || '#3B82F6' }}>
                {u.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <p className={`text-sm truncate ${isCurrentUser ? 'font-bold text-ink-700' : 'font-medium text-text-primary'}`}>
                  {u.user.name.split(' ')[0]} {isCurrentUser && '(Kamu)'}
                </p>
              </div>
              
              <div className="text-sm font-bold text-[#f59e0b]">
                {u.totalPoints}
              </div>
            </div>
          );
        })}

        {users.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">Belum ada data klasemen.</p>
        )}
      </div>
    </div>
  );
}
