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
    px-4 py-2.5 rounded-lg
    bg-black/80 backdrop-blur-md
    border border-purple-500/50
    shadow-lg shadow-purple-900/50
    transition-all duration-300
    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
  `}
>
      <div className="flex items-center justify-center gap-3">
        <span className="text-purple-400 text-xl">⚠️</span>
        <p className="text-purple-100 text-sm font-medium text-center">
          {message}
        </p>
      </div>
    </div>
  );
}