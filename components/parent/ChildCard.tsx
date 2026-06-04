import React from 'react';

export default function ChildCard({ student }: { student: any }) {
  return (
    <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-brand-main/30 transition-colors">
      <div 
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-display font-bold text-brand-text shadow-lg transform group-hover:scale-105 transition-transform"
        style={{ background: `linear-gradient(135deg, ${student.avatarColor}, var(--color-brand-main))` }}
      >
        {student.name.charAt(0)}
      </div>
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-heading-lg text-text-primary">{student.name}</h2>
        <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
          <span className="badge-base bg-surface border border-border text-text-secondary px-2 py-0.5 rounded-full text-xs">
            Kelas {student.gradeLevel || '8'}
          </span>
          <span className="badge-base bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs">
            Akun Tertaut
          </span>
        </div>
      </div>
      
      <div className="flex w-full md:w-auto justify-center md:justify-end gap-2 sm:gap-4 mt-2 md:mt-0">
        <div className="text-center bg-surface-alt p-3 rounded-xl border border-border min-w-24">
          <p className="text-xs text-text-muted font-bold uppercase mb-1">XP</p>
          <p className="text-lg font-bold text-text-primary">{student.userStats?.totalPoints || 0}</p>
        </div>
        <div className="text-center bg-surface-alt p-3 rounded-xl border border-border min-w-24">
          <p className="text-xs text-text-muted font-bold uppercase mb-1">Kemandirian</p>
          <p className="text-lg font-bold text-brand-main">{student.userStats?.autonomyIndex || 0}%</p>
        </div>
      </div>
    </div>
  );
}
