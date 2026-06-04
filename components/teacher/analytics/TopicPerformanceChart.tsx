import React from 'react';

interface TopicStat {
  topic: string;
  total: number;
  wrongPercent: number;
  avgHints: number;
}

export default function TopicPerformanceChart({ data }: { data: TopicStat[] }) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-heading-sm text-text-primary mb-6">Topik Sering Gagal (30 Hari)</h2>
      
      <div className="space-y-5">
        {data.length > 0 ? (
          data.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-text-primary truncate pr-4">{item.topic}</span>
                <span className="text-danger-main whitespace-nowrap">{item.wrongPercent}% Gagal</span>
              </div>
              <div className="w-full h-2.5 bg-ink-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-danger-main transition-all duration-1000"
                  style={{ width: `${item.wrongPercent}%` }}
                />
                <div 
                  className="h-full bg-success-main transition-all duration-1000"
                  style={{ width: `${100 - item.wrongPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>Dari {item.total} percobaan</span>
                <span>Rata-rata {item.avgHints} hint</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-text-muted">
            Belum ada data percobaan topik.
          </div>
        )}
      </div>
    </div>
  );
}
