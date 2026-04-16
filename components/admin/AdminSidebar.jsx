"use client";

import { X, LayoutDashboard, Users, Filter, FileText, Lock, Star, Globe, Gamepad2, ChevronLeft, ChevronDown, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Base SVGs for Sports
const FootballIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-80">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </svg>
);

const TennisIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-80">
    <circle cx="12" cy="12" r="10" />
    <path d="M5.5 5.5C7.5 9 7.5 15 5.5 18.5M18.5 5.5C16.5 9 16.5 15 18.5 18.5" />
  </svg>
);

const CricketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-80">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <line x1="8" y1="16" x2="16" y2="8" strokeWidth="2.5" />
    <line x1="6" y1="18" x2="8" y2="16" strokeWidth="2.5" />
  </svg>
);

const HorseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-80">
    <path d="M4 18l2.5-3.5h7.5l2.5 3.5" />
    <circle cx="12" cy="9" r="6" />
    <path d="M10 9l2-2 2 2" />
  </svg>
);

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={18} className="opacity-80" /> },
  { label: "Users", href: "/admin/users", icon: <Users size={18} className="opacity-80" /> },
  { label: "Current Position", href: "#", icon: <Filter size={18} className="opacity-80" /> },
  { label: "Reports", href: "/admin/reports", icon: <FileText size={18} className="opacity-80" /> },
  { label: "Bet Lock", href: "/admin/betlock", icon: <Lock size={18} className="opacity-80" /> },
  { label: "Star Casino", href: "#", icon: <Star size={18} className="opacity-80" /> },
  { label: "World Casino", href: "#", icon: <Globe size={18} className="opacity-80" /> },
  { label: "BetFair Games", href: "#", icon: <Gamepad2 size={18} className="opacity-80" /> },
  { 
    label: "Soccer", 
    href: "#", 
    isSport: true,
    icon: <FootballIcon />,
    children: [
      { label: "Man Utd v Leeds", id: "soccer-1" },
      { label: "Atletico Madrid v Barcelona", id: "soccer-2" },
      { label: "Liverpool v Paris St-G", id: "soccer-3" },
      { label: "Juventus v Getafe", id: "soccer-4" }
    ]
  },
  { 
    label: "Tennis", 
    href: "#", 
    isSport: true,
    icon: <TennisIcon />,
    children: [
      { label: "Al-Hilal v Al-Sadd", id: "tennis-1" }
    ]
  },
  { 
    label: "Cricket", 
    href: "#", 
    isSport: true,
    icon: <CricketIcon />,
    children: [
      { label: "Indian Premier League", id: "cricket-1" },
      { label: "Bangladesh v New Zealand", id: "cricket-2" },
      { label: "Hyderabad Kingsmen v Rawalpindi Pindiz", id: "cricket-3" }
    ]
  },
  { 
    label: "Horse Race", 
    href: "#", 
    isSport: true,
    icon: <HorseIcon />,
  },
  { 
    label: "Greyhound", 
    href: "#", 
    isSport: true,
    icon: <Trophy size={18} className="opacity-80" />,
  },
];

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const [openSports, setOpenSports] = useState({ Cricket: true, Soccer: true });

  const toggleSport = (label) => {
    setOpenSports(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside
      className={`fixed lg:static top-0 left-0 h-full w-[240px] bg-[#293c4e] text-[#b4cdd4] flex flex-col transition-transform duration-300 ease-in-out z-50 shadow-2xl lg:shadow-none
      ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-14 px-4 bg-[#213140] shrink-0 border-b border-[#1f2d3a]">
        <div className="text-white font-bold text-lg tracking-wide invisible lg:visible">Admin</div>

        <button
          className="lg:hidden text-gray-400 hover:text-white transition-colors focus:outline-none"
          onClick={() => setIsOpen(false)}
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
        <ul className="space-y-0.5">
          {navItems.map((item, idx) => {
            const hasChildren = item.children && item.children.length > 0;
            const isSportOpen = openSports[item.label];
            const isActive = pathname === item.href;

            return (
              <li key={idx} className="flex flex-col">
                {hasChildren ? (
                  <button
                    onClick={() => toggleSport(item.label)}
                    className={`flex items-center justify-between w-full px-5 py-3 text-sm font-medium transition-colors border-l-[3px] border-transparent hover:bg-[#34495e] hover:text-white`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="tracking-wide">{item.label}</span>
                    </div>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isSportOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors border-l-[3px] 
                      ${isActive
                        ? 'bg-[#1a2632] text-white border-[#1abc9c]'
                        : 'border-transparent hover:bg-[#34495e] hover:text-white'
                      }`}
                  >
                    {item.icon}
                    <span className="tracking-wide">{item.label}</span>
                  </Link>
                )}

                {/* Sub Menu */}
                {hasChildren && isSportOpen && (
                  <ul className="bg-[#1f2d3a] py-1">
                    {item.children.map((child, cIdx) => (
                      <li key={cIdx}>
                        <Link
                          href={`/admin/markets/${child.id}`}
                          className={`flex items-center px-5 py-2.5 text-[13px] hover:text-white hover:bg-[#34495e] transition-colors ${pathname.includes(child.id) ? 'text-white bg-[#1a2632]' : 'text-[#8ba7ae]'}`}
                        >
                          <span className="truncate">{child.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 bg-[#213140]">
        <button
          className="flex items-center justify-between w-full px-2 py-2 text-sm text-gray-400 hover:text-white"
          onClick={() => setIsOpen(false)} // mobile back behavior
        >
          <span>Collapse</span>
          <ChevronLeft size={16} />
        </button>
      </div>
    </aside>
  );
}
