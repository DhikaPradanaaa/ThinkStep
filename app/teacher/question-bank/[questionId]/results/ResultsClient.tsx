'use client';

import React, { useState } from 'react';
import { Download, Edit3, Check, X } from 'lucide-react';

export default function ResultsClient({ question, sessions }: { question: any, sessions: any[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(0);
  const [localSessions, setLocalSessions] = useState(sessions);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (session: any) => {
    setEditingId(session.id);
    setEditScore(session.teacherScore !== null ? session.teacherScore : session.aiScore);
  };

  const handleSave = async (sessionId: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/teacher/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, score: editScore })
      });
      if (!res.ok) throw new Error('Failed to update score');
      
      setLocalSessions(prev => prev.map(s => s.id === sessionId ? { ...s, teacherScore: editScore } : s));
      setEditingId(null);
    } catch (e) {
      alert('Terjadi kesalahan saat menyimpan nilai.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Nama Siswa', 'Kelas', 'Nilai AI', 'Nilai Guru', 'Nilai Akhir', 'Waktu Pengumpulan'];
    const rows = localSessions.map(s => {
      const finalScore = s.teacherScore !== null ? s.teacherScore : s.aiScore;
      return [
        s.user.name,
        s.user.gradeLevel || '-',
        s.aiScore ?? '-',
        s.teacherScore ?? '-',
        finalScore ?? '-',
        new Date(s.endedAt || s.startedAt).toLocaleString('id-ID')
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Nilai_${question.topic.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card !p-0 overflow-hidden shadow-sm border-border">
      <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
        <div>
          <h2 className="text-heading-sm text-text-primary mb-1">Rekap Nilai Siswa</h2>
          <p className="text-sm text-text-muted">{localSessions.length} pengumpulan untuk tugas ini.</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
          <Download size={16} /> Unduh CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-alt border-b border-border text-sm text-text-muted uppercase tracking-wider">
              <th className="p-4 font-bold">Nama Siswa</th>
              <th className="p-4 font-bold">Jawaban Akhir</th>
              <th className="p-4 font-bold text-center">Nilai AI</th>
              <th className="p-4 font-bold text-center">Nilai Final</th>
              <th className="p-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm text-text-primary divide-y divide-border">
            {localSessions.map(s => {
              const isEditing = editingId === s.id;
              const finalScore = s.teacherScore !== null ? s.teacherScore : s.aiScore;
              
              return (
                <tr key={s.id} className="hover:bg-surface-alt/50 transition-colors">
                  <td className="p-4 font-semibold">{s.user.name}</td>
                  <td className="p-4 max-w-xs">
                    {s.finalAnswerText && <p className="truncate text-text-secondary" title={s.finalAnswerText}>{s.finalAnswerText}</p>}
                    {s.finalAnswerImageUrl && (
                      <a href={s.finalAnswerImageUrl} target="_blank" rel="noreferrer" className="text-brand-main hover:underline text-xs block mt-1">
                        🖼️ Lihat Lampiran Foto
                      </a>
                    )}
                    {!s.finalAnswerText && !s.finalAnswerImageUrl && <span className="italic text-text-muted">Tidak ada jawaban akhir</span>}
                  </td>
                  <td className="p-4 text-center">
                    <span className="badge-base bg-surface-alt text-text-secondary border-border">{s.aiScore ?? '-'}</span>
                  </td>
                  <td className="p-4 text-center">
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={editScore} 
                        onChange={(e) => setEditScore(Number(e.target.value))}
                        className="input-base w-20 text-center py-1 px-2 mx-auto"
                        min="0" max="100"
                      />
                    ) : (
                      <span className={`badge-base border ${finalScore >= 70 ? 'bg-success-light text-success-dark border-success-main/20' : 'bg-danger-light text-danger-dark border-danger-main/20'}`}>
                        {finalScore ?? '-'}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleSave(s.id)} disabled={isSaving} className="p-1.5 bg-success-light text-success-dark rounded-md hover:bg-success-main hover:text-brand-text transition-colors">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} disabled={isSaving} className="p-1.5 bg-surface-alt text-text-muted rounded-md hover:bg-border transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(s)} className="p-1.5 text-text-muted hover:text-brand-main transition-colors">
                        <Edit3 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            
            {localSessions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-muted italic">
                  Belum ada siswa yang mengumpulkan jawaban untuk soal ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
