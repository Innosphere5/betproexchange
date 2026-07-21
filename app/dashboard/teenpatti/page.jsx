"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDashboard } from "../../../components/DashboardLayout";
import { useTeenPattiStore } from "../../../lib/useTeenPattiStore";
import { getApiUrl } from "../../../lib/apiConfig";
import TeenPattiDealer from "../../../components/teenpatti/TeenPattiDealer";
import TeenPattiBettingBoard from "../../../components/teenpatti/TeenPattiBettingBoard";
import TeenPattiSideBets from "../../../components/teenpatti/TeenPattiSideBets";
import TeenPattiOpenBets from "../../../components/teenpatti/TeenPattiOpenBets";

export default function TeenPattiPage() {
  const { socket, walletBalance, fetchWallet } = useDashboard();

  // Pull individual store values (not the whole object) to avoid unnecessary re-renders
  const roundId = useTeenPattiStore(s => s.roundId);
  const status = useTeenPattiStore(s => s.status);
  const timer = useTeenPattiStore(s => s.timer);
  const cards = useTeenPattiStore(s => s.cards);
  const handNames = useTeenPattiStore(s => s.handNames);
  const result = useTeenPattiStore(s => s.result);
  const history = useTeenPattiStore(s => s.history);
  const userBets = useTeenPattiStore(s => s.userBets);

  const setGameState = useTeenPattiStore(s => s.setGameState);
  const pushHistory = useTeenPattiStore(s => s.pushHistory);
  const addUserBet = useTeenPattiStore(s => s.addUserBet);
  const syncUserBets = useTeenPattiStore(s => s.syncUserBets);
  const clearUserBets = useTeenPattiStore(s => s.clearUserBets);

  const [selectedChoice, setSelectedChoice] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [payoutNotification, setPayoutNotification] = useState(null);
  const [generalWinnerBanner, setGeneralWinnerBanner] = useState(null);

  const joinedRef = useRef(false);

  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("user_session") || "{}").token;
      } catch { return null; }
    }
    return null;
  }, []);

  const getSessionUser = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        return JSON.parse(localStorage.getItem("user_session") || "{}").username || "";
      } catch { return ""; }
    }
    return "";
  }, []);

  // ─── Fetch helpers ────────────────────────────────────────
  const fetchActiveBets = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/teenpatti/active-bets`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const bets = await res.json();
        syncUserBets(bets);
      }
    } catch (e) {
      console.error("Failed to load active bets:", e);
    }
  }, [getAuthToken, syncUserBets]);

  // ─── Socket effect (runs ONCE per socket instance) ────────
  useEffect(() => {
    if (!socket) return;

    // Prevent double join
    if (!joinedRef.current) {
      socket.emit("join_teenpatti");
      joinedRef.current = true;
    }
    setIsConnected(socket.connected);

    const handleConnect = () => {
      setIsConnected(true);
      if (!joinedRef.current) {
        socket.emit("join_teenpatti");
        joinedRef.current = true;
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      joinedRef.current = false;
    };

    const syncState = (state) => {
      setGameState({
        roundId: state.roundId,
        status: state.status,
        result: state.result,
        timer: state.timer,
        cards: state.cards,
        handNames: state.handNames,
        // history comes from server state — set it only if present
        ...(state.history ? { history: state.history } : {})
      });
    };

    const onStart = (r) => {
      setGameState({
        roundId: r.roundId,
        status: r.status || "DEALING",
        timer: r.timer || 5,
        cards: r.cards || null,
        handNames: null,
        result: "PENDING"
      });
      clearUserBets();
      setSelectedChoice(null);
      setStakeAmount("");
      setGeneralWinnerBanner(null);
    };

    const onClose = () => {
      setGameState({ status: "BETTING_CLOSED" });
    };

    const onResult = (r) => {
      setGameState({
        status: "RESULT_DECLARED",
        result: r.result,
        cards: r.cards,
        handNames: r.handNames
      });
      pushHistory(r.result);

      setGeneralWinnerBanner(r.result);
      setTimeout(() => setGeneralWinnerBanner(null), 6000);
    };

    const onBetPlaced = (bet) => {
      const username = getSessionUser();
      if (bet.userId === username) {
        addUserBet(bet);
      }
    };

    const onPayout = (data) => {
      const username = getSessionUser();
      if (data.userId === username) {
        fetchWallet();
        setPayoutNotification({
          result: data.result,
          amount: data.amount,
          choice: data.betType
        });
        setTimeout(() => setPayoutNotification(null), 4500);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("teenpatti_state", syncState);
    socket.on("teenpatti_round_start", onStart);
    socket.on("teenpatti_betting_closed", onClose);
    socket.on("teenpatti_result_declared", onResult);
    socket.on("teenpatti_bet_placed", onBetPlaced);
    socket.on("teenpatti_payout", onPayout);

    return () => {
      socket.emit("leave_teenpatti");
      joinedRef.current = false;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("teenpatti_state", syncState);
      socket.off("teenpatti_round_start", onStart);
      socket.off("teenpatti_betting_closed", onClose);
      socket.off("teenpatti_result_declared", onResult);
      socket.off("teenpatti_bet_placed", onBetPlaced);
      socket.off("teenpatti_payout", onPayout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Fetch active bets on mount
  useEffect(() => {
    fetchActiveBets();
  }, [fetchActiveBets]);

  // ─── Actions ──────────────────────────────────────────────
  const [selectedChip, setSelectedChip] = useState("10");

  const handleSelectBetType = (betType) => {
    setSelectedChoice(betType);
    setStakeAmount(selectedChip);
  };

  useEffect(() => {
    if (selectedChoice) {
      setStakeAmount(selectedChip);
    }
  }, [selectedChip, selectedChoice]);

  const handleCancelSelection = () => {
    setSelectedChoice(null);
    setStakeAmount("");
  };

  const handleSubmitBet = async () => {
    if (!selectedChoice) return;
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount < 10) {
      setErrorMsg("Minimum bet amount is 10");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    if (amount > walletBalance) {
      setErrorMsg("Insufficient wallet balance");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${getApiUrl()}/api/teenpatti/bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ betType: selectedChoice, amount })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bet placement failed");

      fetchWallet();
      handleCancelSelection();
    } catch (e) {
      setErrorMsg(e.message);
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const isBettingOpen = status === "BETTING_OPEN";

  // Build a round state object for child components
  const roundState = { roundId, status, timer, cards, handNames, result };

  return (
    <div className="min-h-screen bg-[#0d131c] text-white p-2 sm:p-6 select-none font-sans relative">

      {/* Top Controls */}
      <div className="flex flex-row items-center justify-between gap-2 bg-[#121820] border border-slate-700/40 px-3 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-3xl mb-3 sm:mb-6 shadow-xl w-full">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md font-black text-white text-sm sm:text-lg shrink-0">
            ⚡
          </div>
          <div>
            <h1 className="text-xs sm:text-base font-black tracking-wider uppercase text-white leading-none">
              Teen Patti Live
            </h1>
            <span className="text-[8px] sm:text-[9px] text-emerald-400 font-semibold tracking-wider flex items-center gap-1 uppercase mt-0.5 sm:mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-ping" : "bg-red-500"}`} />
              {isConnected ? "Live Room" : "Connecting..."}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="bg-[#0c0f14] border border-slate-800/80 px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl flex flex-col items-end">
            <span className="text-[7px] sm:text-[8px] text-slate-500 font-extrabold uppercase tracking-widest leading-none mb-0.5">Wallet</span>
            <span className="text-[11px] sm:text-sm font-black text-emerald-400 font-mono">
              ${walletBalance !== undefined ? walletBalance.toFixed(2) : "0.00"}
            </span>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {errorMsg && (
        <div className="absolute top-16 sm:top-24 left-1/2 -translate-x-1/2 bg-rose-950 border border-rose-500/50 text-rose-300 px-4 py-2 rounded-xl text-xs font-semibold text-center z-50 shadow-xl animate-pulse">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6 items-start w-full">
        {/* Left/Center Column (2/3) */}
        <div className="lg:col-span-2 flex flex-col space-y-3.5 sm:space-y-6 w-full">
          <TeenPattiDealer round={roundState} history={history} />
          <TeenPattiBettingBoard
            round={roundState}
            onSelectBet={handleSelectBetType}
            selectedChoice={selectedChoice}
            userBets={userBets}
            selectedChip={selectedChip}
            setSelectedChip={setSelectedChip}
          />
        </div>

        {/* Right Sidebar (1/3) */}
        <div className="flex flex-col space-y-3.5 sm:space-y-6 w-full">
          <TeenPattiOpenBets
            userBets={userBets}
            selectedChoice={selectedChoice}
            stakeAmount={stakeAmount}
            onChangeStake={setStakeAmount}
            onSubmitBet={handleSubmitBet}
            onCancel={handleCancelSelection}
            isBettingOpen={isBettingOpen}
            walletBalance={walletBalance}
          />
          <TeenPattiSideBets
            round={roundState}
            onSelectBet={handleSelectBetType}
            selectedChoice={selectedChoice}
            userBets={userBets}
          />
        </div>
      </div>
    </div>
  );
}
