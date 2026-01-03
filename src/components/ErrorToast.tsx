// src/components/ErrorToast.tsx
import { useEffect, useState } from 'react';

interface ErrorToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export default function ErrorToast({ message, onClose, duration = 4000 }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      className={`
        mt-3 px-4 py-2.5 rounded-lg 
        bg-black/70 backdrop-blur-md
        border border-purple-500/50
        text-purple-200 text-sm font-medium
        shadow-lg shadow-purple-900/30
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        flex items-center justify-between gap-4
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-purple-400">⚠️</span>
        <span>{message}</span>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-purple-300 hover:text-purple-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}