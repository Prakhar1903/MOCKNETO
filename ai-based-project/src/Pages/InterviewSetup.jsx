import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

const PREMIUM_COMPANIES = ['Google', 'Amazon', 'Microsoft', 'MS', 'Netflix', 'Meta', 'Apple', 'Adobe', 'Uber', 'Airbnb'];
const BUILT_IN_BANK = ['Google', 'Amazon', 'Microsoft', 'MS'];

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
  { id: 'entry', label: 'Entry Level', icon: '🌱' },
  { id: 'mid', label: 'Mid Level', icon: '⚡' },
  { id: 'senior', label: 'Senior Level', icon: '🏆' },
  { id: 'lead', label: 'Lead / Manager', icon: '👑' },
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
  const inputRef = useRef(null);

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
    const config = { company, jobRole, level, focusArea, track, mbaSpecialization: 'marketing', personaIdx };
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

  const modeOptions = [
    { id: 'chat', label: 'Chat', icon: '💬', desc: 'Text-based AI simulation' },
    { id: 'video', label: 'Video', icon: '📹', desc: 'Face-to-face AI mock' },
    { id: 'voice', label: 'Voice', icon: '🎙️', desc: 'Audio-only focus mode' },
  ];

  return (
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

        {/* Top bar */}
        <motion.div {...fadeUp(0)} className="flex items-center justify-between mb-16">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Interview Simulation</span>
            <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">War Room</h1>
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
                const done = step > i;
                const active = step === i;
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
            {RESUME_CARDS.length > 0 && (
              <div className="mt-10">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">Resume Prep</p>
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
              </div>
            )}
          </motion.div>

          {/* ── CENTER: Main Interaction ── */}
          <div className="space-y-6">

            {/* Company Search — always visible */}
            <motion.div {...fadeUp(0.15)}>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 mb-3">
                Step 1 · Target Company
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <span className="text-2xl">🎯</span>
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
                  className="w-full pl-16 pr-32 py-6 text-xl font-semibold bg-white/3 border border-white/8 rounded-3xl outline-none placeholder-white/20 focus:border-violet-500/60 focus:bg-violet-500/5 focus:shadow-[0_0_40px_rgba(139,92,246,0.12)] transition-all duration-300"
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
                          <span className="font-bold">{c}</span>
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
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 mb-3">
                    Step 2 · Interview Mode
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {modeOptions.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`relative p-5 rounded-2xl border text-left transition-all duration-300 group overflow-hidden ${
                          mode === m.id
                            ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                            : 'border-white/8 bg-white/3 hover:border-violet-500/40 hover:bg-violet-500/5'
                        }`}
                      >
                        {mode === m.id && <div className="absolute inset-0 bg-violet-500/5" />}
                        <span className="text-3xl block mb-3">{m.icon}</span>
                        <p className="font-bold text-white text-sm">{m.label}</p>
                        <p className="text-[11px] text-white/40 mt-1">{m.desc}</p>
                        {mode === m.id && (
                          <motion.div layoutId="modeCheck" className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </motion.div>
                        )}
                      </button>
                    ))}
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
                  className="space-y-6"
                >
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">
                    Step 3 · Role & Preferences
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Role Dropdown */}
                    <div className="col-span-2 relative">
                      <button
                        onClick={() => setShowRoleDrop(!showRoleDrop)}
                        className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/3 border border-white/8 hover:border-violet-500/40 transition-all text-left group"
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
                        className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/3 border border-white/8 hover:border-violet-500/40 transition-all text-left group"
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Level</span>
                          <span className="font-bold text-white flex items-center gap-2">
                            {LEVEL_OPTIONS.find(l => l.id === level)?.icon} {LEVEL_OPTIONS.find(l => l.id === level)?.label}
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
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                                  level === l.id ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-white/5 text-white/70'
                                }`}
                              >
                                <span className="text-lg">{l.icon}</span>
                                <span className="font-semibold">{l.label}</span>
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
                        className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/3 border border-white/8 hover:border-violet-500/40 transition-all text-left group"
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
                  <div className="flex items-center gap-3">
                    {['Tech / Software', 'MBA'].map((t, i) => {
                      const val = i === 0 ? 'tech' : 'mba';
                      return (
                        <button
                          key={t}
                          onClick={() => { setTrack(val); setFocusArea(FOCUS_OPTS[val][0]); }}
                          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                            track === val ? 'bg-violet-500 border-violet-400 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'border-white/10 text-white/30 hover:text-white/60'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
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
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-violet-400 mb-3">
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
                  <motion.button
                    onClick={handleStart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.3)', '0 0 40px rgba(139,92,246,0.5)', '0 0 20px rgba(139,92,246,0.3)'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg tracking-wide flex items-center justify-center gap-3 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative z-10">🚀</span>
                    <span className="relative z-10">Enter the War Room</span>
                    <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </motion.button>
                  <p className="text-center text-xs text-white/30 mt-3">
                    {hintCredits} hint credits · 5 questions · ~20 min session
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

                  {/* Badge */}
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-5"
                    style={{ backgroundColor: `${persona.color}20`, color: persona.color, border: `1px solid ${persona.color}40` }}
                  >
                    {persona.badge} Interviewer
                  </span>

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
  );
}
