import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserGoal } from '../context/UserGoalContext.jsx';
import API from '../api.jsx';

const PERSONAS = [
  {
    name: 'Sarah Chen',
    title: 'Principal Engineer @ Meta',
    avatar: 'SC',
    color: '#8b5cf6',
    style: 'Deep-dive technical',
    badge: 'Technical',
    focus: ['System Design', 'DSA', 'Architecture'],
    prompt: 'Expect thorough follow-up questions. Sarah digs deep into trade-offs.',
  },
  {
    name: 'Marcus Webb',
    title: 'Engineering Manager @ Google',
    avatar: 'MW',
    color: '#06b6d4',
    style: 'Behavioral + Leadership',
    badge: 'Behavioral',
    focus: ['Leadership', 'Communication', 'Impact'],
    prompt: 'Marcus focuses on your decision-making process and cross-functional impact.',
  },
  {
    name: 'Priya Sharma',
    title: 'Staff SDE @ Amazon',
    avatar: 'PS',
    color: '#f59e0b',
    style: 'Rapid-fire problem solving',
    badge: 'Mixed',
    focus: ['Algorithms', 'LP Principles', 'Scalability'],
    prompt: 'Priya moves fast. Expect concise questions and tight time pressure.',
  },
];

const PREMIUM_COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Netflix', 'Meta', 'Apple', 'Adobe', 'Uber', 'Airbnb'];
const BUILT_IN_BANK = ['Google', 'Amazon', 'Microsoft'];

const CompanyLogo = ({ companyName }) => {
  const [hasError, setHasError] = useState(false);
  
  if (!companyName) return <span className="text-base">🎯</span>;
  const name = companyName.toLowerCase().trim();
  const domainMap = {
    google: 'google.com', amazon: 'amazon.com', microsoft: 'microsoft.com',
    meta: 'meta.com', apple: 'apple.com', netflix: 'netflix.com',
    adobe: 'adobe.com', uber: 'uber.com', airbnb: 'airbnb.com'
  };
  const domain = domainMap[name] || `${name.replace(/\s+/g, '')}.com`;
  
  return (
    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
      {!hasError ? (
        <img 
          src={`https://logo.clearbit.com/${domain}`} 
          alt={companyName} 
          className="w-full h-full object-contain rounded-md drop-shadow-md animate-fade-in" 
          onError={() => setHasError(true)} 
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 rounded-md border border-white/20 text-white/60 font-bold text-xs uppercase">
          {name.substring(0, 2)}
        </div>
      )}
    </div>
  );
};

const FOCUS_OPTS = {
  tech: ['Technical', 'System Design', 'Behavioral', 'Mixed'],
  mba: ['Strategy', 'Marketing', 'Finance', 'Operations', 'HR'],
};

const STEPS = ['Company', 'Mode', 'Role & Level', 'Interviewer'];

const ROLE_OPTIONS = [
  'Software Engineer', 'Product Manager', 'Data Scientist', 'Backend Developer', 
  'Frontend Developer', 'Fullstack Developer', 'Mobile Developer', 'DevOps Engineer', 
  'QA Engineer', 'UI/UX Designer', 'Security Engineer', 'Cloud Architect'
];

const LEVEL_OPTIONS = [
  { id: 'entry', label: 'Entry Level' },
  { id: 'mid', label: 'Mid Level' },
  { id: 'senior', label: 'Senior Level' },
  { id: 'lead', label: 'Lead / Manager' },
];

