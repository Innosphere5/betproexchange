'use client';

import { useState } from 'react';
import { User, Lock, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { getApiUrl } from "../lib/apiConfig";

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if (response.ok) {
          const sessionData = {
            token: data.token,
            username: data.user.username,
            role: data.user.role,
            loggedInAt: new Date().toISOString()
          };

          // Save to localStorage for client-side access
          localStorage.setItem('user_session', JSON.stringify(sessionData));

          // Save to cookie so Next.js middleware can read it server-side
          // Expires in 7 days, SameSite=Lax for safety
          const expires = new Date();
          expires.setDate(expires.getDate() + 7);
          document.cookie = `user_session=${encodeURIComponent(JSON.stringify(sessionData))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

          // Redirect based on role
          if (data.user.role === 'admin') {
            window.location.href = '/admin/users';
          } else if (data.user.role === 'master') {
            window.location.href = '/master/users';
          } else {
            window.location.href = '/dashboard';
          }
        } else {
          setError(data.error || 'Invalid username or password.');
        }
      } else {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        setError(`Server error: Received unexpected response format.`);
      }
    } catch (err) {
      console.error("Fetch/Parsing error:", err);
      setError('Connection refused or server failed to respond. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 md:w-52 h-34 md:h-32">
            <Image
              src="/betlogo.png"
              alt="Betproexchange Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-slate-700/60 backdrop-blur rounded-2xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className="relative">
              <div className="flex items-center bg-slate-600/50 rounded-lg px-3 md:px-4 py-2.5 md:py-3 border border-slate-500/30 focus-within:border-slate-400/50 focus-within:bg-slate-600/70 transition-all">
                <User size={18} className="text-slate-300 mr-2 md:mr-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent flex-1 text-white placeholder-slate-400 outline-none text-sm md:text-base"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="flex items-center bg-slate-600/50 rounded-lg px-3 md:px-4 py-2.5 md:py-3 border border-slate-500/30 focus-within:border-slate-400/50 focus-within:bg-slate-600/70 transition-all">
                <Lock size={18} className="text-slate-300 mr-2 md:mr-3 flex-shrink-0" />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent flex-1 text-white placeholder-slate-400 outline-none text-sm md:text-base"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 md:mt-8 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-slate-900 font-semibold py-2.5 md:py-3 px-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
