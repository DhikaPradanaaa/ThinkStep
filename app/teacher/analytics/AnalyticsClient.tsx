'use client'

import React, { useState, useEffect } from 'react';
import AtRiskStudentsCard from '@/components/teacher/analytics/AtRiskStudentsCard';
import TopicPerformanceChart from '@/components/teacher/analytics/TopicPerformanceChart';

export default function AnalyticsClient({ classes }: { classes: { id: string; name: string }[] }) {
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [data, setData] = useState<{ topicStats: any[], atRiskStudents: any[], timeline: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/teacher/analytics?classId=${selectedClass}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedClass]);

  return (
    <div className="space-y-6">
      {/* Class Filter */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="font-semibold text-text-primary">Filter Analisis:</h2>
        <select 
          value={selectedClass} 
          onChange={e => setSelectedClass(e.target.value)}
          className="input-base md:w-64 font-medium"
        >
          <option value="all">Semua Siswa di Sekolah</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-brand-main border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TopicPerformanceChart data={data.topicStats} />
            
            {/* Simple Timeline Graph */}
            <div className="glass-card p-6">
              <h2 className="text-heading-sm text-text-primary mb-6">Aktivitas Belajar (7 Hari Terakhir)</h2>
              <div className="flex items-end justify-between h-48 gap-2 pt-4">
                {data.timeline.map((day, i) => {
                  const max = Math.max(...data.timeline.map(d => d.sessions), 5);
                  const height = `${(day.sessions / max) * 100}%`;
                  
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                      <div className="w-full relative flex items-end justify-center h-full bg-surface-alt rounded-t-lg">
                        <div 
                          className="w-full bg-brand-main rounded-t-lg transition-all duration-1000 group-hover:bg-ink-700"
                          style={{ height: day.sessions === 0 ? '4px' : height }}
                        />
                        <span className="absolute -top-6 text-xs font-bold text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.sessions}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-muted font-semibold uppercase">
                        {new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <AtRiskStudentsCard students={data.atRiskStudents} />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted">Gagal memuat data analitik.</div>
      )}
    </div>
  );
}
