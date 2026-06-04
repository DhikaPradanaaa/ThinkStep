'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MiniLeaderboardWidget({ classId, currentUserId }: { classId: string, currentUserId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    
    fetch(`/api/leaderboard?classId=${classId}&period=weekly&category=points`)
      .then(res => res.json())
      .then(result => {
        if (result.leaderboard) {
          setData(result.leaderboard.slice(0, 3)); // Top 3 only
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [classId]);

  if (!classId) return null;

  return (
    <div className="glass-card p-6 slide-up hover-lift" style={{ animationDelay: '200ms' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-heading-sm">Peringkat Mingguan 🏆</h2>
        <Link href="/student/leaderboard" className="text-sm font-semibold text-brand-main hover:text-text-primary">Lihat penuh &rarr;</Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-brand-main border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {data.map((item, idx) => {
            const isCurrentUser = item.userId === currentUserId;
            return (
              <div 
                key={item.userId} 
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                  isCurrentUser ? 'bg-brand-light/50 border-brand-main shadow-sm' : 'bg-surface/60 border-white/40 shadow-sm'
                }`}
              >
                <div className="w-6 text-center font-bold text-text-secondary text-sm">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </div>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-brand-text shadow-sm"
                  style={{ backgroundColor: item.avatarColor }}
                >
                  {item.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-brand-main' : 'text-text-primary'}`}>
                    {item.name.split(' ')[0]} {isCurrentUser && '(Kamu)'}
                  </p>
                </div>
                <div className="text-xs font-bold bg-ink-100 text-text-primary px-2 py-1 rounded-md">
                  {item.points} XP
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-muted text-center py-4">Belum ada data minggu ini.</p>
      )}
    </div>
  );
}
