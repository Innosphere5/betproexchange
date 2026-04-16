"use client";

import { useState } from "react";
import { X } from "lucide-react";

const mockUsers = [
  { id: 1, name: "Asad670@" },
  { id: 2, name: "Gagan223" },
  { id: 3, name: "Testt1" },
  { id: 4, name: "Malik50" },
  { id: 5, name: "User99" },
];

export default function BetLockerModal({ isOpen, onClose }) {
  const [target, setTarget] = useState('selected');
  const [selectedUsers, setSelectedUsers] = useState([1, 2, 3]);

  if (!isOpen) return null;

  const toggleUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-[500px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-[15px] font-bold text-gray-800">Match Odds - Bet Locker</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-6 mb-5">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                name="bet-lock-target" 
                checked={target === 'all'} 
                onChange={() => setTarget('all')}
                className="w-4 h-4 text-[#1abc9c] focus:ring-[#1abc9c]"
              />
              <span className="text-[13px] text-gray-700 group-hover:text-gray-900 transition-colors">All Users</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                name="bet-lock-target" 
                checked={target === 'selected'} 
                onChange={() => setTarget('selected')}
                className="w-4 h-4 text-[#1abc9c] focus:ring-[#1abc9c]"
              />
              <span className="text-[13px] text-gray-700 group-hover:text-gray-900 transition-colors">Selected Users</span>
            </label>

            <div className="flex-1 flex justify-end gap-2">
              <button 
                onClick={onClose}
                className="bg-[#1abc9c] hover:bg-[#16a085] text-white px-4 py-1.5 rounded-sm text-[13px] font-bold transition-colors"
              >
                Save
              </button>
              <button 
                onClick={onClose}
                className="bg-[#f87171] hover:bg-[#ef4444] text-white px-4 py-1.5 rounded-sm text-[13px] font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* User List */}
          {target === 'selected' && (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
              {mockUsers.map(user => (
                <label key={user.id} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.includes(user.id)} 
                    onChange={() => toggleUser(user.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1abc9c] focus:ring-[#1abc9c]"
                  />
                  <span className="text-[13px] text-gray-600 group-hover:text-gray-900 transition-colors">{user.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
