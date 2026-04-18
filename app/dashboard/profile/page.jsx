"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    stake1: 2000, stake2: 5000, stake3: 10000, stake4: 25000,
    plus1: 1000, plus2: 5000, plus3: 10000, plus4: 25000,
  });

  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      return `http://${window.location.hostname}:5000`;
    }
    return "http://localhost:5000";
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('user_session') || '{}');
        const res = await fetch(`${getApiUrl()}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) setFormData(data.settings);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: Number(e.target.value) });
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const res = await fetch(`${getApiUrl()}/api/auth/settings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({ settings: formData })
      });
      if (res.ok) setStatus({ type: "success", message: "Settings saved successfully!" });
      else setStatus({ type: "error", message: "Failed to save settings." });
    } catch (err) {
      setStatus({ type: "error", message: "Error connecting to server." });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        return setStatus({ type: "error", message: "New passwords do not match." });
    }

    setIsLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      const res = await fetch(`${getApiUrl()}/api/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
          setStatus({ type: "success", message: "Password updated successfully!" });
          setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
          setStatus({ type: "error", message: data.error || "Failed to update password." });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Error connecting to server." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 lg:p-4 space-y-4">
      {status.message && (
        <div className={`p-4 rounded-sm flex items-center gap-3 text-sm animate-in fade-in duration-300 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {status.message}
        </div>
      )}

      {/* Profile Settings Box */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-4 py-3 font-semibold text-gray-800 text-[15px]">
          Profile Settings
        </div>
        <div className="p-4 lg:p-6 text-[14px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 max-w-5xl">
             {[
               { id: 'stake1', label: 'Stake 1' }, { id: 'stake2', label: 'Stake 2' },
               { id: 'stake3', label: 'Stake 3' }, { id: 'stake4', label: 'Stake 4' },
               { id: 'plus1', label: 'Plus 1' }, { id: 'plus2', label: 'Plus 2' },
               { id: 'plus3', label: 'Plus 3' }, { id: 'plus4', label: 'Plus 4' },
             ].map((field) => (
                <div key={field.id} className="flex items-center gap-4 border-b border-gray-100 pb-2">
                  <div className="w-24 lg:w-32 font-medium text-gray-700">{field.label}</div>
                  <div className="flex-1">
                    <input 
                      type="number" 
                      name={field.id}
                      value={formData[field.id]} 
                      onChange={handleChange}
                      className="border border-gray-300 rounded-sm px-3 py-1.5 focus:outline-none focus:border-[#00b050] font-medium text-gray-700 w-full"
                    />
                  </div>
                </div>
             ))}
          </div>

          <div className="mt-8 flex items-center gap-3">
             <button 
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="bg-[#00b050] hover:bg-[#009e48] transition-colors text-white font-bold px-6 py-2 rounded-sm shadow-sm text-[13px] flex items-center gap-2 disabled:opacity-50"
             >
               {isLoading && <Loader2 size={14} className="animate-spin" />}
               Save Settings
             </button>
          </div>
        </div>
      </div>

      {/* Change Password Box */}
      <div className="bg-white border border-gray-300 rounded-sm overflow-hidden shadow-sm">
        <div className="bg-[#f8fafc] border-b border-gray-300 px-4 py-3 font-semibold text-gray-800 text-[15px]">
          Change Password
        </div>
        <div className="p-4 lg:p-6 max-w-xl">
           <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Old Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:border-[#00b050]" 
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1 font-medium">New Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:border-[#00b050]" 
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:border-[#00b050]" 
                />
              </div>
              <button 
                type="submit"
                disabled={isLoading}
                className="bg-[#2a4054] hover:bg-[#1a2a38] transition-colors text-white font-bold px-6 py-2 rounded-sm shadow-sm text-[13px] flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                Update Password
              </button>
           </form>
        </div>
      </div>
    </div>
  );
}
