import React from 'react';
import { LightbulbIcon, AlertTriangle } from 'lucide-react';

interface HintButtonProps {
  hintsUsed: number;
  onClick: () => void;
  disabled?: boolean;
}

export default function HintButton({ hintsUsed, onClick, disabled }: HintButtonProps) {
  if (hintsUsed >= 3) {
    return (
      <button 
        disabled
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-3 rounded-xl border border-danger-light bg-[#fff1f2] text-danger-dark text-label-sm font-semibold opacity-60 mb-0.5"
      >
        <AlertTriangle size={16} />
        Batas Hint Habis
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[#fcd34d] bg-hint-light hover:bg-[#fef3c7] active:bg-[#fde68a] text-hint-dark text-label-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm mb-0.5"
    >
      <LightbulbIcon size={16} className={hintsUsed === 0 ? "text-[#fbbf24]" : "text-[#f59e0b]"} />
      <span className="hidden sm:inline">Minta Petunjuk</span>
      <span className="sm:hidden">Hint</span>
      <span className="bg-white/50 px-1.5 py-0.5 rounded text-[0.65rem] ml-1">{3 - hintsUsed}</span>
    </button>
  );
}
