"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import MasterOddsTable from "../../../../components/master/MasterOddsTable";
import MasterMarketSidebar from "../../../../components/master/MasterMarketSidebar";
import MasterBetLockerModal from "../../../../components/master/MasterBetLockerModal";
import { Lock } from "lucide-react";

// Mock match data generator
const getMatchData = (id) => {
  const matches = {
    'cricket-1': { name: 'Indian Premier League', sport: 'Cricket' },
    'cricket-2': { name: 'Bangladesh v New Zealand', sport: 'Cricket' },
    'cricket-3': { name: 'Hyderabad Kingsmen v Rawalpindi Pindiz', sport: 'Cricket' },
  };

  const matchInfo = matches[id] || { name: 'Unknown Match', sport: 'Cricket' };

  const runners = [
    { 
      name: matchInfo.name.split(' v ')[0] || 'Team A',
      back: [{ price: '1.57', size: '7.0M' }, { price: '1.58', size: '6.7M' }, { price: '1.59', size: '873.9K' }],
      lay: [{ price: '1.6', size: '925.7K' }, { price: '1.61', size: '8.0M' }, { price: '1.62', size: '1.4M' }]
    },
    { 
      name: matchInfo.name.split(' v ')[1] || 'Team B',
      back: [{ price: '6', size: '2.3M' }, { price: '6.2', size: '1.5M' }, { price: '6.4', size: '1.1M' }],
      lay: [{ price: '6.6', size: '155.7K' }, { price: '6.8', size: '1.4M' }, { price: '7', size: '1.7M' }]
    },
    { 
      name: 'The Draw',
      back: [{ price: '4.3', size: '3.1M' }, { price: '4.4', size: '2.5M' }, { price: '4.5', size: '1.0M' }],
      lay: [{ price: '4.6', size: '819.8K' }, { price: '4.7', size: '2.9M' }, { price: '4.8', size: '2.8M' }]
    }
  ];

  return { ...matchInfo, runners };
};

export default function MasterMarketPage() {
  const { id } = useParams();
  const [isLockerOpen, setIsLockerOpen] = useState(false);
  
  const match = useMemo(() => getMatchData(id), [id]);

  return (
    <div className="flex flex-col gap-2 max-w-[1400px] mx-auto">
      {/* Title Bar */}
      <div className="bg-white px-4 py-3 rounded-sm border border-gray-200 shadow-sm flex items-center justify-between mb-2">
        <h1 className="text-[18px] lg:text-[20px] font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
          {match.name} - Match Odds 
          <span className="text-[#f39c12] font-bold ml-1">TRADING</span>
          <div className="bg-[#f39c12] p-1 rounded-sm ml-1">
            <Lock size={14} className="text-white" />
          </div>
        </h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,360px] gap-4">
        {/* Left Column: Odds Table */}
        <div className="flex flex-col gap-4">
          <MasterOddsTable 
            title={match.name} 
            runners={match.runners} 
            lastUpdated="Live" 
            remainingTime="Calculated"
          />
        </div>

        {/* Right Column: Sidebar */}
        <div className="hidden lg:block">
          <MasterMarketSidebar onBetLockClick={() => setIsLockerOpen(true)} />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden mt-4">
        <MasterMarketSidebar onBetLockClick={() => setIsLockerOpen(true)} />
      </div>

      {/* Footer / Welcome Text */}
      <div className="mt-8 border-t border-gray-200 pt-4 pb-8 text-center sm:text-left">
        <p className="text-[12px] font-bold text-gray-800 uppercase tracking-widest">Broker Panel - Real Time Trading View</p>
      </div>

      {/* Modal */}
      <MasterBetLockerModal isOpen={isLockerOpen} onClose={() => setIsLockerOpen(false)} />
    </div>
  );
}
