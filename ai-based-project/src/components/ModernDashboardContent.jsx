import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MOCK_USER, 
  MOCK_RECOMMENDATION, 
  MOCK_SKILLS, 
  MOCK_TIMELINE 
} from '../data/mockData';
import { useUserGoal } from '../context/UserGoalContext.jsx';
import ExploreModeContent from './ExploreModeContent.jsx';

// --- Shared Components & Animations ---

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState(2 * 60 * 60); // 2 hours
  
  React.useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  return (
    <div className="flex gap-1.5 items-center text-lg md:text-xl font-mono font-bold text-violet-300">
      <div className="bg-black/40 px-2.5 py-1.5 rounded-lg border border-violet-500/20 shadow-inner">{String(h).padStart(2, '0')}</div>
      <span className="text-violet-500/50">:</span>
      <div className="bg-black/40 px-2.5 py-1.5 rounded-lg border border-violet-500/20 shadow-inner">{String(m).padStart(2, '0')}</div>
      <span className="text-violet-500/50">:</span>
      <div className="bg-black/40 px-2.5 py-1.5 rounded-lg border border-violet-500/20 shadow-inner">{String(s).padStart(2, '0')}</div>
    </div>
  );
};

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

const ActionHeader = ({ userName, totalSessions, goal }) => {
  const navigate = useNavigate();
  const isFirstLogin = totalSessions === 0;

  return (
    <BentoTile className="col-span-12 md:col-span-8 p-8 flex flex-col justify-center bg-white/5 backdrop-blur-2xl border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)] overflow-hidden relative" delay={0.1}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 blur-[60px] rounded-full -ml-10 -mb-10 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            {isFirstLogin ? 'Welcome, ' : 'Ready, '}<span className="text-white/40">{userName || MOCK_USER.name}{!isFirstLogin && '?'}</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-md">
            {isFirstLogin 
              ? "Let's kick off your interview preparation journey."
              : "Your next session starts soon. Everything is prepared."}
          </p>
          
          <button 
            onClick={() => navigate('/interviewsetup', { state: { fromDashboardCTA: true } })}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-violet-600 text-white font-bold tracking-tight hover:bg-violet-500 active:scale-95 transition-all shadow-xl shadow-violet-500/20 flex flex-col items-center justify-center leading-tight"
          >
            <span>{isFirstLogin ? "Start Today's Session →" : "Resume Last Session"}</span>
            {!isFirstLogin && <span className="text-[10px] text-black/60 font-black uppercase tracking-widest mt-1">Binary Trees • Apr 17</span>}
          </button>
        </div>
        
        {goal?.interviewDate && (
          <div className="flex flex-col gap-2 items-start md:items-end bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-md self-start md:self-auto w-full md:w-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Countdown to Interview</span>
            <p className="text-sm font-bold text-violet-300">Target: {goal.interviewDate}</p>
          </div>
        )}
        {!goal?.interviewDate && !isFirstLogin && (
          <div className="flex flex-col gap-2 items-start md:items-end bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-md self-start md:self-auto w-full md:w-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Upcoming Session</span>
            <CountdownTimer />
          </div>
        )}
      </div>
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
              className="text-violet-500 stroke-current drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]" 
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

const MicroFeedbackStrip = ({ streak, sessions }) => {
  const isFirstLogin = sessions === 0;

  return (
    <motion.div 
      {...fadeUp(0.18)}
      className="col-span-12 flex flex-col items-start gap-2 py-4"
    >
      <div className="flex flex-wrap items-center gap-4">
        {isFirstLogin ? (
          <>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-gray-400 backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm">local_fire_department</span>
              0-day streak
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-gray-400 backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm">task_alt</span>
              0 sessions
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest text-gray-400 backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm">grade</span>
              Average: —
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[11px] font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +6% this week
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/5 border border-orange-500/10 text-[11px] font-bold uppercase tracking-widest text-orange-400 backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm">local_fire_department</span>
                {streak}-day streak
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/5 border border-violet-500/10 text-[11px] font-bold uppercase tracking-widest text-violet-400 backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm">task_alt</span>
              {sessions} sessions
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/5 border border-amber-500/10 text-[11px] font-bold uppercase tracking-widest text-amber-400 backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm">grade</span>
              Best: 92%
            </div>
          </>
        )}
      </div>
      {isFirstLogin && (
        <p className="text-[10px] text-gray-500 px-2 mt-1">Complete your first session to see stats</p>
      )}
    </motion.div>
  );
};

const TodaysMissionWidget = () => {
  const navigate = useNavigate();
  const { goal } = useUserGoal();
  
  const topic = goal?.weakestArea || 'Binary Trees';
  const isCampus = goal?.goalType === 'campus';
  const displayTopic = isCampus && !goal?.weakestArea ? 'Aptitude & DSA' : topic;

  return (
    <BentoTile 
      className="col-span-12 md:col-span-6 p-8 border-violet-500/20 shadow-[0_0_30px_rgba(139,92,246,0.1)] group relative overflow-hidden flex flex-col justify-between" 
      delay={0.2}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[12px]">flag</span> Today's Mission
          </span>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">{displayTopic}</h3>
        <p className="text-white/60 mb-6 text-sm leading-relaxed">
          {isCampus 
            ? "A focused drill tailored for upcoming campus placement drives."
            : "A quick targeted drill based on your onboarding profile."}
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[10px] font-bold text-white/70 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px]">timer</span> 15 MIN
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[10px] font-bold text-white/70 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span> ADAPTIVE
          </div>
        </div>
      </div>

      <button 
        onClick={() => navigate('/interviewsetup', { state: { fromDashboardCTA: true, defaultTopic: displayTopic } })}
        className="w-full py-4 rounded-xl bg-violet-600 text-white font-bold tracking-tight hover:bg-violet-500 shadow-xl shadow-violet-500/20 transition-all active:scale-[0.98] relative z-10 flex items-center justify-center gap-2"
      >
        Start Session <span className="material-symbols-outlined text-lg">arrow_forward</span>
      </button>
    </BentoTile>
  );
};

const DSACodingWidget = () => {
  const navigate = useNavigate();
  return (
    <BentoTile className="col-span-12 md:col-span-6 p-8 border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)] group relative overflow-hidden flex flex-col justify-between" delay={0.22}>
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[12px]">code</span> Skill Drill
          </span>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">DSA Coding Round</h3>
        <p className="text-white/60 mb-6 text-sm leading-relaxed">
          You need to focus on Data Structures and Algorithms. Jump into a coding round with test cases and AI review.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[10px] font-bold text-white/70 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px]">timer</span> 30 MIN
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[10px] font-bold text-white/70 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px]">terminal</span> LIVE EDITOR
          </div>
        </div>
      </div>

      <button 
        onClick={() => navigate('/dsa-round')}
        className="w-full py-4 rounded-xl bg-cyan-600 text-white font-bold tracking-tight hover:bg-cyan-500 shadow-xl shadow-cyan-500/20 transition-all active:scale-[0.98] relative z-10 flex items-center justify-center gap-2"
      >
        Start Coding Round <span className="material-symbols-outlined text-lg">arrow_forward</span>
      </button>
    </BentoTile>
  );
};

