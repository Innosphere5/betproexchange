"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import io from "socket.io-client";
import { getApiUrl } from "../lib/apiConfig";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NotificationPopup from "./NotificationPopup";
import BetSlip from "./BetSlip";

// Create a context for dashboard state
export const DashboardContext = createContext();

// Custom hook to use the dashboard context
export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        return {
            currentView: 'home',
            selectedMatchId: null,
            betSelection: null,
            cricketMatches: [],
            walletBalance: 0,
            creditBalance: 0,
            socket: null,
            fetchWallet: () => {},
            handleSelectMatch: () => {},
            handleSelectOutcome: () => {},
            clearBetSelection: () => {},
            goToHome: () => {}
        };
    }
    return context;
};

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

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState("home");
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [betSelection, setBetSelection] = useState(null);
  const [cricketMatches, setCricketMatches] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [creditBalance, setCreditBalance] = useState(0);
  const [socketInstance, setSocketInstance] = useState(null);
  const [notification, setNotification] = useState(null);


  // ── Auth Guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem("user_session");
    if (!raw) {
      router.replace("/login");
      return;
    }
    try {
      const session = JSON.parse(raw);
      if (session?.role === "admin") {
        router.replace("/admin/dashboard");
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.replace("/login");
    }
  }, [router]);
  // ────────────────────────────────────────────────────────────────────────────

  const fetchWallet = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/user/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.balance);
        setCreditBalance(data.credit);
      } else if (res.status === 401) {
        router.replace('/login');
      }
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    }
  };

  useEffect(() => {
    fetchWallet();

    const socket = io(getApiUrl(), { transports: ["websocket", "polling"] });
    setSocketInstance(socket);

    socket.on('bet_notification', (data) => {
        setNotification(data);
        fetchWallet(); // Automatically update balance if payout happened
    });

    socket.on('bet_settled', (data) => {
        setNotification(data);
        fetchWallet();
    });

    socket.on('wallet_updated', (data) => {
        const session = JSON.parse(localStorage.getItem('user_session') || '{}');
        if (data.userId === session.username) {
            setWalletBalance(data.balance);
            setCreditBalance(data.credit || 0);
        }
    });

    socket.on('matches_updated', (data) => {
        setCricketMatches(data);
    });

    socket.on('live_score_update', (data) => {
        setCricketMatches(prev => prev.map(m => {
            if (String(m.matchId) === String(data.matchId)) {
                const nextScore = {
                    ...m.score,
                    teamA_runs: data.teamA_runs ?? m.score?.teamA_runs,
                    teamB_runs: data.teamB_runs ?? m.score?.teamB_runs,
                    overs: data.overs ?? m.score?.overs,
                    wickets: data.wickets ?? m.score?.wickets,
                    target: data.target ?? m.score?.target,
                    runRate: data.runRate ?? m.score?.runRate,
                    reqRunRate: data.reqRunRate ?? m.score?.reqRunRate,
                    thisOver: data.thisOver ?? m.score?.thisOver,
                    remRuns: data.remRuns ?? m.score?.remRuns,
                    remBalls: data.remBalls ?? m.score?.remBalls,
                    lastUpdated: new Date()
                };

                return {
                    ...m,
                    status: data.status || m.status,
                    score: nextScore
                };
            }
            return m;
        }));
    });

    socket.on('market_odds_update', (data) => {
        setCricketMatches(prev => prev.map(m => {
            // ✅ Normalize matchId to string for safe comparison
            // Server emits matchId as String, but data.matchId or data.matchIdNum may vary
            const incomingId = String(data.matchId ?? data.matchIdNum ?? '');
            if (String(m.matchId) === incomingId) {
                if (data.marketStatus && !data.runners) {
                    return { 
                        ...m, 
                        marketStatus: data.marketStatus,
                        bookmakerMarketStatus: data.bookmakerMarketStatus || data.marketStatus 
                    };
                }
                const runners = data.runners || [];
                const runnerA = runners[0];
                const runnerB = runners[1];
                const bmRunners = data.bookmakerRunners || [];
                const bmRunnerA = bmRunners[0];
                const bmRunnerB = bmRunners[1];

                return {
                    ...m,
                    marketStatus: 'OPEN',
                    backOddsA: runnerA?.back || m.backOddsA,
                    layOddsA: runnerA?.lay || m.layOddsA,
                    backOddsB: runnerB?.back || m.backOddsB,
                    layOddsB: runnerB?.lay || m.layOddsB,
                    depthBackA: runnerA?.depthBack || m.depthBackA,
                    depthLayA: runnerA?.depthLay || m.depthLayA,
                    depthBackB: runnerB?.depthBack || m.depthBackB,
                    depthLayB: runnerB?.depthLay || m.depthLayB,
                    bookmakerBackA: bmRunnerA?.back ?? m.bookmakerBackA,
                    bookmakerLayA: bmRunnerA?.lay ?? m.bookmakerLayA,
                    bookmakerBackB: bmRunnerB?.back ?? m.bookmakerBackB,
                    bookmakerLayB: bmRunnerB?.lay ?? m.bookmakerLayB,
                    bookmakerDepthBackA: bmRunnerA?.depthBack ?? m.bookmakerDepthBackA ?? '100',
                    bookmakerDepthLayA: bmRunnerA?.depthLay ?? m.bookmakerDepthLayA ?? '100',
                    bookmakerDepthBackB: bmRunnerB?.depthBack ?? m.bookmakerDepthBackB ?? '100',
                    bookmakerDepthLayB: bmRunnerB?.depthLay ?? m.bookmakerDepthLayB ?? '100',
                    bookmakerMarketStatus: data.bookmakerMarketStatus || m.bookmakerMarketStatus || 'OPEN',
                    lastUpdated: data.updatedAt || new Date()
                };
            }
            return m;
        }));
    });

    socket.on('bookmaker_odds_update', (data) => {
        setCricketMatches(prev => prev.map(m => {
            const incomingId = String(data.matchId ?? '');
            if (String(m.matchId) === incomingId) {
                return {
                    ...m,
                    bookmakerBackA: data.bookmakerBackA ?? m.bookmakerBackA,
                    bookmakerLayA: data.bookmakerLayA ?? m.bookmakerLayA,
                    bookmakerBackB: data.bookmakerBackB ?? m.bookmakerBackB,
                    bookmakerLayB: data.bookmakerLayB ?? m.bookmakerLayB,
                    bookmakerDepthBackA: data.bookmakerDepthBackA ?? m.bookmakerDepthBackA ?? '100',
                    bookmakerDepthLayA: data.bookmakerDepthLayA ?? m.bookmakerDepthLayA ?? '100',
                    bookmakerDepthBackB: data.bookmakerDepthBackB ?? m.bookmakerDepthBackB ?? '100',
                    bookmakerDepthLayB: data.bookmakerDepthLayB ?? m.bookmakerDepthLayB ?? '100',
                    bookmakerMarketStatus: data.bookmakerMarketStatus ?? m.bookmakerMarketStatus ?? 'OPEN',
                    lastUpdated: data.updatedAt || new Date()
                };
            }
            return m;
        }));
    });

    socket.on('odds_updated', (data) => {
        setCricketMatches(prev => prev.map(m => {
            if (String(m.matchId) === String(data.matchId)) {
                if (data.marketStatus && !data.teamABack) {
                    return { ...m, marketStatus: data.marketStatus, bookmakerMarketStatus: data.bookmakerMarketStatus || data.marketStatus };
                }
                return {
                    ...m,
                    marketStatus: 'OPEN',
                    backOddsA: data.teamABack ?? m.backOddsA,
                    layOddsA: data.teamALay ?? m.layOddsA,
                    backOddsB: data.teamBBack ?? m.backOddsB,
                    layOddsB: data.teamBLay ?? m.layOddsB,
                    depthBackA: data.depthBackA ?? m.depthBackA,
                    depthLayA: data.depthLayA ?? m.depthLayA,
                    depthBackB: data.depthBackB ?? m.depthBackB,
                    depthLayB: data.depthLayB ?? m.depthLayB,
                    bookmakerBackA: data.bookmakerBackA ?? m.bookmakerBackA,
                    bookmakerLayA: data.bookmakerLayA ?? m.bookmakerLayA,
                    bookmakerBackB: data.bookmakerBackB ?? m.bookmakerBackB,
                    bookmakerLayB: data.bookmakerLayB ?? m.bookmakerLayB,
                    bookmakerMarketStatus: data.bookmakerMarketStatus || m.bookmakerMarketStatus || 'OPEN',
                    lastUpdated: data.updatedAt || new Date()
                };
            }
            return m;
        }));
    });

    socket.on('match_result', (data) => {
        setCricketMatches(prev => prev.map(m => {
            if (String(m.matchId) === String(data.matchId)) {
                return {
                    ...m,
                    status: 'completed',
                    winner: data.winner,
                    score: {
                        ...m.score,
                        teamA_runs: data.finalScore?.teamA || m.score?.teamA_runs,
                        teamB_runs: data.finalScore?.teamB || m.score?.teamB_runs,
                        overs: "Final",
                        lastUpdated: new Date()
                    }
                };
            }
            return m;
        }));
    });

    socket.on('toss_odds_update', (data) => {
        setCricketMatches(prev => prev.map(m => {
            const incomingId = String(data.matchId ?? '');
            if (String(m.matchId) === incomingId) {
                return {
                    ...m,
                    tossMarketStatus: data.tossMarketStatus ?? m.tossMarketStatus,
                    tossWinner: data.tossWinner ?? m.tossWinner,
                    tossBackA: data.tossBackA ?? m.tossBackA,
                    tossLayA: data.tossLayA ?? m.tossLayA,
                    tossBackB: data.tossBackB ?? m.tossBackB,
                    tossLayB: data.tossLayB ?? m.tossLayB,
                    tossDepthBackA: data.tossDepthBackA ?? m.tossDepthBackA,
                    tossDepthLayA: data.tossDepthLayA ?? m.tossDepthLayA,
                    tossDepthBackB: data.tossDepthBackB ?? m.tossDepthBackB,
                    tossDepthLayB: data.tossDepthLayB ?? m.tossDepthLayB,
                    lastUpdated: data.updatedAt || new Date()
                };
            }
            return m;
        }));
    });

    // ─── Fancy 2 Market Live Updates ──────────────────────────────────────────
    socket.on('fancy_market_update', (data) => {
        setCricketMatches(prev => prev.map(m => {
            if (String(m.matchId) === String(data.matchId ?? '')) {
                return { ...m, fancyMarkets: data.fancyMarkets ?? m.fancyMarkets };
            }
            return m;
        }));
    });

    // ─── Figure Market Live Updates ────────────────────────────────────────────
    socket.on('figure_market_update', (data) => {
        setCricketMatches(prev => prev.map(m => {
            if (String(m.matchId) === String(data.matchId ?? '')) {
                return { ...m, figureMarkets: data.figureMarkets ?? m.figureMarkets };
            }
            return m;
        }));
    });

    // ─── Even/Odd Market Live Updates ──────────────────────────────────────────
    socket.on('even_odd_market_update', (data) => {
        setCricketMatches(prev => prev.map(m => {
            if (String(m.matchId) === String(data.matchId ?? '')) {
                return { ...m, evenOddMarkets: data.evenOddMarkets ?? m.evenOddMarkets };
            }
            return m;
        }));
    });

    // ─── Tied Match (Others) Market Live Updates ───────────────────────────────
    socket.on('tied_match_market_update', (data) => {
        setCricketMatches(prev => prev.map(m => {
            if (String(m.matchId) === String(data.matchId ?? '')) {
                return { ...m, tiedMatchMarket: data.tiedMatchMarket ?? m.tiedMatchMarket };
            }
            return m;
        }));
    });

    const fetchMatches = async () => {
      console.log("[Dashboard] 🔍 Fetching from:", `${getApiUrl()}/api/matches`);
      try {
        const res = await fetch(`${getApiUrl()}/api/matches`);
        if (res.ok) {
          const data = await res.json();
          setCricketMatches(data);
        }
      } catch (err) {
        // Gracefully silent on transient poll failure
      }
    };

    const fetchLiveScores = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/matches/live`);
        if (res.ok) {
          const liveData = await res.json();
          setCricketMatches(prev => {
            // Update only the live matches in the existing list
            return prev.map(m => {
              const updated = liveData.find(ld => ld.matchId === m.matchId);
              return updated ? updated : m;
            });
          });
        }
      } catch (err) {
        console.error("❌ Failed to fetch live scores:", err.message, err);
      }
    };

    fetchMatches();
    const matchesRefetchInterval = setInterval(fetchMatches, 60000);

    return () => {
      clearInterval(matchesRefetchInterval);
      socket.disconnect();
    };
  }, []);

  // ── Browser History Integration (Mobile Back / Forward Support) ────────────
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      const matchParam = url.searchParams.get("match");
      if (matchParam) {
        setSelectedMatchId(matchParam);
        setCurrentView("match");
      } else {
        setSelectedMatchId(null);
        setCurrentView("home");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Restore match if URL already has ?match= on initial load or refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const matchParam = url.searchParams.get("match");
    if (matchParam) {
      setSelectedMatchId(matchParam);
      setCurrentView("match");
    }
  }, [pathname]);

  const handleSelectMatch = (matchId) => {
    setSelectedMatchId(matchId);
    setCurrentView("match");
    setIsSidebarOpen(false);
    
    // Push new history state so browser/mobile hardware back button returns to matches
    if (typeof window !== 'undefined') {
      const targetUrl = `/dashboard?match=${encodeURIComponent(matchId)}`;
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get("match") !== String(matchId)) {
        window.history.pushState({ matchId: String(matchId) }, '', targetUrl);
      }
    }

    // If user is on a sub-page (like /dashboard/casino), go back to main dashboard
    if (pathname !== "/dashboard" && pathname !== "/") {
      router.push(`/dashboard?match=${encodeURIComponent(matchId)}`);
    }
  };

  const handleSelectOutcome = (runner, price, type, isLive, marketType = 'match_odds') => {
    const match = cricketMatches.find(m => m.matchId === selectedMatchId);
    setBetSelection({ 
      matchId: selectedMatchId,
      runner, 
      price, 
      type, 
      isLive, 
      marketType,
      matchName: match ? `${match.teamA} v ${match.teamB}` : "Match" 
    });
  };

  const clearBetSelection = () => setBetSelection(null);

  const goToHome = () => {
    setCurrentView("home");
    setSelectedMatchId(null);
    setIsSidebarOpen(false);

    // Sync browser URL back to /dashboard
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has("match")) {
        window.history.pushState({}, '', '/dashboard');
      }
    }

    // Ensure we are on the main dashboard
    if (pathname !== "/dashboard" && pathname !== "/") {
      router.push("/dashboard");
    }
  };

  // Show spinner while auth is being checked / redirecting
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#eaedf1] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCricketMatch = cricketMatches.find(m => String(m.matchId) === String(selectedMatchId));
  const activeMatchTitle = activeCricketMatch 
    ? `${activeCricketMatch.teamA} v ${activeCricketMatch.teamB}` 
    : (selectedMatchId ? "Match Details" : null);

  return (
    <DashboardContext.Provider value={{ 
      currentView, 
      selectedMatchId, 
      betSelection, 
      cricketMatches,
      walletBalance,
      creditBalance,
      socket: socketInstance,
      fetchWallet,
      handleSelectMatch, 
      handleSelectOutcome, 
      clearBetSelection,
      goToHome 
    }}>
      <div className="flex h-screen bg-[#eaedf1] overflow-hidden font-sans text-sm">
        {/* Sidebar overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          onSelectMatch={handleSelectMatch}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header 
            setIsSidebarOpen={setIsSidebarOpen} 
            onDashboardClick={goToHome}
            onBack={goToHome}
            currentView={currentView}
            selectedMatch={activeMatchTitle}
          />
          
          {/* Scrollable Core */}
          <main className="flex-1 overflow-y-auto w-full">
            {children}
          </main>
        </div>

        {/* Global Notification Layer */}
        <NotificationPopup 
          notification={notification} 
          onClose={() => setNotification(null)} 
        />

        {/* Global Mobile BetSlip Popup (Sticky at top) */}
        {betSelection && (
          <div className="lg:hidden fixed inset-x-0 top-0 z-[100] p-3 animate-in slide-in-from-top-full duration-300">
             <div className="absolute inset-x-0 h-screen bg-black/20 backdrop-blur-[2px] -z-10" onClick={clearBetSelection}></div>
             <BetSlip 
                selection={betSelection} 
                onClose={clearBetSelection} 
                type={betSelection.type} 
             />
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}

