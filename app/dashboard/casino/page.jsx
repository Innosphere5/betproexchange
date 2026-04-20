"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../../../components/DashboardLayout";
import CasinoLayout from "../../../components/casino/CasinoLayout";
import DealerSection from "../../../components/casino/DealerSection";
import TableSection from "../../../components/casino/TableSection";
import BettingBar from "../../../components/casino/BettingBar";
import BetPanel from "../../../components/casino/BetPanel";

export default function CasinoPage() {
  const { socket, walletBalance, fetchWallet } = useDashboard();
  const [round, setRound] = useState({ roundId: null, status: 'LOADING', timer: 0, result: null, cards: null });
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(null); // 'A' or 'B'
  const [isJoined, setIsJoined] = useState(false);
  const [resultData, setResultData] = useState(null); // { status: 'WIN'|'LOSE', amount: number, choice: string }

  useEffect(() => {
    if (!socket) return;

    if (isJoined) {
       socket.emit('join_casino');
    }

    const syncState = (state) => setRound(state);
    const onStart = (r) => { setRound({ ...r, timer: 10, cards: null }); setFeedback(null); setSelectedChoice(null); };
    const onClose = (r) => setRound(prev => ({ ...prev, status: 'BETTING_CLOSED' }));
    const onResult = (r) => {
       setRound(prev => ({ ...prev, status: 'RESULT_DECLARED', result: r.result, cards: r.cards }));
       setHistory(prev => [r.result, ...prev].slice(0, 18));
    };
    const onPayout = (data) => {
       fetchWallet();
       // Trigger the premium result overlay
       setResultData({ 
          status: data.result, 
          amount: data.amount, 
          choice: data.choice 
       });
       
       // Automatically close result after 4 seconds
       setTimeout(() => setResultData(null), 4000);
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
  }, [socket, isJoined]);

  const handleStart = () => {
    setIsJoined(true);
  };

  const handleEndGame = () => {
    if (confirm("Are you sure you want to end the session?")) {
      socket?.emit('leave_casino');
      setIsJoined(false);
    }
  };

  const handleBetClick = (choice) => {
     setSelectedChoice(choice);
  };

  const cancelSelection = () => {
     setSelectedChoice(null);
     setAmount("");
  };

  const handleSubmitBet = async () => {
    if (!selectedChoice) return;
    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Enter a valid stake amount");
      return;
    }
    
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const res = await fetch(`${getApiUrl()}/api/casino/bet`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.token}`
        },
        body: JSON.stringify({ choice: selectedChoice, amount: parseFloat(amount) })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error);
      } else {
        alert(`Bet placed successfully!`);
        fetchWallet();
        cancelSelection();
      }
    } catch (err) {
      alert("Network error. Could not place bet.");
    }
  };

  const isBettingOpen = round.status === 'BETTING_OPEN';

  const CustomHeader = (
    <button 
      onClick={handleEndGame}
      className="px-4 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-100 text-xs font-bold rounded shadow-lg transition-all duration-300 uppercase tracking-widest cursor-pointer"
    >
      End Game
    </button>
  );

  const CustomLeft = (
     <div className="flex flex-col h-full">
       <div className="order-1">
         <DealerSection round={round} />
       </div>
       {/* BettingBar is order-2 on mobile (between dealer and table) */}
       <div className="order-2 lg:order-3">
         <BettingBar handleBetClick={handleBetClick} lock={!isBettingOpen} />
       </div>
       <div className="order-3 lg:order-2">
         <TableSection round={round} />
       </div>
     </div>
  );

  const CustomRight = (
     <div className="hidden lg:block h-full">
        <BetPanel 
           selectedChoice={selectedChoice}
           amount={amount}
           setAmount={setAmount}
           handleSubmitBet={handleSubmitBet}
           history={history}
           isBettingOpen={isBettingOpen}
           cancelSelection={cancelSelection}
        />
     </div>
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0d1621]">
      
      {/* 🎰 MOBILE PREMIUM HEADER (TIMER TOP RIGHT + END GAME) */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#1b2b3b] border-b border-white/5 z-30">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleEndGame}
            className="w-10 h-10 flex items-center justify-center bg-red-600/20 rounded-full border border-red-500/30 text-red-500"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          {round.status === 'BETTING_OPEN' ? (
             <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Live</span>
             </div>
          ) : (
             <div className="flex items-center gap-1.5 px-2 py-1 bg-red-600/10 border border-red-600/30 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Closed</span>
             </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
             <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">Round Ends In</span>
             <div className="text-xl font-black font-mono text-yellow-500">{round.timer}s</div>
          </div>
        </div>
      </div>

      {/* 🏆 PREMIUM RESULT OVERLAY (WIN/LOSS) */}
      {resultData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-xl -z-10"></div>
           
           <div className={`max-w-sm w-full rounded-3xl p-8 text-center border-t-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform animate-in slide-in-from-bottom-10 duration-700
             ${resultData.status === 'WIN' 
               ? 'bg-gradient-to-b from-[#b45309] to-[#fbbf24] border-yellow-300' 
               : 'bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] border-red-500'}`}>
              
              <div className="mb-6">
                 {resultData.status === 'WIN' ? (
                   <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center ring-8 ring-white/10 mb-4 animate-bounce">
                      <span className="text-5xl">👑</span>
                   </div>
                 ) : (
                   <div className="w-24 h-24 mx-auto bg-black/20 rounded-full flex items-center justify-center ring-8 ring-black/10 mb-4">
                      <span className="text-5xl">💔</span>
                   </div>
                 )}
                 <h2 className="text-3xl font-black text-white italic tracking-tight uppercase leading-tight drop-shadow-md">
                   {resultData.status === 'WIN' ? 'Congratulation!' : 'Hard Luck!'}
                 </h2>
                 <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                   {resultData.status === 'WIN' ? 'You beat the house' : 'Better luck next time'}
                 </p>
              </div>

              <div className={`py-6 px-4 rounded-2xl bg-black/30 backdrop-blur-md mb-8 border border-white/5`}>
                 <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">
                   {resultData.status === 'WIN' ? 'Total Winnings' : 'Total Loss'}
                 </div>
                 <div className={`text-4xl font-black font-mono ${resultData.status === 'WIN' ? 'text-white' : 'text-red-400'}`}>
                   {resultData.status === 'WIN' ? '+' : '-'}₹{resultData.amount.toLocaleString()}
                 </div>
              </div>

              <button 
                onClick={() => setResultData(null)}
                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all
                  ${resultData.status === 'WIN' 
                    ? 'bg-white text-yellow-800 hover:bg-yellow-50 shadow-xl' 
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
              >
                Continue Playing
              </button>
           </div>
        </div>
      )}

      {/* 🚀 GLOBAL MOBILE BET SLIP POPUP (SLIDE FROM TOP) */}
      {selectedChoice && (
        <div className="lg:hidden fixed inset-0 z-[100] flex flex-col pt-14 px-4 animate-in slide-in-from-top-full duration-500">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md -z-10" onClick={cancelSelection}></div>
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
              />
           </div>
        </div>
      )}

      {/* Premium Start Overlay */}
      {!isJoined && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0d1621]/80 backdrop-blur-md transition-all duration-500">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#1b2b3b] border-2 border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.15)] flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg transform hover:rotate-12 transition-transform duration-300">
               <span className="text-3xl font-bold text-black">♣</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">7 UP DOWN</h2>
              <p className="text-gray-400 text-sm">Join the table to start your casino session. Real-time rounds and instant payouts.</p>
            </div>

            <button 
              onClick={handleStart}
              className="group relative w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl font-bold text-black uppercase tracking-widest shadow-[0_10px_20px_-10px_rgba(234,179,8,0.5)] active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <span className="relative z-10">Start Playing</span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            </button>

            <div className="flex gap-2 items-center text-[10px] text-gray-500 uppercase tracking-tighter">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Live Connection Ready
            </div>
          </div>
        </div>
      )}

      <CasinoLayout 
        header={CustomHeader}
        leftContent={
           <div className="flex flex-col h-full bg-[#0d1621] relative">
             {/* Dealer Section (Header Image on Desktop) */}
             <div className="order-3 lg:order-1 lg:block">
                <DealerSection round={round} />
             </div>
             {/* Cards Section (Featured below dealer on desktop, Top on mobile) */}
             <div className="order-1 lg:order-2 flex-1 overflow-y-auto no-scrollbar pb-[120px] lg:pb-0">
                <TableSection round={round} />
             </div>
             {/* Betting Bar (Fixed bottom on mobile, below cards on desktop) */}
             <div className="order-2 lg:order-3 fixed bottom-0 left-0 right-0 z-40 lg:relative lg:bottom-auto border-t border-white/5">
                <BettingBar handleBetClick={handleBetClick} lock={!isBettingOpen} />
             </div>
           </div>
        }
        rightContent={CustomRight}
      />
    </div>
  );
}
