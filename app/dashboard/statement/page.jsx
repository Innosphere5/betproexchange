"use client";

import { useState, useEffect } from "react";
import { Calendar, AlignJustify, Loader2 } from "lucide-react";
import { getApiUrl } from "../../../lib/apiConfig";

export default function StatementPage() {
  const [statementData, setStatementData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatement = async () => {
    setIsLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const response = await fetch(`${getApiUrl()}/api/user/statement`, {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStatementData(data);
      }
    } catch (err) {
      console.error("Failed to fetch statement:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  return (
    <div className="p-3 lg:p-4 space-y-4">
      {/* Report Filter Section */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-semibold text-gray-700 text-sm">
          <AlignJustify size={16} className="text-gray-500" />
          Report Filter
        </div>
        <div className="p-4 flex flex-col md:flex-row items-center gap-3 md:gap-4 text-[13px]">
          {/* Date Picker 1 */}
          <div className="flex w-full md:w-auto">
            <input
              type="text"
              defaultValue="04/11/2026 12:00 AM"
              readOnly
              className="border border-gray-300 rounded-l-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-[160px]"
            />
            <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600 hover:bg-gray-300">
              <Calendar size={15} />
            </button>
          </div>

          <span className="text-gray-500 font-bold">-</span>

          {/* Date Picker 2 */}
          <div className="flex w-full md:w-auto">
            <input
              type="text"
              defaultValue="04/11/2026 11:59 PM"
              readOnly
              className="border border-gray-300 rounded-l-sm px-3 py-1.5 focus:outline-none focus:border-gray-400 font-medium text-gray-700 w-full md:w-[160px]"
            />
            <button className="bg-gray-200 border border-l-0 border-gray-300 px-2.5 rounded-r-sm text-gray-600 hover:bg-gray-300">
              <Calendar size={15} />
            </button>
          </div>

          {/* Submit Button */}
          <button className="bg-[#00b050] hover:bg-[#009e48] transition-colors text-white font-bold px-5 py-1.5 rounded-sm shadow-sm w-full md:w-auto">
            Submit
          </button>
        </div>
      </div>

      {/* Account Ledger Box */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-3 py-2 flex items-center gap-2 font-semibold text-gray-700 text-sm">
          <AlignJustify size={16} className="text-gray-500" />
          Account Ledger
        </div>
        <div className="p-4">

          {/* Controls row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 text-[13px] text-gray-700">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <select className="border border-gray-300 rounded-sm px-2 py-1 focus:outline-none">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                  <option>100</option>
                </select>
                <span>entries per page</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-start md:justify-end">
              <span className="font-semibold">Search:</span>
              <input type="text" className="border border-gray-300 rounded-sm px-2 py-1 focus:outline-none border-gray-400 w-full md:w-auto" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-300 rounded-sm mb-3">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-300 font-bold text-gray-900 bg-white">
                  <th className="p-2 w-16 px-4 text-center border-r border-gray-200 text-gray-700">#</th>
                  <th className="p-2 border-r border-gray-200 text-right pr-4 text-gray-700">Date</th>
                  <th className="p-2 border-r border-gray-200 text-gray-700">Description</th>
                  <th className="p-2 border-r border-gray-200 text-right pr-4 text-gray-700">Amount</th>
                  <th className="p-2 text-right pr-4 text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={18} />
                        Loading statement data...
                      </div>
                    </td>
                  </tr>
                ) : statementData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500 italic">No transactions found for the selected period.</td>
                  </tr>
                ) : (
                  statementData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 border-b border-gray-200 last:border-0 font-medium text-gray-800">
                      <td className="p-2 border-r border-gray-200 text-center">{index + 1}</td>
                      <td className="p-2 border-r border-gray-200 text-right pr-4 text-gray-600">
                        {new Date(item.date).toLocaleString('en-IN', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                            hour12: true
                         })}
                      </td>
                      <td className={`p-2 border-r border-gray-200 ${item.amount > 0 ? 'text-[#00b050]' : 'text-[#dc3545]'}`}>
                        {item.description}
                      </td>
                      <td className={`p-2 border-r border-gray-200 text-right pr-4 font-bold ${item.amount > 0 ? 'text-[#00b050]' : 'text-[#dc3545]'}`}>
                        {item.amount.toLocaleString()}
                      </td>
                      <td className="p-2 text-right pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${item.status === 'WIN' || item.status === 'SETTLED' ? 'bg-green-100 text-green-700' :
                            item.status === 'LOSE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-[13px] text-gray-600">
            <div>Showing 1 to {statementData.length} of {statementData.length} entries</div>
            <div className="flex rounded-sm overflow-hidden border border-gray-300 select-none">
              <button disabled className="px-3 py-1.5 border-r border-gray-300 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-50 font-bold">1</button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

