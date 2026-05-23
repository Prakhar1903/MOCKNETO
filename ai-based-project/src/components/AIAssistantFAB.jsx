import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const AIAssistantFAB = () => {
  const location = useLocation();
  
  // Hide FAB on interview and focused study pages to prevent overlap
  const isHiddenRoute = 
    ['/chat-interview', '/video-interview', '/voice-interview', '/interviewsetup'].includes(location.pathname) ||
    location.pathname.startsWith('/questions/');
  
  if (isHiddenRoute) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center z-50 overflow-hidden group"
      onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-chat'))}
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      <span className="material-symbols-outlined relative z-10" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
        smart_toy
      </span>
      
      {/* Subtle pulse ring */}
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full border-2 border-violet-400/50 pointer-events-none"
      />
    </motion.button>
  );
};

export default AIAssistantFAB;
