import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Overview', icon: 'home', path: '/dashboard' },
  { id: 'analytics', label: 'View Analytics', icon: 'analytics', path: '/reports' },
  { id: 'questions', label: 'Question Bank', icon: 'database', path: '/question' },
  { id: 'interview', label: 'Start Interview', icon: 'video_chat', path: '/interviewsetup' },
  { id: 'profile',   label: 'View Profile',   icon: 'person', path: '/profile' },
  { id: 'settings',  label: 'Settings',       icon: 'settings', path: '/settings' },
];

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeydown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      if (filteredCommands[activeIndex]) {
        handleSelect(filteredCommands[activeIndex].path);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl glass rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center px-6 py-4 border-b border-white/5">
              <span className="material-symbols-outlined text-neutral-400 mr-4">search</span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands (e.g. 'Analytics')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-neutral-500 text-lg"
              />
              <div className="px-2 py-1 bg-white/5 rounded border border-white/10 text-[10px] text-neutral-400 font-mono">
                ESC
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto py-2">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => (
                  <div
                    key={cmd.id}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelect(cmd.path)}
                    className={`flex items-center px-6 py-3.5 cursor-pointer transition-colors ${
                      activeIndex === idx ? 'bg-violet-600/20 text-violet-300' : 'text-neutral-400'
                    }`}
                  >
                    <span className="material-symbols-outlined mr-4 opacity-70">{cmd.icon}</span>
                    <span className="flex-1 font-medium">{cmd.label}</span>
                    {activeIndex === idx && (
                      <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400">Jump to</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-neutral-500">
                  <p>No commands found for "{query}"</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-black/20 border-t border-white/5 flex gap-4 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-white/5 rounded">↑↓</span> to navigate
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-white/5 rounded">↵</span> to select
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
