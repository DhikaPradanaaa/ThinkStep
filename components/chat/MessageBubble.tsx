import React from 'react';
import { LightbulbIcon, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';

const MarkdownRenderer = dynamic(() => import('./MarkdownRenderer'), { 
  ssr: false, 
  loading: () => <div className="animate-pulse bg-ink-200 h-12 w-full rounded-md" /> 
});

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  isHint?: boolean;
  hintTier?: number;
  createdAt: Date;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'USER';

  if (isUser) {
    return (
      <div className="chat-bubble user ml-auto mb-2 slide-up shadow-sm">
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        <div className="text-right mt-1.5 text-[10px] font-bold opacity-40 uppercase tracking-widest">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  }

  // ASSISTANT (AI) Bubble
  return (
    <div className={`chat-bubble mb-2 slide-up shadow-sm ${message.isHint ? 'hint' : 'ai'}`}>
      
      {!message.isHint && (
        <div className="flex items-center gap-1.5 mb-2 text-ink-400 font-bold text-[10px] uppercase tracking-widest">
          <Sparkles size={12} className="text-brand-main" /> Lumina AI
        </div>
      )}

      {message.isHint && (
        <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1 w-max rounded-full border border-hint-main bg-hint-light text-hint-dark text-xs font-bold shadow-sm">
          <LightbulbIcon size={14} className="text-hint-main" />
          Petunjuk {message.hintTier} dari 3
        </div>
      )}
      
      <div className="prose prose-sm max-w-none text-text-primary">
        {message.content.length > 0 && <MarkdownRenderer content={message.content} />}
      </div>
      
      <div className="text-left mt-2 text-[10px] font-bold opacity-40 uppercase tracking-widest">
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
