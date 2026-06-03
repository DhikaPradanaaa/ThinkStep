import React from 'react';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface BadgeCardProps {
  badge: BadgeData;
  earned: boolean;
  earnedAt?: Date;
}

export default function BadgeCard({ badge, earned, earnedAt }: BadgeCardProps) {
  return (
    <div className={`
      relative bg-white border-2 rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-transform hover:scale-105
      ${earned ? 'border-[#fcd34d] shadow-sm' : 'border-border grayscale'}
    `}>
      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center text-3xl
        ${earned ? 'bg-[#fef3c7]' : 'bg-surface-alt'}
      `}>
        {badge.icon}
      </div>
      <div>
        <p className={`text-label-lg font-bold ${earned ? 'text-text-primary' : 'text-text-secondary'}`}>{badge.name}</p>
        <p className="text-[0.65rem] text-text-muted mt-1 leading-snug">{badge.description}</p>
      </div>

      {!earned && (
        <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-grayscale" />
      )}
      
      {earned && earnedAt && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f59e0b]" title={`Diraih pada ${new Date(earnedAt).toLocaleDateString('id-ID')}`} />
      )}
    </div>
  );
}
