'use client'

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

export default function CalendarClient({ role }: { role: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);

  const fetchEvents = async (date: Date) => {
    setLoading(true);
    const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    try {
      const res = await fetch(`/api/calendar?month=${monthStr}`);
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  // Generate grid cells
  const days = [];
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const selectedDateEvents = selectedDate 
    ? events.filter(e => e.date === selectedDate.toISOString().split('T')[0])
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Calendar Grid */}
      <div className="lg:col-span-2 glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-heading-md font-bold text-text-primary flex items-center gap-2">
            <CalendarIcon /> {monthName}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 rounded-lg bg-surface-alt hover:bg-ink-100 border border-border">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-surface-alt hover:bg-ink-100 border border-border">
              Hari Ini
            </button>
            <button onClick={nextMonth} className="p-2 rounded-lg bg-surface-alt hover:bg-ink-100 border border-border">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
            <div key={day} className="text-xs font-bold text-text-muted uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-24 bg-surface-alt/30 rounded-xl"></div>;
            }

            const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isSelected = selectedDate && dateStr === selectedDate.toISOString().split('T')[0];

            return (
              <div 
                key={day}
                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                className={`h-24 p-2 rounded-xl border flex flex-col items-start gap-1 cursor-pointer transition-all overflow-hidden
                  ${isSelected ? 'ring-2 ring-brand-main bg-brand-light/20 border-transparent shadow-sm' 
                  : isToday ? 'border-brand-main/50 bg-brand-light/10' 
                  : 'bg-surface border-border hover:border-ink-300'}`}
              >
                <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-brand-main text-brand-text' : 'text-text-secondary'}`}>
                  {day}
                </div>
                
                <div className="w-full flex flex-col gap-1 overflow-y-auto scrollbar-hide">
                  {dayEvents.slice(0, 3).map(e => (
                    <div key={e.id} className={`text-[10px] truncate px-1.5 py-0.5 rounded-md border font-semibold ${e.color}`}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-text-muted font-bold text-center">
                      +{dayEvents.length - 3} lagi
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar */}
      <div className="glass-card p-6 flex flex-col h-full">
        <h3 className="text-heading-sm mb-4">
          Agenda {selectedDate ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : 'Pilih Tanggal'}
        </h3>

        {role === 'TEACHER' && (
          <div className="mb-6 flex gap-2">
            <Link href="/teacher/assignments/new" className="flex-1">
              <button className="btn-primary w-full py-2 text-xs">Buat Tugas</button>
            </Link>
            <Link href="/teacher/exam/new" className="flex-1">
              <button className="btn-secondary w-full py-2 text-xs">Buat Ujian</button>
            </Link>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-brand-main border-t-transparent rounded-full animate-spin"></div></div>
          ) : selectedDateEvents.length > 0 ? (
            selectedDateEvents.map(e => (
              <div key={e.id} className={`p-3 rounded-xl border ${e.color} flex flex-col gap-1`}>
                <h4 className="font-bold text-sm leading-tight">{e.title}</h4>
                {e.description && <p className="text-xs font-medium opacity-80">{e.description}</p>}
                <Link href={e.href} className="text-xs font-bold underline mt-1">
                  Lihat Detail &rarr;
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-text-muted">
              <p className="text-4xl mb-2">🌴</p>
              <p className="text-sm">Tidak ada jadwal pada hari ini.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
