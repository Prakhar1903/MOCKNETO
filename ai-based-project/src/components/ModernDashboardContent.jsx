import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MOCK_USER, 
  MOCK_RECOMMENDATION, 
  MOCK_SKILLS, 
  MOCK_TIMELINE 
} from '../data/mockData';

// --- Shared Components & Animations ---

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1], delay },
});

const BentoTile = ({ children, className = '', ...props }) => (
  <motion.div
    {...fadeUp(props.delay || 0)}
    whileHover={{ y: -4 }}
    className={`relative overflow-hidden rounded-[2rem] bg-neutral-900/50 backdrop-blur-xl border border-white/5 hover:border-violet-500/30 hover:shadow-[0_16px_40px_rgba(139,92,246,0.12)] transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

// --- Sub-components (Tiles) ---

const ActionHeader = () => {
  const navigate = useNavigate();
  return (
    <BentoTile className="col-span-12 md:col-span-8 p-8 flex flex-col justify-center" delay={0.1}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
      <h2 className="text-sm font-black uppercase tracking-[0.25em] text-violet-400 mb-2">Workspace</h2>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
        Ready, <span className="text-white/40">{MOCK_USER.name}?</span>
      </h1>
      <p className="text-gray-400 text-lg mb-6 max-w-md">Your System Design session is in 2 hours. Everything is prepared.</p>
      <button 
        onClick={() => navigate('/interviewsetup')}
        className="w-fit px-8 py-3.5 rounded-2xl bg-white text-black font-bold tracking-tight hover:bg-violet-100 active:scale-95 transition-all"
      >
        Resume Last Session
      </button>
    </BentoTile>
  );
};

const ReadinessGauge = () => {
  const navigate = useNavigate();
  return (
    <BentoTile className="col-span-12 md:col-span-4 p-8 flex flex-col items-center justify-center text-center" delay={0.15}>
      <div className="flex flex-col items-center">
        {/* Delta Pill */}
        <div className="mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs text-emerald-400 font-black">north_east</span>
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">+6% this week</span>
        </div>

        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle className="text-white/5 stroke-current" strokeWidth="8" fill="transparent" r="42" cx="50" cy="50" />
            <motion.circle 
              className="text-violet-500 stroke-current" 
              strokeWidth="8" 
              strokeDasharray="264" 
              initial={{ strokeDashoffset: 264 }}
              animate={{ strokeDashoffset: 264 - (264 * 84) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              strokeLinecap="round" 
              fill="transparent" 
              r="42" 
              cx="50" 
              cy="50" 
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-3xl font-black text-white">84%</span>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 tracking-[0.2em]">Overall Readiness</span>
        
        <button 
          onClick={() => navigate('/reports')}
          className="text-[10px] font-bold text-violet-400 hover:text-white transition-colors flex items-center gap-1 group"
        >
          Improve Score
          <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
        </button>
      </div>
    </BentoTile>
  );
};

const MicroFeedbackStrip = () => (
  <motion.div 
    {...fadeUp(0.18)}
    className="col-span-12 flex flex-wrap items-center gap-3 py-2"
  >
    {[
      { label: "+6% this week", icon: 'trending_up', color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
      { label: "5-day streak", icon: 'local_fire_department', color: 'text-orange-400', bg: 'bg-orange-500/5', border: 'border-orange-500/10' },
      { label: "3 sessions", icon: 'task_alt', color: 'text-violet-400', bg: 'bg-violet-500/5', border: 'border-violet-500/10' },
      { label: "Best: 92%", icon: 'grade', color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
    ].map((stat, i) => (
      <div 
        key={i} 
        className={`flex items-center gap-2 px-4 py-2 rounded-full ${stat.bg} ${stat.border} border text-[11px] font-bold uppercase tracking-widest ${stat.color} backdrop-blur-sm`}
      >
        <span className="material-symbols-outlined text-sm">{stat.icon}</span>
        {stat.label}
      </div>
    ))}
  </motion.div>
);

const SmartRecommendation = () => {
  const navigate = useNavigate();
  return (
    <BentoTile 
      className="col-span-12 p-10 border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.1)] group relative" 
      delay={0.2}
    >
      {/* Border Pulse */}
      <div className="absolute inset-0 rounded-[2rem] border border-violet-500/40 animate-[pulse_3s_infinite] pointer-events-none" />
      
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-black uppercase tracking-widest text-violet-400">Recommended for You</span>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>

        {/* Structured Block */}
        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-x-8 gap-y-4 mb-10">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 py-1">Weak Area</span>
          <span className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-sm font-bold text-red-400 w-fit">Binary Trees</span>
          
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 py-1">Action</span>
          <span className="px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-sm font-bold text-violet-400 w-fit">15-min DSA Interview</span>
          
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 py-1">Goal</span>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 max-w-2xl shadow-[0_4px_20px_rgba(16,185,129,0.05)]">
            <span className="text-sm md:text-base font-bold text-emerald-400 leading-relaxed block leading-tight">
              Improve traversal logic and recursive complexity analysis.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-10">
          {[
            { label: MOCK_RECOMMENDATION.time, icon: 'timer' },
            { label: MOCK_RECOMMENDATION.difficulty, icon: 'signal_cellular_alt' },
            { label: MOCK_RECOMMENDATION.type, icon: 'terminal' },
          ].map((chip) => (
            <div key={chip.label} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-sm font-medium text-gray-300">
              <span className="material-symbols-outlined text-lg text-violet-400">{chip.icon}</span>
              {chip.label}
            </div>
          ))}
        </div>

        <button 
          onClick={() => navigate('/chat-interview')}
          className="group/btn w-full py-5 rounded-2xl bg-violet-600 text-white font-bold tracking-tight hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] active:scale-95 transition-all overflow-hidden relative"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            Start Personalized Session
            <span className="material-symbols-outlined text-lg group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
        </button>
      </div>
    </BentoTile>
  );
};

const PracticeLab = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Chat');
  
  const modes = [
    { name: 'Chat', icon: 'chat_bubble', path: '/chat-interview', desc: 'AI-driven text interviews with real-time feedback and behavioral analysis.' },
    { name: 'Video', icon: 'videocam', path: '/video-interview', desc: 'Practice facial expressions and body language with our AI video proctor.' },
    { name: 'Voice', icon: 'keyboard_voice', path: '/voice-interview', desc: 'Natural conversation practice with AI speech recognition and tone analysis.' }
  ];

  const current = modes.find(m => m.name === activeTab);

  return (
    <BentoTile className="col-span-12 md:col-span-6 p-8 flex flex-col bg-neutral-800/60 border-white/10" delay={0.25}>
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Practice Lab</h3>
      
      <div className="flex p-1.5 rounded-2xl bg-black/20 border border-white/5 mb-8 w-fit">
        {modes.map((mode) => (
          <button
            key={mode.name}
            onClick={() => setActiveTab(mode.name)}
            className={`relative px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === mode.name ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {activeTab === mode.name && (
              <motion.div layoutId="lab-bg" className="absolute inset-0 bg-white/10 rounded-xl" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">{mode.icon}</span>
              {mode.name}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-gray-400 text-base leading-relaxed mb-4 h-12">
              {current.desc}
            </p>
            
            <button 
              onClick={() => setActiveTab('Chat')}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400/60 hover:text-violet-400 transition-colors mb-8 inline-block"
            >
              → Jump to recommended mode
            </button>

            <button 
              onClick={() => navigate(current.path)}
              className="w-full py-4 rounded-2xl bg-violet-600 text-white font-bold tracking-tight hover:bg-violet-500 shadow-xl shadow-violet-500/10 transition-all active:scale-[0.98]"
            >
              Initialize {activeTab}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </BentoTile>
  );
};

const SkillInsights = () => (
  <BentoTile className="col-span-12 md:col-span-6 p-8 flex flex-col" delay={0.3}>
    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-8">Skill Insights</h3>
    <div className="space-y-6 flex-1 flex flex-col justify-center">
      {MOCK_SKILLS.map((skill) => (
        <div key={skill.label} className={`relative p-3 rounded-2xl transition-all ${skill.isWeakest ? 'bg-amber-500/5 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : ''}`}>
          <div className="flex justify-between items-end mb-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-300">{skill.label}</span>
              <span className={`text-[9px] font-black uppercase tracking-wider ${skill.isWeakest ? 'text-amber-400' : 'text-gray-500'}`}>{skill.trend}</span>
            </div>
            <span className="text-xs font-black text-white">{skill.value}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${skill.value}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full ${skill.isWeakest ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : skill.color}`} 
            />
          </div>
        </div>
      ))}
    </div>
    <div className="mt-8 pt-6 border-t border-white/5">
      <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
        <span className="material-symbols-outlined text-xs align-bottom mr-1 text-violet-400">psychology</span>
        Focus on <span className="text-amber-400 font-bold">Communication</span> to boost your overall score.
      </p>
    </div>
  </BentoTile>
);

const ProgressTimeline = () => {
  const [expandedIdx, setExpandedIdx] = useState(0);

  return (
    <motion.section {...fadeUp(0.4)} className="col-span-12 mt-4 pb-20">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-10 px-2">Your Progress</h3>
      <div className="relative ml-4 md:ml-8 border-l border-white/10 pl-8 md:pl-12 space-y-12">
        {MOCK_TIMELINE.map((node, idx) => (
          <div key={idx} className="relative">
            {/* Connector Dot */}
            <div className={`absolute -left-[45px] md:-left-[61px] top-0 w-6 h-6 rounded-full border-4 border-[#060606] z-10 transition-colors duration-500 ${node.score >= 80 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`} />
            
            <div 
              onClick={() => setExpandedIdx(expandedIdx === idx ? -1 : idx)}
              className={`group p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer ${expandedIdx === idx ? 'bg-white/[0.03] border-white/10' : 'bg-transparent border-transparent hover:border-white/5 hover:bg-white/[0.01]'}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1 block">{node.date} • {node.type}</span>
                    <h4 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">{node.title}</h4>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${node.score >= 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                    {node.score >= 80 ? 'Strong Performance' : 'Needs Improvement'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{node.score}%</p>
                  </div>
                  <span className={`material-symbols-outlined text-gray-500 transition-transform duration-300 ${expandedIdx === idx ? 'rotate-180' : ''}`}>expand_more</span>
                </div>
              </div>

              <AnimatePresence>
                {expandedIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-6 mt-6 border-t border-white/5">
                      <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">AI Feedback</p>
                      <ul className="space-y-3 mb-6">
                        {node.feedback.map((f, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-300 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white hover:text-black transition-all active:scale-95">
                        Quick Review
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

// --- Main Layout ---

export const ModernDashboardContent = ({ className = '' }) => {
  return (
    <main className={`pt-10 px-4 md:px-8 max-w-7xl mx-auto pb-20 ${className}`}>
      <div className="grid grid-cols-12 gap-6">
        <ActionHeader />
        <ReadinessGauge />
        
        {/* New Stat Strip */}
        <MicroFeedbackStrip />
        
        <SmartRecommendation />
        <PracticeLab />
        <SkillInsights />
        <ProgressTimeline />
      </div>
    </main>
  );
};

export default ModernDashboardContent;
