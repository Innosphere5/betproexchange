"use client";

import { CheckCircle, XCircle } from "lucide-react";

export default function BetModal({ title, details, isError, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-[#1c3246] rounded-xl shadow-2xl border border-white/10 overflow-hidden w-full max-w-sm animate-slide-up relative">
        {/* Glow Top */}
        <div className={`absolute top-0 left-0 w-full h-1 ${isError ? 'bg-red-500' : 'bg-gradient-to-r from-[#00c766] to-[#00a857]'}`}></div>

        <div className="p-6 flex flex-col items-center text-center">
          <div className="mb-4">
            {isError ? (
              <XCircle size={56} className="text-red-500 animate-bounce-slight" />
            ) : (
              <CheckCircle size={56} className="text-[#00c766] animate-bounce-slight" />
            )}
          </div>

          <h2 className="text-xl font-black text-white mb-2 tracking-tight uppercase">
            {title}
          </h2>
          
          <div className="text-gray-300 text-sm mb-6 max-w-[280px] leading-relaxed font-medium">
            {details.split('\n').map((line, idx) => (
              <p key={idx} className={line.includes('Runner') || line.includes('Odds') || line.includes('Stake') ? 'text-white font-bold my-0.5' : ''}>
                {line}
              </p>
            ))}
          </div>

          <button 
            onClick={onClose}
            className={`w-full py-3 rounded-lg font-black tracking-wide text-[13px] uppercase shadow-lg transition-transform active:scale-95
              ${isError ? 'bg-[#f05b64] hover:bg-[#d44d55] text-white' : 'bg-[#00c766] hover:bg-[#00a857] text-[#1c3246]'}
            `}
          >
            {isError ? 'Dismiss' : 'Continue'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-slight { animation: bounce-slight 2s infinite ease-in-out; }
        @keyframes bounce-slight {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
