"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/apiConfig";
import { useDashboard } from "../../../components/DashboardLayout";
import CasinoLayout from "../../../components/casino/CasinoLayout";
import DealerSection from "../../../components/casino/DealerSection";
import TableSection from "../../../components/casino/TableSection";
import BettingBar from "../../../components/casino/BettingBar";
import BetPanel from "../../../components/casino/BetPanel";
import { soundFX } from "../../../lib/casinoSoundFX";

export default function CasinoPage() {
  const { socket, walletBalance, fetchWallet } = useDashboard();
  const [round, setRound] = useState({ roundId: null, status: 'LOADING', timer: 0, result: null, cards: null });
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null); // 'A' or 'B'
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedChip, setSelectedChip] = useState("100");
  
  // Non-intrusive floating toast notification (NO blocking full-screen popups)
  const [payoutToast, setPayoutToast] = useState(null); 

  useEffect(() => {
    soundFX.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (!socket) return;

    if (isJoined) {
       socket.emit('join_casino');
    }

    const syncState = (state) => setRound(state);

    const onStart = (r) => { 
      setRound(r); 
      setSelectedChoice(null); 
      soundFX.playCardFlip();
    };

    const onClose = (r) => {
      setRound(prev => ({ ...prev, status: 'BETTING_CLOSED' }));
    };

    const onResult = (r) => {
       setRound(prev => ({ ...prev, status: 'RESULT_DECLARED', result: r.result, cards: r.cards, handNames: r.handNames }));
       setHistory(prev => [r.result, ...prev].slice(0, 18));
       soundFX.playCardFlip();
    };

    const onPayout = (data) => {
       fetchWallet();
       if (data.result === 'WIN') {
         soundFX.playWinChime();
       } else {
         soundFX.playLossTick();
       }

       // Non-intrusive floating ticker toast at top corner (No blocking popup card!)
       setPayoutToast({ 
          status: data.result, 
          amount: data.amount, 
          choice: data.choice 
       });
       
       setTimeout(() => setPayoutToast(null), 4500);
    };

    socket.on('casino_state', syncState);
    socket.on('casino_round_start', onStart);
    socket.on('casino_betting_closed', onClose);
    socket.on('casino_result_declared', onResult);
    socket.on('casino_wallet_payout', onPayout);

    return () => {
      if (isJoined) {
        socket.emit('leave_casino');
      }
      socket.off('casino_state', syncState);
      socket.off('casino_round_start', onStart);
      socket.off('casino_betting_closed', onClose);
      socket.off('casino_result_declared', onResult);
      socket.off('casino_wallet_payout', onPayout);
    };
  }, [socket, isJoined, fetchWallet]);

  const handleStart = () => {
    soundFX.playChipClick();
    setIsJoined(true);
  };

  const handleEndGame = () => {
    soundFX.playChipClick();
    if (confirm("Are you sure you want to end the session?")) {
      socket?.emit('leave_casino');
      setIsJoined(false);
    }
  };

  const handleBetClick = (choice) => {
     soundFX.playChipClick();
     setSelectedChoice(choice);
     setAmount(selectedChip);
  };

  const cancelSelection = () => {
     soundFX.playChipClick();
     setSelectedChoice(null);
     setAmount("");
  };

  const handleSubmitBet = async () => {
    if (!selectedChoice) return;
    const betVal = parseFloat(amount);
    if (!amount || isNaN(betVal) || betVal <= 0) {
      alert("Enter a valid stake amount");
      return;
    }
    
    try {
      soundFX.playChipClick();
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const res = await fetch(`${getApiUrl()}/api/casino/bet`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({ choice: selectedChoice, amount: betVal })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error);
      } else {
        fetchWallet();
        cancelSelection();
      }
    } catch (err) {
      alert("Network error. Could not place bet.");
    }
  };

  const isBettingOpen = round.status === 'BETTING_OPEN';

  const CustomHeader = (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
        title={isMuted ? "Unmute Audio" : "Mute Audio"}
      >
        {isMuted ? "🔇 Sound Off" : "🔊 Sound On"}
      </button>
      <button 
        onClick={handleEndGame}
        className="px-4 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-100 text-xs font-bold rounded-lg shadow-lg transition-all duration-300 uppercase tracking-widest cursor-pointer"
      >
        Leave Table
      </button>
    </div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#090d14] text-white font-sans select-none">
      
      {/* 🎰 MOBILE HEADER (TIMER TOP RIGHT + SOUND + LEAVE) */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2.5 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/10 z-30">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleEndGame}
            className="w-8 h-8 flex items-center justify-center bg-red-600/20 rounded-full border border-red-500/30 text-red-400"
            title="Leave Table"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="px-2.5 py-1 bg-slate-800/80 rounded-full text-[10px] font-bold text-slate-300 border border-slate-700"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          {round.status === 'BETTING_OPEN' ? (
             <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Live</span>
             </div>
          ) : (
             <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-600/10 border border-rose-600/30 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider">Closed</span>
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Round Timer</span>
             <div className="text-lg font-black font-mono text-amber-400 leading-none">{round.timer}s</div>
          </div>
        </div>
      </div>

      {/* 💸 NON-INTRUSIVE FLOATING BALANCE PAYOUT TICKER TOAST (REPLACES POPUP CARDS) */}
      {payoutToast && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
          <div className={`px-4 py-3 rounded-2xl border shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center gap-3 min-w-[240px] ${
            payoutToast.status === 'WIN' 
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300' 
              : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
          }`}>
             <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-lg ${
               payoutToast.status === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
             }`}>
                {payoutToast.status === 'WIN' ? '🏆' : '💸'}
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-wider">
                  {payoutToast.status === 'WIN' ? 'Bet Won!' : 'Bet Concluded'}
                </span>
                <span className="text-sm font-mono font-black">
                  {payoutToast.status === 'WIN' ? `+$${payoutToast.amount.toFixed(2)}` : `-$${payoutToast.amount.toFixed(2)}`}
                </span>
             </div>
          </div>
        </div>
      )}

      {/* 🚀 MOBILE BET SLIP POPUP (SLIDE FROM TOP) */}
      {selectedChoice && (
        <div className="lg:hidden fixed inset-0 z-[90] flex flex-col pt-12 px-3 animate-in slide-in-from-top-full duration-300">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-md -z-10" onClick={cancelSelection}></div>
           <div className="max-w-md mx-auto w-full shadow-2xl">
              <BetPanel 
                 selectedChoice={selectedChoice}
                 amount={amount}
                 setAmount={setAmount}
                 handleSubmitBet={handleSubmitBet}
                 history={[]} 
                 isBettingOpen={isBettingOpen}
                 cancelSelection={cancelSelection}
                 isMobilePopup={true}
                 selectedChip={selectedChip}
                 setSelectedChip={setSelectedChip}
              />
           </div>
        </div>
      )}

      {/* Premium Start Overlay */}
      {!isJoined && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#070b12]/90 backdrop-blur-lg transition-all duration-500 p-4">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#0f172a] border-2 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.2)] flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 flex items-center justify-center shadow-xl transform hover:rotate-6 transition-transform duration-300 ring-4 ring-amber-400/20">
               <span className="text-4xl font-extrabold text-slate-950">♦</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-wider text-white uppercase italic drop-shadow-md">7 UP DOWN LIVE</h2>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">Step into the live casino table. Real-time card dealing, 3D chips betting, and continuous live payouts without popup disruptions.</p>
            </div>

            <button 
              onClick={handleStart}
              className="group relative w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 rounded-2xl font-black text-slate-950 uppercase tracking-[0.2em] shadow-[0_10px_30px_-5px_rgba(245,158,11,0.5)] active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden text-sm"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>Join Casino Table</span>
                <span>♠</span>
              </span>
              <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
            </button>

            <div className="flex gap-2 items-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Room Ready
            </div>
          </div>
        </div>
      )}

      <CasinoLayout 
        header={CustomHeader}
        leftContent={
           <div className="flex flex-col h-full bg-[#090d14] relative">
             <div className="order-3 lg:order-1 lg:block">
                <DealerSection round={round} isMuted={isMuted} setIsMuted={setIsMuted} />
             </div>
             <div className="order-1 lg:order-2 flex-1 overflow-y-auto no-scrollbar pb-[110px] lg:pb-0">
                <TableSection round={round} />
             </div>
             <div className="order-2 lg:order-3 fixed bottom-0 left-0 right-0 z-40 lg:relative lg:bottom-auto border-t border-white/5">
                <BettingBar handleBetClick={handleBetClick} lock={!isBettingOpen} />
             </div>
           </div>
        }
        rightContent={
          <div className="hidden lg:block h-full">
             <BetPanel 
                selectedChoice={selectedChoice}
                amount={amount}
                setAmount={setAmount}
                handleSubmitBet={handleSubmitBet}
                history={history}
                isBettingOpen={isBettingOpen}
                cancelSelection={cancelSelection}
                selectedChip={selectedChip}
                setSelectedChip={setSelectedChip}
             />
          </div>
        }
      />
    </div>
  );
}
