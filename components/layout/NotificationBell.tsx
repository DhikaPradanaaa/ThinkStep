'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import Link from 'next/link';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface-alt transition-colors relative"
      >
        <Bell size={24} className={unreadCount > 0 ? 'animate-bounce' : ''} style={{ animationIterationCount: 3 }} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-danger-main text-brand-text text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface rounded-2xl shadow-xl border border-border z-50 overflow-hidden slide-up">
          <div className="flex justify-between items-center p-4 border-b border-border bg-surface-alt">
            <h3 className="font-bold text-text-primary">Notifikasi</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-semibold text-brand-main hover:text-text-primary flex items-center gap-1">
                <Check size={14} /> Tandai semua dibaca
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b border-border hover:bg-surface-alt transition-colors ${!n.isRead ? 'bg-brand-light/30' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className={`text-sm ${!n.isRead ? 'font-bold text-text-primary' : 'font-semibold text-text-primary'}`}>
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-main shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mb-2">{n.message}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-text-muted">
                      {new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {n.href && (
                      <Link 
                        href={n.href} 
                        onClick={() => { markAsRead(n.id); setIsOpen(false); }}
                        className="text-xs font-semibold text-brand-main hover:underline"
                      >
                        Lihat &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-muted">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-sm">Belum ada notifikasi baru</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