const RESUME_CARDS = (() => {
  try {
    const raw = localStorage.getItem('interviewQuestionHistory');
    const history = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(history) || history.length === 0) return [];
    const seen = new Set();
    return history
      .filter(h => h.company || h.jobRole)
      .filter(h => {
        const key = `${h.company}-${h.jobRole}-${h.track}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3)
      .map(h => ({
        label: h.company ? `Continue ${h.company} – ${h.jobRole || 'SWE'} Prep` : `Resume ${h.jobRole} Practice`,
        sub: `${h.level || 'Mid'} level · ${h.focusArea || h.track || 'Technical'}`,
        detail: h,
      }));
  } catch { return []; }
})();

/* ─── Utilities ────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
});

export default function InterviewSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { goal } = useUserGoal();
  
  const [step, setStep] = useState(0); // 0=company,1=mode,2=role-level,3=ready
  const [company, setCompany] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mode, setMode] = useState(''); // chat | video | voice
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [level, setLevel] = useState('mid');
  const [track, setTrack] = useState('tech');
  const [focusArea, setFocusArea] = useState('Technical');
  const [personaIdx, setPersonaIdx] = useState(0);
  const [hintCredits] = useState(3);
  const [useResumeQuestions, setUseResumeQuestions] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const inputRef = useRef(null);
  const pendingFileRef = useRef(null);
  // resumeModal: null | 'replace' | 'save-to-profile'
  const [resumeModal, setResumeModal] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  const [totalSessions, setTotalSessions] = useState(0);
  const hasAutoFilled = useRef(false);

  const [isMicOn, setIsMicOn] = useState(false);
  const [permissionError, setPermissionError] = useState("");
  const [autoPlayVoice, setAutoPlayVoice] = useState(true);

  const toggleMic = async () => {
    if (isMicOn) {
      setIsMicOn(false);
      setPermissionError("");
      return;
    }
    setPermissionError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stream) {
        setIsMicOn(true);
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      setIsMicOn(false);
      setPermissionError("Microphone access denied. Please allow it in browser settings.");
    }
  };

  useEffect(() => {
    API.get('/me')
      .then(res => {
        const text = res.data?.user?.resumeText;
        if (text && text.trim().length > 10) {
          setHasResume(true);
        }
      })
      .catch(err => {
        console.error('Error fetching user info in setup:', err);
      });
  }, []);

  useEffect(() => {
    try {
      const historyRaw = localStorage.getItem('interviewQuestionHistory');
      if (historyRaw) {
        const history = JSON.parse(historyRaw);
        if (Array.isArray(history)) {
          const uniqueSessions = new Set(history.map(h => h.sessionId || h.date)).size;
          setTotalSessions(uniqueSessions);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const { fromDashboardCTA, defaultTopic } = location.state || {};
    if (fromDashboardCTA && goal && !hasAutoFilled.current) {
      hasAutoFilled.current = true;
      
      if (goal.companies && goal.companies.length > 0) {
        setCompany(goal.companies[0]);
      } else {
        setCompany('Google');
      }
      
      setMode('chat');
      
      if (goal.targetRole) setJobRole(goal.targetRole);
      if (goal.experienceLevel) setLevel(goal.experienceLevel.toLowerCase());
      
      if (defaultTopic) {
        setFocusArea(defaultTopic);
      } else if (goal.weakestArea) {
        setFocusArea(goal.weakestArea);
      }
      
      // Fast forward to summary step
      setStep(3);
    }
  }, [location.state, goal]);

  const persona = PERSONAS[personaIdx];

  const suggestions = PREMIUM_COMPANIES.filter(c => 
    c.toLowerCase().includes(company.toLowerCase()) && 
    c.toLowerCase() !== company.toLowerCase()
  );

  const isAvailable = BUILT_IN_BANK.some(b => 
    company.toLowerCase().includes(b.toLowerCase())
  );

  const [showRoleDrop, setShowRoleDrop] = useState(false);
  const [showLevelDrop, setShowLevelDrop] = useState(false);
  const [showFocusDrop, setShowFocusDrop] = useState(false);


  /* Auto-advance steps */
  useEffect(() => {
    if (company.trim().length >= 2 && step === 0) {
      // Don't auto-advance if we're showing suggestions, unless one is selected
      if (!showSuggestions) setStep(1);
    }
    if (company.trim().length < 2 && step > 0) setStep(0);
  }, [company, showSuggestions]);

  useEffect(() => {
    if (mode && step === 1) setStep(2);
  }, [mode]);

  useEffect(() => {
    if (jobRole.trim() && level && focusArea && step === 2) {
      const t = setTimeout(() => setStep(3), 600);
      return () => clearTimeout(t);
    }
  }, [jobRole, level, focusArea, step]);

  const handleStart = () => {
    if (step < 3) return;
    const config = { company, jobRole, level, focusArea, track, mbaSpecialization: 'marketing', personaIdx, useResumeQuestions, autoPlayVoice, micTested: isMicOn };
    const path = mode === 'video' ? '/video-interview' : mode === 'voice' ? '/voice-interview' : '/chat-interview';
    navigate(path, { state: { config } });
  };

  const handleResumeCard = (card) => {
    const d = card.detail;
    setCompany(d.company || '');
    setJobRole(d.jobRole || 'Software Engineer');
    setLevel(d.level || 'mid');
    setTrack(d.track || 'tech');
    setFocusArea(d.focusArea || 'Technical');
    if (d.company) setTimeout(() => setStep(1), 100);
  };

  const isCampus = goal?.goalType === 'campus';
  const voiceUnlockThreshold = isCampus ? 2 : 3;
  const videoUnlockThreshold = 5;

  const modeOptions = [
    { id: 'chat', label: 'Chat Mode', icon: '💬', desc: 'Text-based AI simulation', badge: null },
    { id: 'voice', label: 'Voice Mode', icon: '🎙️', desc: 'Audio-only focus mode', badge: totalSessions < voiceUnlockThreshold ? `Recommended after ${voiceUnlockThreshold} sessions` : null },
    { id: 'video', label: 'Video Mode ✦ FLAGSHIP', icon: '📹', desc: 'Face-to-face AI mock', badge: totalSessions < videoUnlockThreshold ? `Recommended after ${videoUnlockThreshold} sessions` : null },
  ];

  const getDifficulty = (lvl) => {
    if (lvl === 'entry') return { label: 'Easy', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' };
    if (lvl === 'senior' || lvl === 'lead') return { label: 'Hard', color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' };
    return { label: 'Medium', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
  };
  const diff = getDifficulty(level);
  const qCount = mode === 'chat' ? 5 : 8;
  const duration = mode === 'chat' ? '~15 min' : '~20 min';
  const iType = track === 'mba' ? 'MBA' : focusArea;

  return (
    <>
      <div className="min-h-screen text-white overflow-x-hidden relative">
      {/* Background atmosphere */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-indigo-600/8 blur-[120px] rounded-full" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* Top bar */}
        <motion.div {...fadeUp(0)} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 rounded-full border border-white/10 bg-white/3 hover:bg-white/5 hover:border-white/20 transition-all flex items-center justify-center text-white/60 hover:text-white"
              title="Back to Dashboard"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Interview Simulation</span>
              <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">Interview Setup</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AI Ready
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[200px_1fr_340px] gap-8 items-start">

          {/* ── LEFT: Progress Tracker ── */}
          <motion.div {...fadeUp(0.1)} className="hidden lg:block pt-4 sticky top-24">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-8">Mission Status</p>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/5" />
              {STEPS.map((label, i) => {
                const done = step > i || (step === 3 && i === 3);
                const active = step === i && !(step === 3 && i === 3);
                return (
                  <div key={i} className="relative flex items-start gap-4 mb-9">
                    <motion.div
                      animate={{ scale: active ? [1, 1.2, 1] : 1 }}
                      transition={{ repeat: active ? Infinity : 0, duration: 2 }}
                      className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-500 ${
                        done
                          ? 'bg-violet-500 border-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.6)]'
                          : active
                          ? 'border-violet-400 bg-violet-500/20 shadow-[0_0_8px_rgba(139,92,246,0.4)]'
                          : 'border-white/10 bg-transparent'
                      }`}
                    >
                      {done && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {active && <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />}
                    </motion.div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-bold transition-colors duration-300 ${done || active ? 'text-white' : 'text-white/25'}`}>{label}</p>
                      {done && <p className="text-[10px] text-violet-400 mt-0.5">Complete</p>}
                      {active && <p className="text-[10px] text-white/40 mt-0.5">In progress</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resume Cards */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Resume Prep</p>
                
                {/* Upload Button */}
                <label className="cursor-pointer group flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-violet-400 group-hover:text-violet-300">upload_file</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-violet-400 group-hover:text-violet-300">Upload PDF</span>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      // Reset input so re-selecting same file still fires
                      e.target.value = '';
                      pendingFileRef.current = file;
                      if (hasResume) {
                        setResumeModal('replace');
                      } else {
                        setResumeModal('save-to-profile');
                      }
                    }}
                  />
                </label>
              </div>
              
              {RESUME_CARDS.length > 0 ? (
                <div className="space-y-3">
                  {RESUME_CARDS.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => handleResumeCard(c)}
                      className="w-full text-left p-3 rounded-2xl bg-white/3 border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group"
                    >
                      <p className="text-xs font-bold text-white/70 group-hover:text-white line-clamp-2 leading-snug">{c.label}</p>
                      <p className="text-[10px] text-white/30 mt-1">{c.sub}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-white/10 text-center bg-white/2">
                  <p className="text-xs text-white/40">Upload your resume to get tailored questions based on your experience.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── CENTER: Main Interaction ── */}
          <div className="space-y-4">

            {/* Company Search — always visible */}
            <motion.div {...fadeUp(0.15)}>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 mb-2">
                Step 1 · Target Company
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <CompanyLogo companyName={company} />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={company}
                  onChange={e => {
                    setCompany(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Which company are you interviewing for?"
                  className="w-full pl-16 pr-32 py-4 text-lg font-semibold bg-white/3 border border-white/8 rounded-3xl outline-none placeholder-white/20 focus:border-violet-500/60 focus:bg-violet-500/5 focus:shadow-[0_0_40px_rgba(139,92,246,0.12)] transition-all duration-300"
                  autoFocus
                />
                
                {/* Availability Badge */}
                <div className="absolute inset-y-0 right-16 flex items-center pointer-events-none">
                  {company.trim().length >= 2 && (
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        isAvailable 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                    >
                      {isAvailable ? 'Premium Bank' : 'AI Generated'}
                    </motion.span>
                  )}
                </div>

                {company && (
                  <button onClick={() => { setCompany(''); setMode(''); setStep(0); }} className="absolute inset-y-0 right-5 flex items-center text-white/20 hover:text-white/50 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl z-50 overflow-hidden"
                    >
                      {suggestions.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setCompany(c);
                            setShowSuggestions(false);
                            setStep(1);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-violet-500/10 hover:text-violet-400 transition-all text-left"
                        >
                          <span className="font-bold flex items-center gap-2">
                            <CompanyLogo companyName={c} />
                            <span>{c}</span>
                          </span>
                          {BUILT_IN_BANK.includes(c) && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                              Premium
                            </span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Mode Selection — step 1 */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div
                  key="mode"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 mb-2">
                    Step 2 · Interview Mode
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {modeOptions.map((m) => {
                      const isVideo = m.id === 'video';
                      const isSelected = mode === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setMode(m.id)}
                          className={`relative min-h-[200px] p-6 rounded-[2rem] border text-left transition-all duration-300 group overflow-hidden flex flex-col ${
                            isSelected
                              ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_30px_rgba(139,92,246,0.4)]'
                              : isVideo
                                ? 'border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60 hover:bg-violet-500/10'
                                : 'border-white/8 bg-white/3 hover:border-violet-500/40 hover:bg-violet-500/5'
                          }`}
                        >
                          {isSelected && <div className="absolute inset-0 bg-violet-500/5" />}
                          {isVideo && !isSelected && <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-fuchsia-600/5" />}
                          
                          <span className="text-5xl block mb-auto pb-4 drop-shadow-lg">{m.icon}</span>
                          
                          <div className="relative z-10">
                            <p className={`font-bold text-lg mb-1 ${isVideo && !isSelected ? 'text-violet-300' : 'text-white'}`}>
                              {m.label.replace(' ✦ FLAGSHIP', '')}
                            </p>
                            <p className="text-xs text-white/50 leading-relaxed">{m.desc}</p>
                          </div>

                          {m.badge && (
                            <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 uppercase tracking-widest leading-none">
                              <span className="material-symbols-outlined text-[12px]">lock_clock</span>
                              {m.badge}
                            </div>
                          )}

                          {isVideo && (
                            <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-[9px] font-black text-violet-300 uppercase tracking-widest shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                              Flagship
                            </div>
                          )}

                          {isSelected && (
                            <motion.div layoutId="modeCheck" className="absolute top-4 right-4 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Role / Level / Track — step 2 */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div
                  key="role"
                  {...fadeUp(0.1)}
                  className="space-y-4"
                >
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">
                    Step 3 · Role & Preferences
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Role Dropdown */}
                    <div className="col-span-2 relative">
                      <button
                        onClick={() => setShowRoleDrop(!showRoleDrop)}
                        className="w-full flex items-center justify-between px-6 py-3 rounded-2xl bg-white/3 border border-white/8 hover:border-violet-500/40 transition-all text-left group"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Target Role</span>
                          <span className="font-bold text-lg text-white">{jobRole || 'Select Role'}</span>
                        </div>
                        <svg className={`w-5 h-5 text-white/20 group-hover:text-violet-400 transition-transform duration-300 ${showRoleDrop ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {showRoleDrop && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl z-[60] max-h-60 overflow-y-auto custom-scrollbar"
                          >
                            {ROLE_OPTIONS.map(r => (
                              <button
                                key={r}
                                onClick={() => { setJobRole(r); setShowRoleDrop(false); }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${
                                  jobRole === r ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-white/5 text-white/70'
                                }`}
                              >
                                <span className="font-semibold">{r}</span>
                                {jobRole === r && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Level Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowLevelDrop(!showLevelDrop)}
                        className="w-full flex items-center justify-between px-6 py-3 rounded-2xl bg-white/3 border border-white/8 hover:border-violet-500/40 transition-all text-left group"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Level</span>
                          <span className="font-bold text-white">
                            {LEVEL_OPTIONS.find(l => l.id === level)?.label}
                          </span>
                        </div>
                        <svg className={`w-4 h-4 text-white/10 group-hover:text-violet-400 transition-transform ${showLevelDrop ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {showLevelDrop && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl z-[60]"
                          >
                            {LEVEL_OPTIONS.map(l => (
                              <button
                                key={l.id}
                                onClick={() => { setLevel(l.id); setShowLevelDrop(false); }}
                                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all text-left ${
                                  level === l.id ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-white/5 text-white/70'
                                }`}
                              >
                                <span className="font-semibold text-sm">{l.label}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Focus Area Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowFocusDrop(!showFocusDrop)}
                        className="w-full flex items-center justify-between px-6 py-3 rounded-2xl bg-white/3 border border-white/8 hover:border-violet-500/40 transition-all text-left group"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Focus</span>
                          <span className="font-bold text-white uppercase tracking-wider text-xs">{focusArea}</span>
                        </div>
                        <svg className={`w-4 h-4 text-white/10 group-hover:text-violet-400 transition-transform ${showFocusDrop ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {showFocusDrop && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl z-[60]"
                          >
                            {(FOCUS_OPTS[track] || FOCUS_OPTS.tech).map(f => (
                              <button
                                key={f}
                                onClick={() => { setFocusArea(f); setShowFocusDrop(false); }}
                                className={`w-full px-4 py-3 rounded-xl transition-all text-left ${
                                  focusArea === f ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-white/5 text-white/70'
                                }`}
                              >
                                <span className="font-semibold text-xs uppercase tracking-widest">{f}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Track toggle */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {['Tech / Software', 'MBA'].map((t, i) => {
                      const val = i === 0 ? 'tech' : 'mba';
                      return (
                        <button
                          key={t}
                          onClick={() => { setTrack(val); setFocusArea(FOCUS_OPTS[val][0]); }}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                            track === val ? 'bg-violet-500 border-violet-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'border-white/10 text-white/30 hover:text-white/60'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}

                    {/* Resume Questions toggle */}
                    <div className="relative ml-auto group/tooltip">
                      <button
                        onClick={() => {
                          if (hasResume) {
                            setUseResumeQuestions(r => !r);
                          }
                        }}
                        disabled={!hasResume}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                          !hasResume
                            ? 'border-white/5 bg-white/1 text-white/20 cursor-not-allowed opacity-40'
                            : useResumeQuestions
                            ? 'bg-violet-500/20 border-violet-500 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.25)]'
                            : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        {useResumeQuestions ? (
                          <span className="material-symbols-outlined text-[12px] text-violet-300">check</span>
                        ) : (
                          <span className="material-symbols-outlined text-[12px]">description</span>
                        )}
                        Resume mode
                      </button>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 right-0 scale-95 opacity-0 pointer-events-none group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100 transition-all duration-200 z-50 origin-bottom-right">
                        <div className="bg-neutral-900 border border-white/10 text-white text-[10px] font-medium rounded-lg px-3 py-1.5 shadow-2xl whitespace-nowrap">
                          {hasResume
                            ? "Questions will be personalized based on your uploaded resume"
                            : "Upload resume (using Upload PDF) to enable"}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Persona toggle row — step 3 */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div
                  key="persona-toggle"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 mb-2">
                    Step 4 · Your Interviewer
                  </label>
                  <div className="flex gap-2">
                    {PERSONAS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setPersonaIdx(i)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                          personaIdx === i ? 'bg-violet-600 border-violet-500 text-white' : 'border-white/10 text-white/40 hover:text-white/70'
                        }`}
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="pt-2"
                >
                  {mode === 'voice' && (
                    <div className="mb-6 bg-white/5 rounded-2xl border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isMicOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            <span className="material-symbols-outlined text-[20px]">mic</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white mb-0.5">Microphone Status</p>
                            {isMicOn ? (
                              <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">Microphone working <span className="material-symbols-outlined text-[12px]">check</span></p>
                            ) : permissionError ? (
                              <p className="text-[10px] text-red-400 font-bold">No microphone detected</p>
                            ) : (
                              <p className="text-[10px] text-white/50">Please test your microphone before starting</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={toggleMic}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${isMicOn ? 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white' : 'bg-violet-600 text-white hover:bg-violet-500'}`}
                        >
                          {isMicOn ? "Turn Off" : "Test Mic"}
                        </button>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={autoPlayVoice}
                          onChange={(e) => setAutoPlayVoice(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500 focus:ring-offset-background"
                        />
                        <span className="text-[10px] font-bold text-white/50 group-hover:text-white/80 transition-colors uppercase tracking-widest">Auto-read questions aloud</span>
                      </label>
                    </div>
                  )}

                  <motion.button
                    onClick={handleStart}
                    disabled={mode === 'voice' && !isMicOn}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 40px rgba(139,92,246,0.5)', '0 0 20px rgba(139,92,246,0.3)'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg tracking-wide flex items-center justify-center gap-3 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative z-10">Start Interview Simulation</span>
                    <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </motion.button>
                  {mode === 'voice' && !isMicOn && (
                    <p className="text-center text-xs text-red-400 mt-3 font-bold">
                      Test your microphone to enable
                    </p>
                  )}
                  <p className="text-center text-xs text-white/30 mt-3">
                    {hintCredits} hint credits · {mode === 'voice' ? '8' : '5'} questions · ~20 min session
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Persona Card ── */}
          <div className="hidden lg:block pt-4">
            <AnimatePresence mode="wait">
              {step >= 3 ? (
                <motion.div
                  key={`persona-${personaIdx}`}
                  initial={{ opacity: 0, x: 30, rotateY: -10 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 30, rotateY: 10 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-[2rem] border border-white/8 bg-white/3 backdrop-blur-xl p-7 relative overflow-hidden"
                  style={{ boxShadow: `0 0 60px ${persona.color}20` }}
                >
                  {/* Background glow */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px]" style={{ backgroundColor: `${persona.color}30` }} />

                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6 relative">
                    <motion.div
                      animate={{ boxShadow: [`0 0 0px ${persona.color}40`, `0 0 20px ${persona.color}60`, `0 0 0px ${persona.color}40`] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                      style={{ backgroundColor: `${persona.color}25`, border: `1.5px solid ${persona.color}50` }}
                    >
                      {persona.avatar}
                    </motion.div>
                    <div>
                      <p className="font-bold text-white text-base">{persona.name}</p>
                      <p className="text-xs text-white/50 mt-0.5">{persona.title}</p>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${diff.color}`}>
                      {diff.label}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-white/60">
                      {duration}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-white/60">
                      {qCount} Qs
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-white/60 truncate max-w-[100px]">
                      {iType}
                    </span>
                  </div>

                  {/* Style */}
                  <div className="mb-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-1.5">Interview Style</p>
                    <p className="text-sm font-semibold text-white/80">{persona.style}</p>
                  </div>

                  {/* Focus Areas */}
                  <div className="mb-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2.5">Focus Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {persona.focus.map(f => (
                        <span key={f} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-white/60">{f}</span>
                      ))}
                    </div>
                  </div>

                  {/* Prompt */}
                  <div className="p-3.5 rounded-2xl bg-white/3 border border-white/5">
                    <p className="text-xs text-white/50 leading-relaxed italic">"{persona.prompt}"</p>
                  </div>

                  {/* Live indicator */}
                  <div className="flex items-center gap-2 mt-5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-white/30 font-medium">Ready to interview</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-[2rem] border border-white/5 bg-white/2 p-7 min-h-[340px] flex flex-col items-center justify-center gap-4"
                >
                  <div className="w-16 h-16 rounded-3xl border border-white/8 bg-white/3 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-white/20 text-center font-medium">Your AI interviewer<br />will appear here</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>

    {/* ── Resume Upload Modals ── */}
    <AnimatePresence>
      {resumeModal && (
        <motion.div
          key="resume-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => { if (!resumeUploading) setResumeModal(null); }}
        >
          <motion.div
            key="resume-modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#0e0e16] p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 mx-auto ${resumeModal === 'replace' ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-violet-500/15 border border-violet-500/30'}`}>
              <span className={`material-symbols-outlined text-xl ${resumeModal === 'replace' ? 'text-amber-400' : 'text-violet-400'}`}>
                {resumeModal === 'replace' ? 'warning' : 'save'}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-white font-bold text-center text-base mb-2">
              {resumeModal === 'replace'
                ? 'Replace existing resume?'
                : 'Save resume to your profile?'}
            </h3>

            {/* Body */}
            <p className="text-white/50 text-center text-xs leading-relaxed mb-6">
              {resumeModal === 'replace'
                ? "You already have a resume saved. Uploading this file will replace it and re-personalize your AI questions."
                : "Your resume isn't saved yet. Save it to your profile so you can use Resume mode in future interviews without uploading again."}
            </p>

            {/* Buttons */}
            {resumeModal === 'replace' ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setResumeModal(null)}
                  disabled={resumeUploading}
                  className="flex-1 py-2.5 rounded-2xl border border-white/10 text-white/50 text-xs font-bold hover:bg-white/5 transition-all disabled:opacity-40"
                >
                  Keep existing
                </button>
                <button
                  onClick={async () => {
                    const file = pendingFileRef.current;
                    if (!file) return;
                    setResumeUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append('resume', file);
                      await API.post('/upload-resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      setHasResume(true);
                      setUseResumeQuestions(true);
                    } catch { /* silently fail */ }
                    setResumeUploading(false);
                    setResumeModal(null);
                    pendingFileRef.current = null;
                  }}
                  disabled={resumeUploading}
                  className="flex-1 py-2.5 rounded-2xl bg-amber-500/90 text-black text-xs font-black hover:bg-amber-400 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {resumeUploading
                    ? <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Uploading…</>
                    : <><span className="material-symbols-outlined text-sm">upload_file</span> Yes, replace</>}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    const file = pendingFileRef.current;
                    if (!file) return;
                    setResumeUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append('resume', file);
                      await API.post('/upload-resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      setHasResume(true);
                      setUseResumeQuestions(true);
                    } catch { /* silently fail */ }
                    setResumeUploading(false);
                    setResumeModal(null);
                    pendingFileRef.current = null;
                  }}
                  disabled={resumeUploading}
                  className="w-full py-2.5 rounded-2xl bg-violet-600 text-white text-xs font-black hover:bg-violet-500 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {resumeUploading
                    ? <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Saving…</>
                    : <><span className="material-symbols-outlined text-sm">save</span> Save to profile &amp; use now</>}
                </button>
                <button
                  onClick={async () => {
                    const file = pendingFileRef.current;
                    if (!file) return;
                    setResumeUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append('resume', file);
                      await API.post('/upload-resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      setHasResume(true);
                      setUseResumeQuestions(true);
                    } catch { /* silently fail */ }
                    setResumeUploading(false);
                    setResumeModal(null);
                    pendingFileRef.current = null;
                  }}
                  disabled={resumeUploading}
                  className="w-full py-2.5 rounded-2xl border border-white/10 text-white/50 text-xs font-bold hover:bg-white/5 transition-all disabled:opacity-40"
                >
                  Just use for this session only
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
