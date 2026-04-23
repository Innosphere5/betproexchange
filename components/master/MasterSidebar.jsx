"use client";

import { X, LayoutDashboard, Users, Filter, FileText, Lock, Star, Globe, Gamepad2, ChevronLeft, ChevronDown, Trophy, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/master/dashboard", icon: <LayoutDashboard size={18} className="opacity-80" /> },
  { label: "Users (Bettors)", href: "/master/users", icon: <Users size={18} className="opacity-80" /> },
  { label: "Reports", href: "/master/reports", icon: <FileText size={18} className="opacity-80" /> }
];

export default function MasterSidebar({ isOpen, setIsOpen }) {
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
      className={`fixed lg:static top-0 left-0 h-screen lg:h-full w-[240px] bg-[#2c3e50] text-[#b4cdd4] flex flex-col transition-transform duration-300 ease-in-out z-50 shadow-2xl lg:shadow-none
      ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-14 px-4 bg-[#1a252f] shrink-0 border-b border-[#1f2d3a]">
        <div className="text-white font-bold text-lg tracking-wide invisible lg:visible uppercase">MASTER PANEL</div>

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
                         ? 'bg-[#1a252f] text-white border-[#f39c12]'
                         : 'border-transparent hover:bg-[#34495e] hover:text-white'
                       }`}
                  >
                    {item.icon}
                    <span className="tracking-wide">{item.label}</span>
                  </Link>
                )}

                {/* Sub Menu */}
                {hasChildren && isSportOpen && (
                  <ul className="bg-[#1a252f] py-1">
                    {item.children.map((child, cIdx) => (
                      <li key={cIdx}>
                        <Link
                          href={`/master/markets/${child.id}`}
                          className={`flex items-center px-5 py-2.5 text-[13px] hover:text-white hover:bg-[#34495e] transition-colors ${pathname.includes(child.id) ? 'text-white bg-[#141b24]' : 'text-[#8ba7ae]'}`}
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

       <div className="p-4 bg-[#1a252f] space-y-2">
         <button
           className="flex items-center justify-between w-full px-2 py-2 text-sm text-gray-400 hover:text-white"
           onClick={() => setIsOpen(false)} // mobile back behavior
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
