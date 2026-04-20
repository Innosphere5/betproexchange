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
        throw new Error("useDashboard must be used within a DashboardLayout");
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
      } else if (res.status === 401) {
        router.push('/login');
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

    socket.on('wallet_updated', (data) => {
        const session = JSON.parse(localStorage.getItem('user_session') || '{}');
        if (data.userId === session.username) {
            setWalletBalance(data.balance);
        }
    });

    socket.on('matches_updated', (data) => {
        setCricketMatches(data);
    });

    const fetchMatches = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/matches`);
        if (res.ok) {
          const data = await res.json();
          setCricketMatches(data);
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err);
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
        console.error("Failed to fetch live scores:", err);
      }
    };

    fetchMatches();
    const interval = setInterval(fetchLiveScores, 20000); // 20s polling

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleSelectMatch = (matchId) => {
    setSelectedMatchId(matchId);
    setCurrentView("match");
    setIsSidebarOpen(false);
    
    // If user is on a sub-page (like /dashboard/casino), go back to main dashboard
    if (pathname !== "/dashboard" && pathname !== "/") {
      router.push("/dashboard");
    }
  };

  const handleSelectOutcome = (runner, price, type, isLive) => {
    const match = cricketMatches.find(m => m.matchId === selectedMatchId);
    setBetSelection({ 
      matchId: selectedMatchId,
      runner, 
      price, 
      type, 
      isLive, 
      matchName: match ? `${match.teamA} v ${match.teamB}` : "Match" 
    });
  };

  const clearBetSelection = () => setBetSelection(null);

  const goToHome = () => {
    setCurrentView("home");
    setSelectedMatchId(null);

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

  return (
    <DashboardContext.Provider value={{ 
      currentView, 
      selectedMatchId, 
      betSelection, 
      cricketMatches,
      walletBalance,
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
          <Header setIsSidebarOpen={setIsSidebarOpen} onDashboardClick={goToHome} />
          
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

