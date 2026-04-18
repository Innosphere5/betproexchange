"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import OddsTable from "../../../../components/admin/OddsTable";
import MarketSidebar from "../../../../components/admin/MarketSidebar";
import BetLockerModal from "../../../../components/admin/BetLockerModal";
import { Lock } from "lucide-react";

// Mock match data generator
const getMatchData = (id) => {
  const matches = {
    'soccer-1': { name: 'Man Utd v Leeds', sport: 'Football' },
    'soccer-2': { name: 'Atletico Madrid v Barcelona', sport: 'Football' },
    'soccer-3': { name: 'Liverpool v Paris St-G', sport: 'Football' },
    'tennis-1': { name: 'Al-Hilal v Al-Sadd', sport: 'Tennis' },
    'cricket-1': { name: 'Indian Premier League', sport: 'Cricket' },
    'cricket-3': { name: 'Hyderabad Kingsmen v Rawalpindi Pindiz', sport: 'Cricket' },
  };

  const matchInfo = matches[id] || { name: 'Unknown Match', sport: 'General' };

  const runners = [
    { 
      name: matchInfo.sport === 'Football' ? 'Man Utd' : matchInfo.name.split(' v ')[0] || 'Team A',
      back: [{ price: '1.57', size: '7.0M' }, { price: '1.58', size: '6.7M' }, { price: '1.59', size: '873.9K' }],
      lay: [{ price: '1.6', size: '925.7K' }, { price: '1.61', size: '8.0M' }, { price: '1.62', size: '1.4M' }]
    },
    { 
      name: matchInfo.sport === 'Football' ? 'Leeds' : matchInfo.name.split(' v ')[1] || 'Team B',
      back: [{ price: '6', size: '2.3M' }, { price: '6.2', size: '1.5M' }, { price: '6.4', size: '1.1M' }],
      lay: [{ price: '6.6', size: '155.7K' }, { price: '6.8', size: '1.4M' }, { price: '7', size: '1.7M' }]
    },
    { 
      name: 'The Draw',
      back: [{ price: '4.3', size: '3.1M' }, { price: '4.4', size: '2.5M' }, { price: '4.5', size: '1.0M' }],
      lay: [{ price: '4.6', size: '819.8K' }, { price: '4.7', size: '2.9M' }, { price: '4.8', size: '2.8M' }]
    }
  ];

  // Adjust for different sports if needed
  if (matchInfo.id === 'cricket-1') {
      // IPL might have many runners
      return {
          ...matchInfo,
          runners: [
              { name: 'Rajasthan Royals', back: [{price: '4.3', size:'101.2K'}, {price:'4.4', size:'170.3K'}, {price:'4.5', size:'16.8K'}], lay: [{price:'4.6', size:'722.2K'}, {price:'4.7', size:'1.9K'}, {price:'4.8', size:'286.6K'}] },
              { name: 'Mumbai Indians', back: [{price: '6', size:'105.0K'}, {price:'6.2', size:'817.0K'}, {price:'6.4', size:'876.2K'}], lay: [{price:'6.6', size:'1.5M'}, {price:'6.8', size:'330.5K'}, {price:'7', size:'438.7K'}] },
              { name: 'Punjab Kings', back: [{price: '5.6', size:'71.2K'}, {price:'5.7', size:'169.2K'}, {price:'5.8', size:'40.7K'}], lay: [{price:'5.9', size:'473.5K'}, {price:'6', size:'81.3K'}, {price:'6.2', size:'29.5K'}] },
          ]
      };
  }

  return { ...matchInfo, runners };
};

export default function MarketPage() {
  const { id } = useParams();
  const [isLockerOpen, setIsLockerOpen] = useState(false);
  
  const match = useMemo(() => getMatchData(id), [id]);

  return (
    <div className="flex flex-col gap-2 max-w-[1400px] mx-auto">
      {/* Title Bar */}
      <div className="bg-white px-4 py-3 rounded-sm border border-gray-200 shadow-sm flex items-center justify-between mb-2">
        <h1 className="text-[18px] lg:text-[20px] font-bold text-gray-800 flex items-center gap-2">
          {match.name} - Match Odds 
          <span className="text-[#e91e63] font-bold ml-1 uppercase">Open</span>
          <div className="bg-[#293c4e] p-1 rounded-sm ml-1">
            <Lock size={14} className="text-white" />
          </div>
        </h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,360px] gap-4">
        {/* Left Column: Odds Table */}
        <div className="flex flex-col gap-4">
          <OddsTable 
            title={match.name} 
            runners={match.runners} 
            lastUpdated="14 Apr 0:30" 
            remainingTime="06:35:12"
          />
        </div>

        {/* Right Column: Sidebar */}
        <div className="hidden lg:block">
          <MarketSidebar onBetLockClick={() => setIsLockerOpen(true)} />
        </div>
      </div>

      {/* Mobile Sidebar (Fixed at bottom or similar? For now just append) */}
      <div className="lg:hidden mt-4">
        <MarketSidebar onBetLockClick={() => setIsLockerOpen(true)} />
      </div>

      {/* Footer / Welcome Text */}
      <div className="mt-8 border-t border-gray-200 pt-4 pb-8">
        <p className="text-[12px] font-bold text-gray-800">Welcome to Exchange.</p>
      </div>

      {/* Modal */}
      <BetLockerModal isOpen={isLockerOpen} onClose={() => setIsLockerOpen(false)} />
    </div>
  );
}
