"use client";

import { useState } from "react";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    stake1: 2000,
    stake2: 5000,
    stake3: 10000,
    stake4: 25000,
    plus1: 1000,
    plus2: 5000,
    plus3: 10000,
    plus4: 25000,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-3 lg:p-4 space-y-4">
      {/* Profile Settings Box */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-4 py-3 font-semibold text-gray-800 text-[15px]">
          Profile
        </div>
        <div className="p-4 lg:p-6 text-[14px]">
          
          <div className="space-y-4 max-w-4xl">
             {/* Dynamic mapping of inputs to keep code clean */}
             {[
               { id: 'stake1', label: 'Stake1' },
               { id: 'stake2', label: 'Stake2' },
               { id: 'stake3', label: 'Stake3' },
               { id: 'stake4', label: 'Stake4' },
               { id: 'plus1', label: 'Plus1' },
               { id: 'plus2', label: 'Plus2' },
               { id: 'plus3', label: 'Plus3' },
               { id: 'plus4', label: 'Plus4' },
             ].map((field) => (
                <div key={field.id} className="flex items-center gap-4 border-b border-gray-100 pb-2">
                  <div className="w-24 lg:w-32 font-medium text-gray-700">{field.label}</div>
                  <div className="flex-1 max-w-md">
                    <input 
                      type="number" 
                      name={field.id}
                      value={formData[field.id]} 
                      onChange={handleChange}
                      className="border border-gray-300 rounded-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full"
                    />
                  </div>
                </div>
             ))}
          </div>

          <div className="mt-6 flex items-center gap-2">
             <button className="bg-[#00b050] hover:bg-[#009e48] transition-colors text-white font-bold px-4 py-2 rounded-sm shadow-sm text-[13px]">
               Save changes
             </button>
             <button className="bg-[#dc3545] hover:bg-[#c82333] transition-colors text-white font-bold px-4 py-2 rounded-sm shadow-sm text-[13px]">
               Cancel
             </button>
          </div>
          
        </div>
      </div>

      {/* Change Password Box */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] px-4 py-3 font-semibold text-gray-800 text-[15px]">
          Change Password
        </div>
      </div>
      
    </div>
  );
}
