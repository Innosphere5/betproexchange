"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/apiConfig";
import { useDashboard } from "../../../components/DashboardLayout";
import AviatorCanvas from "../../../components/aviatorx/AviatorCanvas";
import BetControl from "../../../components/aviatorx/BetControl";
import HistoryStrip from "../../../components/aviatorx/HistoryStrip";
import ProvablyFairModal from "../../../components/aviatorx/ProvablyFairModal";

export default function AviatorXPage() {
  const { socket, walletBalance, fetchWallet } = useDashboard();
  const [isConnected, setIsConnected] = useState(socket ? socket.connected : false);
  
  const [round, setRound] = useState({
    roundId: null,
    phase: 'LOADING', // LOADING, BETTING, FLYING, CRASHED
    timer: 0,
    elapsedMs: 0,
    multiplier: 1.00,
    serverSeedHash: null,
    serverSeed: null,
    crashPoint: null,
    history: []
  });

  const [activeBets, setActiveBets] = useState([]); // [{ betSlot, stake, autoCashoutMultiplier, status, payout }]
  const [liveBets, setLiveBets] = useState([]); // Other players' bets: [{ username, stake, multiplier, payout, cashed: bool }]
  const [historyRounds, setHistoryRounds] = useState([]); // Full objects for verification
  
  const [selectedRound, setSelectedRound] = useState(null);
  const [isVerifierOpen, setIsVerifierOpen] = useState(false);
  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState("game"); // "game", "results", "rules"

  // Load state and history on initial mount
  const fetchActiveBets = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      if (!session.token) return;
      
      const res = await fetch(`${getApiUrl()}/api/aviatorx/active-bets`, {
        headers: { "Authorization": `Bearer ${session.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveBets(data);
      }
    } catch (err) {
      console.error("Failed to fetch active bets:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/aviatorx/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryRounds(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    fetchActiveBets();
    fetchHistory();
    setJoined(true);
  }, []);

  // WebSockets Synchronization
  useEffect(() => {
    if (!socket || !joined) return;

    setIsConnected(socket.connected);

    // Join room
    socket.emit('join_aviatorx');

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('join_aviatorx');
      fetchActiveBets();
      fetchHistory();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleState = (state) => {
      setRound(prev => {
        // Reset active bets on new betting round
        if (prev.roundId !== state.roundId) {
          setActiveBets([]);
          setLiveBets([]);
        }
        return state;
      });

      if (state.phase === 'CRASHED') {
        setActiveBets(prev => 
          prev.map(b => b.status === 'PENDING' ? { ...b, status: 'LOST' } : b)
        );
        fetchWallet();
      }
    };

    const handleBetPlaced = (data) => {
      // Add fake/real social players to feed
      setLiveBets(prev => [
        {
          username: data.userId.substring(0, 4) + "***",
          stake: data.stake,
          multiplier: data.autoCashoutMultiplier,
          cashed: false
        },
        ...prev
      ].slice(0, 40));
    };

    const handleCashoutSuccess = (data) => {
      // If it is current user's cashout, refresh wallet and active bets
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      if (data.userId === session.username) {
        fetchWallet();
        fetchActiveBets();
      }

      // Update live social feed
      setLiveBets(prev =>
        prev.map(bet => {
          if (bet.username === data.userId.substring(0, 4) + "***") {
            return {
              ...bet,
              multiplier: data.multiplier,
              payout: data.payout,
              cashed: true
            };
          }
          return bet;
        })
      );
    };

    const handleRoundReset = () => {
      fetchHistory();
      fetchActiveBets();
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('aviatorx_state', handleState);
    socket.on('aviatorx_bet_placed', handleBetPlaced);
    socket.on('aviatorx_cashout_success', handleCashoutSuccess);
    socket.on('aviatorx_round_reset', handleRoundReset);

    return () => {
      socket.emit('leave_aviatorx');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('aviatorx_state', handleState);
      socket.off('aviatorx_bet_placed', handleBetPlaced);
      socket.off('aviatorx_cashout_success', handleCashoutSuccess);
      socket.off('aviatorx_round_reset', handleRoundReset);
    };
  }, [socket, joined]);

  const handlePlaceBet = async (slot, stake, autoCashoutMultiplier) => {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    if (!session.token) throw new Error("Please log in first");

    const res = await fetch(`${getApiUrl()}/api/aviatorx/bet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.token}`
      },
      body: JSON.stringify({ betSlot: slot, stake, autoCashoutMultiplier })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to place bet");
    }

    fetchWallet();
    fetchActiveBets();
    return data;
  };

  const handleCashout = async (slot) => {
    const session = JSON.parse(localStorage.getItem('user_session') || '{}');
    if (!session.token) throw new Error("Please log in first");

    const res = await fetch(`${getApiUrl()}/api/aviatorx/cashout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.token}`
      },
      body: JSON.stringify({ betSlot: slot })
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to cash out");
    }

    fetchWallet();
    fetchActiveBets();
    return data;
  };

  const handleVerifyRound = (roundData) => {
    setSelectedRound(roundData);
    setIsVerifierOpen(true);
  };

  // Find active bets for slot 1 and 2
  const bet1 = activeBets.find(b => b.betSlot === 1);
  const bet2 = activeBets.find(b => b.betSlot === 2);

  return (
    <div className="min-h-screen bg-[#0c1520] text-white flex flex-col p-4 space-y-4">
      {/* 🚀 Top Bar: Balance & Seed Hash Info */}
      <div className="flex items-center justify-between bg-[#101b26] border border-white/5 px-4 py-2.5 rounded-2xl shadow-lg shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg text-sm shrink-0">
            ✈️
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase leading-none">AviatorX</h1>
            <p className="hidden xs:block text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Provably Fair</p>
          </div>
        </div>

        {/* Current Seed Hash Commit */}
        {round.serverSeedHash && (
          <div className="hidden md:flex items-center gap-2 bg-[#0d1621] px-3 py-1 border border-white/5 rounded-xl">
            <span className="text-xs">🔐</span>
            <div className="flex flex-col text-left">
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Commit</span>
              <span className="text-[10px] font-mono text-gray-400 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                {round.serverSeedHash}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Balance</span>
            <span className="text-sm font-black text-green-400">
              {walletBalance?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || "0.00"} INR
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Side: Center Stage (Canvas & History Strip & Betting Consoles) */}
        <div className="lg:col-span-9 flex flex-col space-y-4">
          
          {/* 🚀 Header with AVIATORX and Tabs */}
          <div className="bg-[#101b26] border border-white/5 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-lg shrink-0">
            <span className="text-xs font-black uppercase text-white tracking-widest px-1">
              AVIATORX
            </span>

            {/* Action Tabs */}
            <div className="bg-[#0c1520] p-0.5 rounded-xl border border-white/5 flex items-center gap-0.5">
              <button 
                onClick={() => setActiveTab("game")}
                className={`font-extrabold text-[11px] px-3 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === 'game' 
                    ? "bg-[#00c766] text-black shadow" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Game
              </button>
              <button 
                onClick={() => setActiveTab("results")}
                className={`font-extrabold text-[11px] px-3 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === 'results' 
                    ? "bg-[#00c766] text-black shadow" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Results
              </button>
              <button 
                onClick={() => setActiveTab("rules")}
                className={`font-extrabold text-[11px] px-3 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === 'rules' 
                    ? "bg-[#00c766] text-black shadow" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Rules
              </button>
            </div>
          </div>

          {/* Main Area: Render depending on active tab */}
          {activeTab === 'game' && (
            <>
              {/* Canvas Rendering Area */}
              <div className="relative flex-grow min-h-[220px] md:min-h-[350px] bg-[#0c1520]">
                <AviatorCanvas 
                  phase={round.phase}
                  elapsedMs={round.elapsedMs}
                  currentMultiplier={round.multiplier}
                  crashPoint={round.crashPoint}
                  timer={round.timer}
                />
              </div>

              {/* History strip below canvas */}
              <HistoryStrip 
                history={historyRounds} 
                onVerifyRound={handleVerifyRound} 
              />

              {/* Betting Consoles (Slot 1 & Slot 2 side-by-side) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BetControl 
                  slot={1}
                  phase={round.phase}
                  currentMultiplier={round.multiplier}
                  activeBet={bet1}
                  onPlaceBet={handlePlaceBet}
                  onCashout={handleCashout}
                  walletBalance={walletBalance}
                />
                <BetControl 
                  slot={2}
                  phase={round.phase}
                  currentMultiplier={round.multiplier}
                  activeBet={bet2}
                  onPlaceBet={handlePlaceBet}
                  onCashout={handleCashout}
                  walletBalance={walletBalance}
                />
              </div>
            </>
          )}

          {activeTab === 'results' && (
            <div className="bg-[#101b26] border border-white/5 rounded-2xl p-4 flex flex-col space-y-4 flex-1 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-sm font-black uppercase text-white tracking-wider">Recent Game Results</h3>
                <span className="text-[10px] text-gray-500 font-bold">Click a row to verify fairness</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-widest text-[9px] border-b border-white/5 pb-2">
                      <th className="py-2.5 px-3">Round ID</th>
                      <th className="py-2.5 px-3 text-right">Multiplier</th>
                      <th className="py-2.5 px-3">Crashed Time</th>
                      <th className="py-2.5 px-3">Secret Seed (Revealed)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {historyRounds.map((r, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => handleVerifyRound(r)}
                        className="hover:bg-white/[0.02] cursor-pointer text-gray-300 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-bold text-white text-[11px]">{r.roundId}</td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-500 text-[11px]">{r.crashPoint.toFixed(2)}x</td>
                        <td className="py-2.5 px-3 text-gray-500 text-[10px]">{new Date(r.endTime).toLocaleTimeString()}</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400 truncate max-w-[200px]">{r.serverSeed}</td>
                      </tr>
                    ))}
                    {historyRounds.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-gray-500 uppercase tracking-wider text-[10px]">No historical results found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="bg-[#101b26] border border-white/5 rounded-2xl p-6 flex flex-col space-y-6 flex-1 text-gray-300 animate-in fade-in duration-300 text-sm overflow-y-auto">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-md font-black uppercase text-white tracking-wider">How to Play AviatorX</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider">1. Game Flow</h4>
                  <p className="text-xs font-bold text-gray-400">
                    Place one or two bets before the plane takes off. The multiplier climbs from 1.00x upwards. 
                    Cash out at any time while the plane is flying to win your stake multiplied by the current value. 
                    If the plane crashes ("flies away") before you cash out, your bet is lost.
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider">2. Auto-Bet & Auto-Cashout</h4>
                  <p className="text-xs font-bold text-gray-400">
                    Check the "Auto Bet" box to automatically place bets in consecutive rounds using the set stake. 
                    Check "Auto Cashout" and input a multiplier limit (e.g. 2.00x) to automatically lock in win payouts the moment the flight curve crosses that target.
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider">3. Provably Fair Verification</h4>
                  <p className="text-xs font-bold text-gray-400">
                    All crash multipliers are generated deterministically prior to round start using HMAC-SHA256. 
                    The operator commits to a seed hash before betting opens. When the round crashes, the secret seed is revealed. 
                    You can click any recent result badge or row in the "Results" tab to recalculate the outcome independently and verify fairness.
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider">4. Bet Limits</h4>
                  <p className="text-xs font-bold text-gray-400">
                    Minimum bet: 10 INR. Maximum bet: 100,000 INR per slot. All payouts are computed server-side in minor units with double-precision accuracy. A platform commission of 5% is charged on net winnings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Social Bets Feed */}
        <div className="lg:col-span-3 bg-[#101b26] border border-white/5 rounded-3xl flex flex-col max-h-[750px] overflow-hidden shadow-2xl">
          {/* Lucky Players 101 Header */}
          <div className="bg-[#1b2b3b] border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-white">Lucky Players 101</span>
            <span className="text-[9px] bg-rose-500/10 text-rose-400 font-black px-2 py-0.5 rounded-full border border-rose-500/20">
              {liveBets.length} active
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-4 px-4 py-2 bg-[#0c1520] text-[9px] font-black uppercase text-gray-500 tracking-wider border-b border-white/5 shrink-0">
            <div className="text-left col-span-1">User</div>
            <div className="text-right col-span-1">Size</div>
            <div className="text-right col-span-1">Price</div>
            <div className="text-right col-span-1 col-start-4">Profit</div>
          </div>

          {/* Bets Scrolling container */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] no-scrollbar bg-[#0d1621]">
            {liveBets.map((item, idx) => {
              const netProfit = item.cashed ? Math.round(item.payout - item.stake) : 0;
              return (
                <div 
                  key={idx} 
                  className={`grid grid-cols-4 px-4 py-2 items-center text-xs font-semibold hover:bg-white/[0.01] transition-colors ${
                    item.cashed ? "text-green-400 bg-green-500/[0.005]" : "text-gray-300"
                  }`}
                >
                  {/* User */}
                  <div className="text-left truncate col-span-1 font-bold text-white text-[11px]">
                    {item.username}
                  </div>
                  
                  {/* Size */}
                  <div className="text-right col-span-1 font-mono text-[11px] text-gray-400">
                    {item.stake.toLocaleString()}
                  </div>

                  {/* Price */}
                  <div className="text-right col-span-1 font-extrabold text-[11px]">
                    {item.cashed ? (
                      <span className="text-green-400 font-black">{item.multiplier?.toFixed(2)}</span>
                    ) : (
                      <span className="text-gray-600">--</span>
                    )}
                  </div>

                  {/* Profit */}
                  <div className="text-right col-span-1 font-black text-[11px] text-green-400">
                    {item.cashed ? (
                      netProfit.toLocaleString()
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              );
            })}
            
            {liveBets.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-2">
                <span className="text-2xl opacity-40">👥</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Waiting for bets...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Offline Overlay */}
      {!isConnected && (
        <div className="absolute inset-0 bg-[#0c1520]/80 backdrop-blur-md z-[150] flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-rose-500 border-t-transparent animate-spin"></div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-rose-500 uppercase tracking-widest">Connection Lost</h3>
            <p className="text-xs font-bold text-gray-400">RECONNECTING TO SERVER...</p>
          </div>
        </div>
      )}

      {/* 🛡️ Provably Fair Verification Modal */}
      {isVerifierOpen && selectedRound && (
        <ProvablyFairModal 
          round={selectedRound} 
          onClose={() => setIsVerifierOpen(false)} 
        />
      )}
    </div>
  );
}
