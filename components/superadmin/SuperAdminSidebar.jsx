"use client";

import { X, LayoutDashboard, Users, Filter, FileText, Lock, Star, Globe, Gamepad2, ChevronLeft, ChevronDown, Trophy, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/superadmin/dashboard", icon: <LayoutDashboard size={18} className="opacity-80" /> },
  { label: "Users", href: "/superadmin/users", icon: <Users size={18} className="opacity-80" /> },
  { label: "Current Position", href: "#", icon: <Filter size={18} className="opacity-80" /> },
  { label: "Reports", href: "/superadmin/reports", icon: <FileText size={18} className="opacity-80" /> },
  { label: "Bet Lock", href: "/superadmin/betlock", icon: <Lock size={18} className="opacity-80" /> }
];

export default function SuperAdminSidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const [openSports, setOpenSports] = useState({});

  const toggleSport = (label) => {
    setOpenSports(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 h-screen w-[240px] bg-[#293c4e] text-[#b4cdd4] flex flex-col transition-transform duration-300 ease-in-out z-50 shadow-2xl lg:shadow-none
      ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="flex items-center justify-between h-14 px-4 bg-[#213140] shrink-0 border-b border-[#1f2d3a]">
        <div className="text-white font-bold text-lg tracking-wide invisible lg:visible italic uppercase">SUPER ADMIN</div>

        <button
          className="lg:hidden text-gray-400 hover:text-white transition-colors focus:outline-none"
          onClick={() => setIsOpen(false)}
        >
          <X size={24} />
        </button>
      </div>

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
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 bg-[#213140] space-y-2">
        <button
          className="flex items-center justify-between w-full px-2 py-2 text-sm text-gray-400 hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <span>Collapse</span>
          <ChevronLeft size={16} />
        </button>
        
        <button
          className="lg:hidden flex items-center gap-2 w-full px-2 py-2 text-sm text-red-400 hover:text-red-300 font-bold border-t border-gray-700 pt-3"
          onClick={() => {
            localStorage.removeItem("user_session");
            document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
            window.location.href = "/login";
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
