import React from 'react';
import Link from 'next/link';

interface AtRiskStudent {
  id: string;
  name: string;
  avatarColor: string;
  autonomyIndex: number;
  streak: number;
  lastActive: string | null;
}

export default function AtRiskStudentsCard({ students }: { students: AtRiskStudent[] }) {
  return (
    <div className="glass-card p-6 border-danger-main/30 border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-danger-light text-danger-main flex items-center justify-center text-xl">
          ⚠️
        </div>
        <div>
          <h2 className="text-heading-sm text-text-primary">Perlu Perhatian Khusus</h2>
          <p className="text-xs text-text-secondary">Siswa yang mungkin tertinggal</p>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {students.length > 0 ? (
          students.map((s) => (
            <Link key={s.id} href={`/teacher/analytics/${s.id}`} className="block group">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt border border-border group-hover:border-danger-main/50 transition-colors">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-brand-text font-bold text-sm shadow-sm"
                  style={{ backgroundColor: s.avatarColor }}
                >
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.autonomyIndex < 35 ? 'bg-danger-light text-danger-dark' : 'bg-amber-100 text-amber-800'}`}>
                      Kemandirian: {s.autonomyIndex}%
                    </span>
                    {s.streak === 0 && (
                      <span className="text-xs text-text-muted">Streak putus</span>
                    )}
                  </div>
                </div>
                <div className="text-text-muted group-hover:text-danger-main transition-colors">
                  &rarr;
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-text-muted">
            <span className="text-2xl mb-2 block">🎉</span>
            Semua siswa dalam kondisi baik!
          </div>
        )}
      </div>
    </div>
  );
}
