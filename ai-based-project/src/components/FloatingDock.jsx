import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/dashboard',      icon: 'home',          label: 'Overview' },
  { to: '/reports',        icon: 'analytics',      label: 'Analytics' },
  { to: '/question',       icon: 'database',       label: 'Bank' },
  { to: '/interviewsetup', icon: 'video_chat',     label: 'Interviews' },
  { to: '/profile',        icon: 'person',         label: 'Profile' },
];

const FloatingDock = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [dockPosition, setDockPosition] = useState('left'); // 'bottom' or 'left'
  const location = useLocation();

  useEffect(() => {
    let timeoutId;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsScrolling(false), 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Hide dock on interview and focused study pages to prevent overlap
  const isHiddenRoute = 
    ['/chat-interview', '/video-interview', '/voice-interview', '/interviewsetup'].includes(location.pathname) ||
    location.pathname.startsWith('/questions/');

  if (isHiddenRoute) return null;

  const isLeft = dockPosition === 'left';

  return (
    <div className={`fixed z-50 group transition-all duration-700 ${
      isLeft 
        ? 'left-8 top-1/2 -translate-y-1/2' 
        : 'bottom-8 left-1/2 -translate-x-1/2'
    }`}>
      <motion.nav 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`border border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(139,92,246,0.2)] transition-all duration-500 flex items-center gap-4 ${
          isLeft 
            ? 'flex-col rounded-[2rem] py-6 px-3' 
            : 'flex-row rounded-full px-6 py-3'
        } ${isScrolling ? 'opacity-0 pointer-events-none' : 'opacity-25 group-hover:opacity-100'}`}
        style={{ background: 'rgba(20, 15, 40, 0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        {/* Position Toggle Button */}
        <button
          onClick={() => setDockPosition(isLeft ? 'bottom' : 'left')}
          className="p-3 rounded-2xl text-neutral-500 hover:text-violet-400 transition-colors duration-300 group/toggle"
          title={`Move to ${isLeft ? 'bottom' : 'left'}`}
        >
          <span className="material-symbols-outlined text-[20px] rotate-90 group-hover:rotate-0 transition-transform duration-500">
            {isLeft ? 'sync_alt' : 'vertical_align_bottom'}
          </span>
        </button>

        <div className={`w-px h-6 bg-white/10 ${isLeft ? 'w-6 h-px my-1' : 'mx-1'}`} />

        {NAV_ITEMS.map((item, idx) => (
          <NavLink
            key={item.to}
            to={item.to}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={({ isActive }) => 
              `relative p-3 rounded-2xl transition-all duration-300 group ${
                isActive ? 'text-violet-400' : 'text-neutral-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active Glow Background */}
                {isActive && (
                  <motion.div
                    layoutId="dock-active"
                    className="absolute inset-0 bg-violet-500/15 rounded-2xl blur-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                <span 
                  className={`material-symbols-outlined text-[24px] relative z-10 transition-transform duration-300 ${
                    hoveredIndex === idx ? 'scale-110' : ''
                  }`}
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
                >
                  {item.icon}
                </span>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredIndex === idx && (
                    <motion.div
                      initial={isLeft ? { opacity: 0, x: -10 } : { opacity: 0, y: 10 }}
                      animate={isLeft ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }}
                      exit={isLeft ? { opacity: 0, x: -10 } : { opacity: 0, y: 10 }}
                      className={`absolute px-3 py-1.5 bg-neutral-900 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-50 ${
                        isLeft 
                          ? 'left-full ml-6 top-1/2 -translate-y-1/2' 
                          : 'bottom-full mb-6 left-1/2 -translate-x-1/2'
                      }`}
                    >
                      {item.label}
                      <div className={`absolute border-8 border-transparent ${
                        isLeft 
                          ? 'right-full top-1/2 -translate-y-1/2 border-r-neutral-900' 
                          : 'top-full left-1/2 -translate-x-1/2 border-t-neutral-900'
                      }`} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active Indicator Dot/Pill */}
                {isActive && (
                  <motion.div 
                    layoutId="dock-dot"
                    className={`absolute bg-violet-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.8)] ${
                      isLeft 
                        ? 'top-1/2 -right-1.5 -translate-y-1/2 w-1 h-3' 
                        : '-bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-1'
                    }`}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </motion.nav>
    </div>
  );
};

export default FloatingDock;