const YourFocusAreasWidget = () => {
  const navigate = useNavigate();
  const { goal } = useUserGoal();
  
  const areas = goal?.weakestArea ? [goal.weakestArea, ...(goal?.strongestArea ? [goal.strongestArea] : [])] : ['System Design', 'Behavioral'];

  return (
    <BentoTile className="col-span-12 md:col-span-6 p-8 flex flex-col justify-between" delay={0.25}>
      <div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Your Focus Areas</h3>
        <div className="flex flex-col gap-3">
          {areas.map((area, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                <span className="text-sm font-bold text-white">{area}</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${idx === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {idx === 0 ? 'High Priority' : 'Maintaining'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
        <p className="text-[10px] text-gray-500 font-medium">These are based on your onboarding answers.</p>
        <button onClick={() => navigate('/change-goal')} className="text-[10px] font-bold text-violet-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1">
          Update <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
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
            className="flex flex-col h-full justify-end"
          >
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
    <div className="space-y-8 flex-1 flex flex-col justify-center">
      {MOCK_SKILLS.map((skill) => (
        <div key={skill.label} className={`relative py-4 px-2 rounded-2xl transition-all ${skill.isWeakest ? 'bg-amber-500/5 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)] px-4' : ''}`}>
          <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-gray-300">{skill.label}</span>
              <span className={`text-[10px] font-black uppercase tracking-wider ${skill.isWeakest ? 'text-amber-400' : 'text-gray-500'}`}>{skill.trend}</span>
            </div>
            <span className="text-sm font-black text-white">{skill.value}%</span>
          </div>
          <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${skill.value}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
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

export const TargetCompaniesWidget = () => {
  const { goal } = useUserGoal();
  const navigate = useNavigate();
  const companies = goal?.companies || [];
  
  return (
    <BentoTile className="col-span-12 md:col-span-6 p-8 flex flex-col justify-between" delay={0.3}>
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-indigo-400">apartment</span>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Target Companies</h3>
            <p className="text-sm font-bold text-white">Your placement goals</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {companies.map(c => (
            <div key={c} className="px-4 py-2 rounded-xl bg-black/30 border border-white/5 flex items-center gap-2">
              <span className="text-sm font-bold text-gray-300">{c}</span>
            </div>
          ))}
          {companies.length === 0 && (
            <p className="text-sm text-gray-500">No companies selected during onboarding.</p>
          )}
        </div>
      </div>
      
      {companies.length > 0 && (
        <button onClick={() => navigate('/interviewsetup')} className="w-fit text-[11px] font-bold text-indigo-400 hover:text-white transition-colors flex items-center gap-1 group">
          Practice {companies[0]}-style questions
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      )}
    </BentoTile>
  );
};

export const RecommendedScheduleWidget = () => {
  const { goal } = useUserGoal();
  const navigate = useNavigate();
  
  return (
    <BentoTile className="col-span-12 md:col-span-6 p-8 flex flex-col justify-between" delay={0.35}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-400">calendar_month</span>
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Recommended Schedule</h3>
              <p className="text-sm font-bold text-white">{goal?.schedule || 'Regular Pace'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/profile')} className="text-[10px] font-bold text-violet-400 hover:text-white transition-colors uppercase tracking-widest">
            Edit
          </button>
        </div>
        
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-black/30 border border-white/5">
          <span className="material-symbols-outlined text-gray-400">event_upcoming</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Next Suggested Session</p>
            <p className="text-sm font-bold text-white">Tomorrow</p>
          </div>
        </div>
      </div>
    </BentoTile>
  );
};

const ProgressTimeline = ({ history }) => {
  const [expandedIdx, setExpandedIdx] = useState(0);
  const navigate = useNavigate();

  const displayTimeline = (history && history.length > 0)
    ? history.map(s => {
        const rawScore = typeof s.score === 'number' ? s.score : 0;
        const normalizedScore = rawScore <= 10 ? rawScore * 10 : rawScore;
        const dateStr = s.date ? (new Date(s.date).toString() === 'Invalid Date' ? s.date : new Date(s.date).toLocaleDateString()) : 'Recent';
        return {
          id: s._id,
          date: dateStr,
          type: String(s.mode || s.track || 'Interview').toUpperCase(),
          title: s.company ? `${s.company} - ${s.jobRole || 'Interview'}` : (s.dsaProblem || 'DSA Problem Challenge'),
          score: normalizedScore,
          feedback: s.studyRecommendations && s.studyRecommendations.length > 0 
            ? s.studyRecommendations 
            : [s.overallFeedback].filter(Boolean),
          isReal: true,
        };
      })
    : MOCK_TIMELINE;

  const avgScore = (history && history.length > 0)
    ? Math.round(history.reduce((acc, s) => acc + (s.score <= 10 ? s.score * 10 : s.score), 0) / history.length)
    : 82;
  const sessionCount = (history && history.length > 0) ? history.length : 4;

  if (displayTimeline.length === 0) {
    return (
      <motion.section {...fadeUp(0.4)} className="col-span-12 mt-4 pb-20">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4 px-2">Your Progress</h3>
        <div className="p-8 rounded-3xl border border-white/5 border-dashed flex flex-col items-center justify-center text-center bg-black/20">
          <span className="material-symbols-outlined text-4xl text-gray-600 mb-4">timeline</span>
          <p className="text-sm text-gray-400 font-medium max-w-sm">Your progress timeline will appear after your first session.</p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section {...fadeUp(0.4)} className="col-span-12 mt-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 px-2 gap-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Your Progress</h3>
          <div className="text-sm font-bold text-gray-400">{sessionCount} session{sessionCount !== 1 ? 's' : ''} &nbsp;&bull;&nbsp; <span className="text-emerald-400">avg {avgScore}%</span></div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span>Strong (&ge;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            <span>Needs Focus (&lt;80%)</span>
          </div>
        </div>
      </div>
      <div className="relative ml-4 md:ml-8 border-l border-white/10 pl-8 md:pl-12 space-y-12">
        {displayTimeline.map((node, idx) => (
          <div key={idx} className="relative">
            {/* Connector Dot */}
            <div className={`absolute -left-[45px] md:-left-[61px] top-0 w-6 h-6 rounded-full border-4 border-[#060606] z-10 transition-colors duration-500 ${node.score >= 80 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`} />
            
            <div 
              onClick={() => setExpandedIdx(expandedIdx === idx ? -1 : idx)}
              className={`group p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer ${expandedIdx === idx ? 'bg-white/[0.03] border-white/10' : 'bg-transparent border-transparent hover:border-white/5 hover:bg-white/[0.01]'}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1.5 block">{node.date} • {node.type}</span>
                    <h4 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">{node.title}</h4>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit ${node.score >= 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
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
                        {node.feedback && node.feedback.length > 0 ? (
                          node.feedback.map((f, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-300 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-400">No specific feedback comments loaded.</li>
                        )}
                      </ul>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (node.isReal && node.id) {
                            navigate(`/session/${node.id}`);
                          } else {
                            navigate('/reports');
                          }
                        }}
                        className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all active:scale-95 shadow-lg shadow-violet-600/25"
                      >
                        {node.isReal ? "Detailed Scorecard" : "View Reports"}
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

import API from '../api';
import { useEffect } from 'react';

const ModeToggle = ({ mode, setMode }) => (
  <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/20 border border-white/5 w-fit mb-8">
    {[['guided', 'explore_nearby', 'Guided'], ['explore', 'travel_explore', 'Explore']].map(([id, icon, label]) => (
      <button key={id} onClick={() => setMode(id)}
        className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
        {mode === id && (
          <motion.div layoutId="mode-bg" className="absolute inset-0 bg-white/10 rounded-xl" />
        )}
        <span className="material-symbols-outlined text-base relative z-10">{icon}</span>
        <span className="relative z-10">{label}</span>
      </button>
    ))}
  </div>
);

const NudgeBanner = ({ onSwitch, onDismiss }) => (
  <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
    className="col-span-12 flex items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-2">
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-amber-400">info</span>
      <p className="text-sm text-amber-200">You've been in Explore mode for a few days. Want to get back on track?</p>
    </div>
    <div className="flex items-center gap-3 flex-shrink-0">
      <button onClick={onSwitch} className="text-amber-400 text-xs font-black hover:text-white transition-colors">Switch to Guided →</button>
      <button onClick={onDismiss} className="text-gray-500 hover:text-gray-300 transition-colors">
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  </motion.div>
);

export const ModernDashboardContent = ({ className = '' }) => {
  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState([]);
  const { dashboardMode, setDashboardMode, shouldShowNudge, dismissNudge, goal } = useUserGoal();

  useEffect(() => {
    API.get('/me')
      .then(res => setUserData(res.data?.user))
      .catch(err => console.error("Error fetching user", err));

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    fetch('/api/interview/history', { credentials: 'include', headers })
      .then(res => res.json())
      .then(data => {
        if (data && data.history) {
          setHistory(data.history.slice(0, 3)); // Only get the last 3 sessions for Dashboard Recent Sessions!
        }
      })
      .catch(err => console.error("Error fetching history", err));
  }, []);

  const totalSessions = history.length > 0 ? history.length : (userData?.totalSessions || 0);

  return (
    <div className={`pt-8 px-4 md:px-6 ${className}`}>
      {/* Mode toggle */}
      <div className="max-w-7xl mx-auto">
        <ModeToggle mode={dashboardMode} setMode={setDashboardMode} />
      </div>

      <AnimatePresence mode="wait">
        {dashboardMode === 'guided' ? (
          <motion.main key="guided" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }} className="max-w-7xl mx-auto pb-20">
            <div className="grid grid-cols-12 gap-6">
              <ActionHeader userName={userData?.UserName} totalSessions={totalSessions} goal={goal} />
              <ReadinessGauge />
              <MicroFeedbackStrip streak={userData?.streak?.current || 0} sessions={totalSessions} />
              {(goal?.weakestArea?.toLowerCase()?.includes('dsa') || goal?.weakestArea?.toLowerCase()?.includes('data structures') || goal?.weakestArea?.toLowerCase()?.includes('algorithms') || goal?.weakestArea?.toLowerCase()?.includes('coding')) ? (
                <DSACodingWidget />
              ) : (
                <TodaysMissionWidget />
              )}
              <YourFocusAreasWidget />
              <TargetCompaniesWidget />
              <RecommendedScheduleWidget />
              <ProgressTimeline history={history} />
            </div>
          </motion.main>
        ) : (
          <motion.div key="explore" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}>
            {shouldShowNudge && (
              <div className="max-w-7xl mx-auto px-0 mb-2">
                <NudgeBanner onSwitch={() => setDashboardMode('guided')} onDismiss={dismissNudge} />
              </div>
            )}
            <ExploreModeContent />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernDashboardContent;
