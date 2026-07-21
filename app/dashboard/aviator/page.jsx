"use client";

import React, { useEffect, useState } from "react";
import { useDashboard } from "../../../components/DashboardLayout";
import { useAviatorStore } from "../../../lib/useAviatorStore";
import { getApiUrl } from "../../../lib/apiConfig";
import AviatorCanvas from "../../../components/aviator/AviatorCanvas";
import AviatorBetPanel from "../../../components/aviator/AviatorBetPanel";
import AviatorHistory from "../../../components/aviator/AviatorHistory";
import AviatorPlayers from "../../../components/aviator/AviatorPlayers";
import AviatorSettingsModal from "../../../components/aviator/AviatorSettingsModal";

export default function AviatorPage() {
  const { socket, walletBalance, fetchWallet } = useDashboard();
  const { setGameState, addLiveBet, markLiveCashout, syncUserBets } = useAviatorStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('user_session');
      if (session) {
        try {
          return JSON.parse(session).token;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  // Reconnection and REST Recovery Flow
  const fetchActiveBets = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/aviator/active-bets`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const bets = await res.json();
        syncUserBets(bets);
      }
    } catch (e) {
      console.error("Failed to load active bets recovery:", e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/aviator/history`);
      if (res.ok) {
        const historyRounds = await res.json();
        const crashPoints = historyRounds.map(r => r.crashPoint).reverse();
        setGameState({ history: crashPoints });
      }
    } catch (e) {
      console.error("Failed to load history strip:", e);
    }
  };

  useEffect(() => {
    fetchActiveBets();
    fetchHistory();
  }, []);

  // WebSockets Synchronization Listener
  useEffect(() => {
    if (!socket) return;

    setIsConnected(socket.connected);
    socket.emit("join_aviator");

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit("join_aviator");
      fetchActiveBets();
      fetchHistory();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleState = (state) => {
      const prevPhase = useAviatorStore.getState().phase;
      setGameState(state);
      
      // If phase changes to crashed, sync wallet balances
      if (state.phase === "CRASHED" && prevPhase !== "CRASHED") {
        fetchWallet();
      }
    };

    const handleBetPlaced = (bet) => {
      addLiveBet(bet);
    };

    const handleCashoutSuccess = (cashout) => {
      // If it is the current user's cashout, perform wallet and bet state updates
      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      if (cashout.userId === session.username) {
        // CRITICAL: Immediately mark the bet as WON locally so the CRASHED
        // state handler (which may arrive in the same event loop tick) doesn't
        // overwrite it to LOST.
        const { setUserCashoutSuccess } = useAviatorStore.getState();
        setUserCashoutSuccess(cashout.betSlot, cashout.multiplier, cashout.payout);
        fetchWallet();
      }
      markLiveCashout(cashout);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("aviator_state", handleState);
    socket.on("aviator_bet_placed", handleBetPlaced);
    socket.on("aviator_cashout_success", handleCashoutSuccess);

    return () => {
      socket.emit("leave_aviator");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("aviator_state", handleState);
      socket.off("aviator_bet_placed", handleBetPlaced);
      socket.off("aviator_cashout_success", handleCashoutSuccess);
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-[#0d131c] text-white p-3 sm:p-6 select-none font-sans">
      {/* Top Header Controls bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121820] border border-[#2c3746] p-4 rounded-3xl mb-6 shadow-xl w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#e11d48] to-[#fb7185] flex items-center justify-center shadow-lg font-black text-white text-base tracking-tighter">
            ✈️
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-wider uppercase text-white leading-none">
              Aviator Crash
            </h1>
            <span className="text-[9px] text-emerald-400 font-semibold tracking-wider flex items-center gap-1 uppercase mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-ping" : "bg-red-500"}`} />
              {isConnected ? "Multiplayer Room Sync" : "Connecting..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Wallet display */}
          <div className="bg-[#0c0f14] border border-[#2c3746] px-4 py-2 rounded-2xl flex flex-col items-end">
            <span className="text-[8px] text-gray-500 font-extrabold uppercase tracking-widest leading-none mb-0.5">
              Available Balance
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
              ${walletBalance !== undefined ? walletBalance.toFixed(2) : "0.00"} USD
            </span>
          </div>

          {/* Settings modal trigger */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="bg-[#2c3746]/60 border border-[#2c3746] hover:bg-[#344153] text-gray-300 font-extrabold py-2.5 px-4 rounded-2xl transition-all cursor-pointer text-xs uppercase"
          >
            How to Play
          </button>
        </div>
      </div>

      {/* Main Game Interface Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Left / Center columns: Pixi Canvas and Bet Panel */}
        <div className="lg:col-span-2 flex flex-col w-full">
          <AviatorCanvas />
          <AviatorBetPanel />
        </div>

        {/* Right column: History ribbon & Players bets feed */}
        <div className="flex flex-col space-y-4 w-full">
          <AviatorHistory />
          <AviatorPlayers />
        </div>
      </div>

      {/* Settings Modal */}
      <AviatorSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
