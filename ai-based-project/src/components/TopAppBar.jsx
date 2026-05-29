import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Profile from './Profile.jsx';

const TopAppBar = () => {
  const location = useLocation();
  const isInterviewMode = ['/chat-interview', '/video-interview', '/voice-interview'].includes(location.pathname);

  if (isInterviewMode) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-black/40 backdrop-blur-xl border-b border-white/5">
      {/* Left: Logo */}
      <NavLink to="/dashboard" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
          <span className="text-sm font-black italic">M</span>
        </div>
        <span className="text-xl font-bold tracking-tight text-white/90" style={{ fontFamily: 'Inter, sans-serif' }}>
          Mockneto
        </span>
      </NavLink>

      {/* Center: Command Palette Hint (Desktop only) */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-500 cursor-pointer hover:bg-white/10 transition-colors group"
           onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>
        <span className="material-symbols-outlined text-[18px]">search</span>
        <span className="text-[11px] font-bold uppercase tracking-widest">Search...</span>
        <div className="flex items-center gap-1 ml-4">
          <span className="px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-[9px]">CTRL</span>
          <span className="px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-[9px]">K</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>notifications</span>
        </motion.button>
        
        {/* Profile Dropdown with Logout */}
        <Profile />
      </div>
    </header>
  );
};

export default TopAppBar;
