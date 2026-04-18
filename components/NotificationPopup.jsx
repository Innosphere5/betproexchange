"use client";

import { CheckCircle, XCircle, X } from "lucide-react";
import { useEffect } from "react";

export default function NotificationPopup({ notification, onClose }) {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!notification) return null;

  const isWin = notification.status === 'WIN';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className={`relative px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border overflow-hidden min-w-[320px] 
        ${isWin ? 'bg-[#1e293b] border-green-500/30' : 'bg-[#1e293b] border-red-500/30'}
      `}>
        {/* Glow effect */}
        <div className={`absolute top-0 right-0 w-full h-1 
          ${isWin ? 'bg-gradient-to-r from-green-600 to-green-400' : 'bg-gradient-to-r from-red-600 to-red-400'}
        `}></div>

        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4 mt-1">
          <div className={`mt-0.5 p-2 rounded-full shrink-0
            ${isWin ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}
          `}>
            {isWin ? <CheckCircle size={22} /> : <XCircle size={22} />}
          </div>
          
          <div className="flex flex-col">
            <h3 className={`text-base font-bold tracking-tight
              ${isWin ? 'text-green-400' : 'text-red-400'}
            `}>
              {isWin ? 'Bet Won!' : 'Bet Lost'}
            </h3>
            
            <p className="text-gray-300 text-sm mt-1 font-medium leading-tight">
              {isWin 
                ? `You won ₹${notification.amount.toFixed(2)} on ${notification.runner}.`
                : `You lost ₹${notification.amount.toFixed(2)} on ${notification.runner}.`
              }
            </p>

            <span className="text-[10px] text-gray-500 mt-2 tracking-widest uppercase font-bold truncate max-w-[200px]">
              {notification.matchName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
