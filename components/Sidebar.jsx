"use client";

import { X, ChevronDown, ChevronRight, LogOut } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useDashboard } from "./DashboardLayout"; // Assuming Sidebar is updated to use context

// Base Icons
const CricketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <line x1="8" y1="16" x2="16" y2="8" strokeWidth="2.5" />
    <line x1="6" y1="18" x2="8" y2="16" strokeWidth="2.5" />
  </svg>
);

const HorseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 20h18" /><path d="M15 13c1.5 0 2-1 2-2.5S16 8 16 8" /><path d="M7 13c-1.5 0-2-1-2-2.5S6 8 6 8" /><path d="M12 5v8" /><path d="M6 13h12" /><path d="M9 13v7" /><path d="M15 13v7" />
  </svg>
);

const CasinoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
  </svg>
);

const navItems = [
  { label: "Casino", icon: <CasinoIcon />, link: "/dashboard/casino" },
  {
    label: "Cricket",
    icon: <CricketIcon />,
    isActive: true,
    submenu: [
      "All Cricket",
      "Indian Premier League",
      "Bangladesh v New Zealand",
      "Chennai Super Kings v Kolkata Knight Riders",
      "Hyderabad Kingsmen v Rawalpindi United",
      "Karachi Kings v Islamabad United",
      "Mumbai Indians v Punjab Kings",
      "Peshawar Zalmi v Multan Sultans",
      "Royal Challengers Bengaluru v Lucknow Super Giants",
      "Sunrisers Hyderabad v Rajasthan Royals"
    ]
  }
];

export default function Sidebar({ isOpen, setIsOpen, onSelectMatch }) {
  const [expandedItem, setExpandedItem] = useState("Cricket");
  const { cricketMatches } = useDashboard();

  const dynamicNavItems = navItems.map(item => {
    if (item.label === "Cricket") {
      const matchEntries = cricketMatches?.map(m => ({
        id: m.matchId,
        label: m.status === 'live' ? `🔴 LIVE: ${m.teamA} v ${m.teamB}` : `${m.teamA} v ${m.teamB}`
      })) || [];
      
      return {
        ...item,
        submenu: [{ id: "all", label: "All Cricket" }, ...matchEntries]
      };
    }
    return item;
  });

  return (
    <aside
      className={`fixed lg:static top-0 left-0 h-full w-[250px] bg-[#243f55] text-white flex flex-col transition-transform duration-300 ease-in-out z-50 shadow-2xl lg:shadow-none
      ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[#3b546b] shrink-0 bg-[#243f55]">
        <div className="relative w-[100px] lg:w-[120px] h-[30px] lg:h-[40px] flex items-center">
          <span className="text-[#00c766] font-black text-xl lg:text-2xl tracking-tighter">BetProExchange</span>
        </div>
        <button
          className="lg:hidden text-white p-1 hover:text-gray-300 transition-colors focus:outline-none"
          onClick={() => setIsOpen(false)}
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-0 no-scrollbar">
        <ul className="divide-y divide-[#3b546b]">
          {dynamicNavItems.map((item, idx) => {
            const isSelected = expandedItem === item.label;
            return (
              <li key={idx} className="flex flex-col">
                <button
                  onClick={() => setExpandedItem(isSelected ? null : item.label)}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors w-full text-left
                  ${isSelected ? "bg-[#bf1212]" : "hover:bg-[#3b546b]"}
                  `}
                >
                  <div className="text-white opacity-100">{item.icon}</div>

                  {item.link ? (
                    <Link href={item.link} onClick={() => setIsOpen(false)} className="text-[13px] font-bold tracking-normal flex-1">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-[13px] font-bold tracking-normal flex-1">{item.label}</span>
                  )}

                  {item.submenu && (
                    isSelected ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />
                  )}
                </button>

                {/* Submenu */}
                {item.submenu && isSelected && (
                  <div className="bg-[#454e56] py-1">
                    {item.submenu.map((sub, sIdx) => {
                      // Sub can be an object if updated, or string if fallback content
                      const isObj = typeof sub === 'object';
                      const label = isObj ? sub.label : sub;
                      const onClickParam = isObj && sub.id !== 'all' ? sub.id : label;

                      return (
                        <button
                          key={sIdx}
                          onClick={() => onSelectMatch && onSelectMatch(onClickParam)}
                          className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile Logout Button */}
      <div className="lg:hidden p-4 border-t border-[#3b546b]">
        <button
          onClick={() => {
            localStorage.removeItem("user_session");
            document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 font-bold rounded-lg transition-colors border border-red-500/30"
        >
          <LogOut size={18} />
          <span className="text-sm uppercase tracking-wider">Logout</span>
        </button>
      </div>
    </aside>
  );
}
