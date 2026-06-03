'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Student {
  id: string
  name: string
  gradeLevel: string
  totalSessions: number
  avgHintsUsed: number
  noHintPercent: number
  autonomyIndex: number
  lastActive: string
  needsHelp: boolean
}

interface StudentTableProps {
  students: Student[]
}

type SortKey = 'name' | 'totalSessions' | 'avgHintsUsed' | 'noHintPercent' | 'autonomyIndex'

function getAutonomyLabel(index: number): { label: string; cls: string } {
  if (index >= 80) return { label: 'Sangat Mandiri', cls: 'autonomy-very-high' }
  if (index >= 60) return { label: 'Mandiri', cls: 'autonomy-high' }
  if (index >= 40) return { label: 'Berkembang', cls: 'autonomy-medium' }
  return { label: 'Perlu Bantuan', cls: 'autonomy-low' }
}

function getAvatarColor(name: string): string {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#7C3AED', '#F43F5E', '#06B6D4', '#84CC16']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const DEMO_STUDENTS: Student[] = [
  { id: 's1', name: 'Andi Kusuma', gradeLevel: 'Kelas 8A', totalSessions: 24, avgHintsUsed: 0.8, noHintPercent: 75, autonomyIndex: 85, lastActive: '2 jam lalu', needsHelp: false },
  { id: 's2', name: 'Budi Santoso', gradeLevel: 'Kelas 8A', totalSessions: 18, avgHintsUsed: 2.1, noHintPercent: 42, autonomyIndex: 55, lastActive: '1 hari lalu', needsHelp: false },
  { id: 's3', name: 'Citra Dewi', gradeLevel: 'Kelas 8B', totalSessions: 31, avgHintsUsed: 1.3, noHintPercent: 68, autonomyIndex: 73, lastActive: '3 jam lalu', needsHelp: false },
  { id: 's4', name: 'Dian Pertiwi', gradeLevel: 'Kelas 8B', totalSessions: 9, avgHintsUsed: 2.8, noHintPercent: 22, autonomyIndex: 28, lastActive: '4 hari lalu', needsHelp: true },
  { id: 's5', name: 'Eka Rahman', gradeLevel: 'Kelas 8A', totalSessions: 27, avgHintsUsed: 1.1, noHintPercent: 71, autonomyIndex: 79, lastActive: '5 jam lalu', needsHelp: false },
  { id: 's6', name: 'Fajar Nugroho', gradeLevel: 'Kelas 8C', totalSessions: 5, avgHintsUsed: 3.0, noHintPercent: 10, autonomyIndex: 15, lastActive: '1 minggu lalu', needsHelp: true },
  { id: 's7', name: 'Gita Sari', gradeLevel: 'Kelas 8C', totalSessions: 22, avgHintsUsed: 1.7, noHintPercent: 59, autonomyIndex: 62, lastActive: '6 jam lalu', needsHelp: false },
  { id: 's8', name: 'Hendra Wijaya', gradeLevel: 'Kelas 8B', totalSessions: 15, avgHintsUsed: 0.5, noHintPercent: 87, autonomyIndex: 91, lastActive: '1 jam lalu', needsHelp: false },
]

export default function StudentTable({ students = DEMO_STUDENTS }: Partial<StudentTableProps>) {
  const [sortKey, setSortKey] = useState<SortKey>('autonomyIndex')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')
  const [filterGrade, setFilterGrade] = useState('all')

  const grades = [...new Set(students.map(s => s.gradeLevel))].sort()

  const filtered = students
    .filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
      const matchGrade = filterGrade === 'all' || s.gradeLevel === filterGrade
      return matchSearch && matchGrade
    })
    .sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>↕</span>
    return <span style={{ color: 'var(--color-ink-500)', fontSize: '0.7rem' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 className="text-heading-sm" style={{ color: 'var(--color-text-primary)' }}>Data Siswa</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {filtered.length} dari {students.length} siswa
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
            <input
              type="text"
              placeholder="Cari siswa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-base"
              style={{ paddingLeft: '32px', padding: '6px 12px 6px 32px', fontSize: '0.8rem', width: '180px' }}
            />
          </div>

          {/* Grade filter */}
          <select
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
            className="input-base"
            style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto', cursor: 'pointer' }}
          >
            <option value="all">Semua Kelas</option>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              {[
                { key: 'name', label: 'Nama Siswa' },
                { key: 'totalSessions', label: 'Sesi' },
                { key: 'avgHintsUsed', label: 'Rata-rata Hint' },
                { key: 'noHintPercent', label: '% Mandiri' },
                { key: 'autonomyIndex', label: 'Indeks Kemandirian' },
              ].map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key as SortKey)}
                  style={{
                    textAlign: 'left', padding: '0.625rem 0.75rem',
                    fontSize: '0.7rem', fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    cursor: 'pointer', userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {col.label} <SortIcon col={col.key as SortKey} />
                  </span>
                </th>
              ))}
              <th style={{ padding: '0.625rem 0.75rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student, idx) => {
              const autonomy = getAutonomyLabel(student.autonomyIndex)
              const avatarColor = getAvatarColor(student.name)
              const initials = student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

              return (
                <tr
                  key={student.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: student.needsHelp ? '#FFF5F5' : idx % 2 === 0 ? 'white' : 'var(--color-surface)',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F0FDF4')}
                  onMouseLeave={e => (e.currentTarget.style.background = student.needsHelp ? '#FFF5F5' : idx % 2 === 0 ? 'white' : 'var(--color-surface)')}
                >
                  {/* Name */}
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: avatarColor, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                      }}>{initials}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {student.name}
                          </p>
                          {student.needsHelp && (
                            <span style={{ fontSize: '12px' }}>⚠️</span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          {student.gradeLevel} · Aktif {student.lastActive}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Sessions */}
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {student.totalSessions}
                    </span>
                  </td>

                  {/* Avg Hints */}
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {student.avgHintsUsed.toFixed(1)}
                      </span>
                      <div style={{
                        width: '48px', height: '6px',
                        background: 'var(--color-surface-alt)', borderRadius: '3px', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: '3px',
                          width: `${Math.min(student.avgHintsUsed / 3 * 100, 100)}%`,
                          background: student.avgHintsUsed <= 1 ? '#10B981' : student.avgHintsUsed <= 2 ? '#F59E0B' : '#F43F5E',
                        }} />
                      </div>
                    </div>
                  </td>

                  {/* No Hint % */}
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {student.noHintPercent}%
                      </span>
                      <div style={{
                        width: '48px', height: '6px',
                        background: 'var(--color-surface-alt)', borderRadius: '3px', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: '3px',
                          width: `${student.noHintPercent}%`,
                          background: student.noHintPercent >= 70 ? '#10B981' : student.noHintPercent >= 50 ? '#F59E0B' : '#F43F5E',
                        }} />
                      </div>
                    </div>
                  </td>

                  {/* Autonomy Index */}
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '1rem', fontWeight: 700,
                        color: student.autonomyIndex >= 60 ? 'var(--color-success-dark)' : student.autonomyIndex >= 40 ? 'var(--color-hint-dark)' : 'var(--color-danger-dark)',
                      }}>
                        {student.autonomyIndex}
                      </span>
                      <span className={`badge-base ${autonomy.cls}`} style={{ fontSize: '0.65rem' }}>
                        {autonomy.label}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.875rem 0.75rem' }}>
                    <Link href={`/teacher/students/${student.id}`}>
                      <button className="btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                        Detail →
                      </button>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            <p>Tidak ada siswa yang ditemukan</p>
          </div>
        )}
      </div>
    </div>
  )
}
