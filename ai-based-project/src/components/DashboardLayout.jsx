import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TopAppBar from './TopAppBar.jsx';
import FloatingDock from './FloatingDock.jsx';
import CommandPalette from './CommandPalette.jsx';

/**
 * Modern Dashboard Layout with Floating Dock and Command Palette.
 */
const DashboardLayout = () => {
  const location = useLocation();

  const isWorkspaceRoute = ['/chat-interview', '/video-interview', '/voice-interview'].includes(location.pathname);

  return (
    <div className={isWorkspaceRoute ? "h-screen overflow-hidden flex flex-col bg-[#060606] text-white selection:bg-violet-500/30" : "min-h-screen bg-[#060606] text-white selection:bg-violet-500/30"} style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Top bar */}
      <TopAppBar />

      {/* Navigation Layer */}
      <FloatingDock />
      <CommandPalette />

      {/* Page content */}
      <main className={isWorkspaceRoute ? "pt-0 pb-0 flex-1 overflow-hidden flex flex-col relative z-10" : "pt-16 pb-32 min-h-screen relative z-10"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={isWorkspaceRoute ? "h-full flex flex-col min-h-0" : ""}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default DashboardLayout;
