'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SendHorizonal, BrainCircuit, CheckCircle2, ChevronDown, ChevronUp, MessageSquareText, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MessageBubble from './MessageBubble';
import HintButton from './HintButton';
import { compressImage } from '@/lib/utils/image';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  isHint?: boolean;
  hintTier?: number;
  createdAt: Date;
}

interface QuestionData {
  id: string;
  content: string;
  subject: string;
  topic: string;
  difficulty: string;
  gradeLevel: string;
  hintTier1: string;
  hintTier2: string;
  hintTier3: string;
}

interface ChatInterfaceProps {
  question: QuestionData;
  sessionId: string;
  initialMessages: Message[];
  hintsUsed: number;
  studentName: string;
}

export default function ChatInterface({
  question,
  sessionId,
  initialMessages,
  hintsUsed: initialHintsUsed,
  studentName,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [hintsUsed, setHintsUsed] = useState(initialHintsUsed);
  const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(false);
  
  // Submit Feature State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [finalAnswerText, setFinalAnswerText] = useState('');
  const [finalAnswerFile, setFinalAnswerFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1200, 0.8);
        setFinalAnswerFile(compressed);
      } catch (err) {
        console.error('Failed to compress image:', err);
        setFinalAnswerFile(file); // fallback to original if error
      }
    } else {
      setFinalAnswerFile(null);
    }
  };

  const router = useRouter();

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: inputValue.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content: userMsg.content }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const message = await response.text();
          setMessages((prev) => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'ASSISTANT',
            content: message || 'Mode Ujian Aktif - AI tidak tersedia.',
            createdAt: new Date(),
          }]);
          return;
        }
        throw new Error('Failed to send message');
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let aiResponse = '';

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunkValue = decoder.decode(value);
            aiResponse += chunkValue;
            setStreamingText(aiResponse);
          }
        }

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ASSISTANT',
          content: aiResponse,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      setIsLoading(false);
    }
  };

  const handleRequestHint = async () => {
    if (hintsUsed >= 3 || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const message = await response.text();
          setMessages((prev) => [...prev, {
            id: Date.now().toString(),
            role: 'ASSISTANT',
            content: message || 'Mode Ujian Aktif - petunjuk tidak tersedia.',
            createdAt: new Date(),
          }]);
          return;
        }
        if (response.status === 400) {
           console.warn("Max hints reached or session completed.");
        }
        throw new Error('Failed to request hint');
      }

      const data = await response.json();
      const hintMsg: Message = {
        id: data.message.id,
        role: 'ASSISTANT',
        content: data.message.content,
        isHint: data.message.isHint,
        hintTier: data.message.hintTier,
        createdAt: new Date(data.message.createdAt),
      };

      setMessages((prev) => [...prev, hintMsg]);
      setHintsUsed(data.hintsUsed);
    } catch (error) {
      console.error('Error requesting hint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const diffBadgeColor = 
    question.difficulty === 'EASY' ? 'bg-success-light text-success-dark border-success-main/20' :
    question.difficulty === 'MEDIUM' ? 'bg-hint-light text-hint-dark border-hint-main/20' :
    'bg-danger-light text-danger-dark border-danger-main/20';
    
  const diffLabel = 
    question.difficulty === 'EASY' ? 'Mudah' :
    question.difficulty === 'MEDIUM' ? 'Sedang' : 'Sulit';

  const handleFinalSubmit = async () => {
    if (!finalAnswerText.trim() && !finalAnswerFile) return;
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      if (finalAnswerText) formData.append('text', finalAnswerText);
      if (finalAnswerFile) formData.append('file', finalAnswerFile);

      const response = await fetch('/api/chat/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Gagal mengirim jawaban');
      }

      const data = await response.json();
      const newBadgesParam = data.newBadges?.length > 0
        ? `&newBadges=${data.newBadges.join(',')}`
        : '';
      
      router.push(`/student/study/${question.id}/result?session=${sessionId}${newBadgesParam}`);
    } catch (error: any) {
      console.error(error);
      alert(`Terjadi kesalahan: ${error?.message || 'Gagal mengirim'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Header Panel */}
      <div className="flex items-center px-4 sm:px-6 h-16 sticky top-0 z-10 glass-panel border-b border-border shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center mr-3 border border-border shadow-sm">
           <MessageSquareText size={16} className="text-ink-600" />
        </div>
        <h1 className="text-base font-bold text-text-primary tracking-tight truncate font-display">
          Sesi Belajar: {question.topic}
        </h1>
      </div>

      {/* Soal Card */}
      <div className="mx-4 sm:mx-6 mt-6 mb-2 card overflow-hidden flex-shrink-0 !p-0 border-border/60">
        <div 
          className="flex items-center justify-between px-5 py-3 bg-surface cursor-pointer hover:bg-surface-alt transition-colors border-b border-border/50"
          onClick={() => setIsQuestionCollapsed(!isQuestionCollapsed)}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-ink-700 tracking-wide uppercase">
              {question.subject} · {question.gradeLevel}
            </span>
            <span className={`badge border ${diffBadgeColor}`}>
              {diffLabel}
            </span>
          </div>
          <button className="text-ink-400 hover:text-text-primary transition-colors p-1 rounded-full hover:bg-surface border border-transparent hover:border-border">
            {isQuestionCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
        
        {!isQuestionCollapsed && (
          <div className="px-5 py-4 text-sm md:text-base text-text-primary whitespace-pre-wrap leading-relaxed bg-surface">
            {question.content}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {messages.length === 0 && (
          <div className="text-center text-text-muted my-auto flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-surface-alt border border-border flex items-center justify-center mb-6 shadow-sm">
              <BrainCircuit size={40} className="text-ink-300" />
            </div>
            <p className="font-semibold text-text-primary mb-1 font-display">Mulai diskusi dengan Lumina AI.</p>
            <p className="text-sm">Jelaskan apa yang sudah kamu pahami dari soal di atas.</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming Placeholder Bubble */}
        {isStreaming && (
          <div className="chat-bubble ai slide-up shadow-sm">
            {streamingText || (
               <span className="typing-dots inline-flex items-center gap-1.5 opacity-70">
                 <span></span>
                 <span></span>
                 <span></span>
               </span>
            )}
          </div>
        )}

        <div ref={endOfMessagesRef} className="h-4" />
      </div>

      {/* Input Bar */}
      <div className="sticky bottom-0 px-4 sm:px-6 py-4 glass-panel border-t border-border shadow-[var(--shadow-glass)]">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <HintButton hintsUsed={hintsUsed} onClick={handleRequestHint} disabled={isLoading || isStreaming} />
          
          <div className="flex-1 relative group">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Tulis balasanmu di sini..."
              className="input-base resize-none min-h-[52px] max-h-[160px] py-3.5 shadow-sm bg-surface"
              disabled={isLoading && !isStreaming}
              rows={1}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 bg-brand-main hover:bg-brand-light text-brand-text p-3.5 rounded-xl shadow-md shadow-brand-main/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
          >
            <SendHorizonal size={22} />
          </button>
        </div>
        
        {/* Helper footer */}
        <div className="text-center mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 max-w-4xl mx-auto">
           <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-main opacity-50" /> 
              Lumina AI memandu kamu berpikir analitis.
           </span>
           <button 
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-2 text-success-main font-bold hover:text-success-dark transition-colors px-4 py-2 rounded-lg border border-success-main/30 hover:border-success-main bg-success-light/30 shadow-sm w-full sm:w-auto justify-center text-xs"
           >
              <CheckCircle2 size={16} /> Saya Sudah Menemukan Jawabannya
           </button>
        </div>
      </div>

      {/* Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-text-primary font-display">Kumpulkan Jawaban Akhir</h2>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-ink-400 hover:text-text-primary transition-colors p-1 rounded-full hover:bg-surface">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                Tuliskan langkah penyelesaian akhirmu atau unggah foto hasil kerjamu di kertas. AI akan menilai dan memberikan masukan.
              </p>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-text-primary">Penjelasan / Jawaban Teks</label>
                <textarea
                  value={finalAnswerText}
                  onChange={(e) => setFinalAnswerText(e.target.value)}
                  placeholder="Ketik jawabanmu di sini..."
                  className="input-base resize-none h-32 py-3 bg-surface-alt"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-text-primary">Upload Foto (Opsional)</label>
                <div className="border-2 border-dashed border-border/80 rounded-xl p-6 flex flex-col items-center justify-center bg-surface-alt/50 hover:bg-surface-alt transition-colors group cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                    <Upload size={20} className="text-brand-main" />
                  </div>
                  {finalAnswerFile ? (
                    <div className="text-center">
                      <p className="text-sm font-bold text-text-primary">{finalAnswerFile.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">{(finalAnswerFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-text-primary">Klik untuk upload foto</p>
                      <p className="text-xs text-text-muted mt-0.5">Mendukung format JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-surface border-t border-border flex justify-end gap-3">
              <button 
                onClick={() => setIsSubmitModalOpen(false)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button 
                onClick={handleFinalSubmit}
                disabled={(!finalAnswerText.trim() && !finalAnswerFile) || isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'Mengirim...' : 'Kumpulkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
