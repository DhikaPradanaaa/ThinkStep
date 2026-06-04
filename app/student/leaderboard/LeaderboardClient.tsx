'use client'

import React, { useState, useEffect } from 'react';
import LeaderboardPodium from '@/components/gamification/LeaderboardPodium';
import LeaderboardTable from '@/components/gamification/LeaderboardTable';

interface LeaderboardClientProps {
  classes: { id: string; name: string }[];
  currentUserId: string;
}

export default function LeaderboardClient({ classes, currentUserId }: LeaderboardClientProps) {
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || '');
  const [period, setPeriod] = useState<'weekly' | 'alltime'>('weekly');
  const [category, setCategory] = useState<'points' | 'streak' | 'sessions'>('points');
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedClass) return;
    
    setLoading(true);
    fetch(`/api/leaderboard?classId=${selectedClass}&period=${period}&category=${category}`)
      .then(res => res.json())
      .then(result => {
        if (result.leaderboard) {
          setData(result.leaderboard);
        } else {
          setData([]);
        }
      })
      .catch(err => {
        console.error('Failed to load leaderboard', err);
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedClass, period, category]);

  return (
    <div className="space-y-6">
      {/* Filters & Tabs */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface p-4 rounded-2xl border border-border shadow-sm">
        <select 
          value={selectedClass} 
          onChange={e => setSelectedClass(e.target.value)}
          className="input-base md:w-64 font-semibold"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="flex gap-2 bg-surface-alt p-1 rounded-xl border border-border">
          <button 
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${period === 'weekly' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Minggu Ini
          </button>
          <button 
            onClick={() => setPeriod('alltime')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${period === 'alltime' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Semua Waktu
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'points', icon: '⭐', label: 'Poin XP' },
          { id: 'streak', icon: '🔥', label: 'Streak Belajar' },
          { id: 'sessions', icon: '📖', label: 'Sesi Selesai' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap
              ${category === cat.id 
                ? 'bg-brand-main text-brand-text shadow-md' 
                : 'bg-surface border border-border text-text-secondary hover:bg-surface-alt'
              }`}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-brand-main border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {data.length > 0 && (
            <LeaderboardPodium top3={data.slice(0, 3)} category={category} />
          )}
          <LeaderboardTable data={data} category={category} currentUserId={currentUserId} />
        </>
      )}
    </div>
  );
}
