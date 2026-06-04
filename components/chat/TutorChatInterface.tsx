'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SendHorizonal, BrainCircuit, MessageSquareText } from 'lucide-react';
import MessageBubble from './MessageBubble';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: Date;
}

interface TutorChatInterfaceProps {
  sessionId: string;
  initialMessages: Message[];
  studentName: string;
}

export default function TutorChatInterface({
  sessionId,
  initialMessages,
  studentName,
}: TutorChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  
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
      const response = await fetch('/api/chat/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content: userMsg.content }),
      });

      if (!response.ok) {
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

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Header Panel */}
      <div className="flex items-center px-4 sm:px-6 h-16 sticky top-0 z-10 glass-panel border-b border-border shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center mr-3 border border-border shadow-sm">
           <MessageSquareText size={16} className="text-brand-main" />
        </div>
        <h1 className="text-base font-bold text-ink-900 tracking-tight truncate font-display">
          Tanya Lumina AI
        </h1>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {messages.length === 0 && (
          <div className="text-center text-text-muted my-auto flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-surface-alt border border-border flex items-center justify-center mb-6 shadow-sm">
              <BrainCircuit size={40} className="text-brand-main" />
            </div>
            <p className="font-semibold text-ink-900 mb-1 font-display">Halo {studentName}!</p>
            <p className="text-sm max-w-sm">Ada materi pelajaran yang membingungkan? Tanyakan saja di sini, Lumina akan membimbingmu perlahan.</p>
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
          <div className="flex-1 relative group">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Tanya sesuatu tentang pelajaran..."
              className="input-base resize-none min-h-[52px] max-h-[160px] py-3.5 shadow-sm bg-white"
              disabled={isLoading && !isStreaming}
              rows={1}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 bg-brand-main hover:bg-brand-dark text-white p-3.5 rounded-xl shadow-md shadow-brand-main/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
          >
            <SendHorizonal size={22} />
          </button>
        </div>
        
        {/* Helper footer */}
        <div className="text-center mt-3">
           <span className="text-xs font-semibold text-text-muted flex justify-center items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-main opacity-50" /> 
              Lumina AI akan memandumu berpikir kritis secara bertahap.
           </span>
        </div>
      </div>
    </div>
  );
}
