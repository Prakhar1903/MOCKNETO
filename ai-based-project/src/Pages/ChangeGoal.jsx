
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserGoal } from '../context/UserGoalContext.jsx';
import { ONBOARDING_ROLES, ONBOARDING_COMPANIES } from '../data/mockData.js';

const CHIPS = [
  { key: 'targetRole', label: 'Target Role', icon: 'work' },
  { key: 'companies', label: 'Target Companies', icon: 'business' },
  { key: 'experienceLevel', label: 'Experience Level', icon: 'signal_cellular_alt' },
  { key: 'interviewDate', label: 'Interview Date', icon: 'calendar_month' },
  { key: 'schedule', label: 'Practice Schedule', icon: 'schedule' },
];

const LEVELS = ['Entry', 'Mid', 'Senior', 'Lead'];
const SCHEDULES = ['Light', 'Regular', 'Intensive'];

const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
      active ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-white'
    }`}>
    {children}
  </button>
);

const EditField = ({ fieldKey, value, onChange }) => {
  const [companyInput, setCompanyInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  if (fieldKey === 'targetRole') {
    return (
      <div className="relative mt-4">
        <input value={value || ''} onChange={e => { onChange(e.target.value); setSuggestions(e.target.value.length > 1 ? ONBOARDING_ROLES.filter(r => r.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5) : []); }}
          placeholder="e.g. Software Engineer"
          className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 outline-none transition-all placeholder-gray-600" />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
            {suggestions.map(r => (
              <button key={r} onClick={() => { onChange(r); setSuggestions([]); }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">{r}</button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (fieldKey === 'companies') {
    const companies = Array.isArray(value) ? value : [];
    const addCompany = (c) => { const t = c.trim(); if (t && !companies.includes(t)) { onChange([...companies, t]); } setCompanyInput(''); };
    return (
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {companies.map(c => (
            <span key={c} onClick={() => onChange(companies.filter(x => x !== c))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[11px] font-bold cursor-pointer hover:bg-rose-500/10 hover:text-rose-300 transition-all group">
              {c} <span className="opacity-0 group-hover:opacity-100 text-xs">×</span>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={companyInput} onChange={e => setCompanyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCompany(companyInput)}
            placeholder="Type company + Enter" list="cg-company-list"
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 outline-none transition-all placeholder-gray-600" />
          <datalist id="cg-company-list">{ONBOARDING_COMPANIES.map(c => <option key={c} value={c} />)}</datalist>
          <button onClick={() => addCompany(companyInput)} className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-400 font-black hover:bg-violet-600/30 transition-colors">+</button>
        </div>
      </div>
    );
  }

  if (fieldKey === 'experienceLevel') {
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {LEVELS.map(l => <Pill key={l} active={value === l} onClick={() => onChange(l)}>{l}</Pill>)}
      </div>
    );
  }

  if (fieldKey === 'interviewDate') {
    return (
      <input type="date" value={value || ''} onChange={e => onChange(e.target.value)}
        className="mt-4 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 outline-none transition-all w-full" />
    );
  }

  if (fieldKey === 'schedule') {
    return (
      <div className="flex gap-2 mt-4 flex-wrap">
        {SCHEDULES.map(s => <Pill key={s} active={value === s} onClick={() => onChange(s)}>{s}</Pill>)}
      </div>
    );
  }

  return null;
};

const formatValue = (key, val) => {
  if (!val || (Array.isArray(val) && val.length === 0)) return '—';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
};

const ChangeGoal = () => {
  const navigate = useNavigate();
  const { goal, setGoal } = useUserGoal();
  const [screen, setScreen] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [draft, setDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleChip = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); const d = { ...draft }; delete d[key]; setDraft(d); }
      else { next.add(key); setDraft(p => ({ ...p, [key]: goal[key] })); }
      return next;
    });
  };

  const updateDraft = (key, val) => setDraft(p => ({ ...p, [key]: val }));

  const handleConfirm = async () => {
    if (selected.size === 0) return;
    setIsSaving(true);
    await setGoal(draft);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-emerald-400 text-3xl">check_circle</span>
          </div>
          <h2 className="text-xl font-black text-white mb-2">Plan Updated!</h2>
          <p className="text-gray-400 text-sm">Redirecting to dashboard…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="text-white px-4 md:px-8 max-w-3xl mx-auto pt-8 pb-32">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400 mb-2">Goal Settings</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Update Your <span className="text-white/25">Goal.</span></h1>
      </motion.div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-8">
        {['What changed?', 'Confirm'].map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center border ${screen > i + 1 ? 'bg-emerald-500 border-emerald-400 text-white' : screen === i + 1 ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                {screen > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-bold ${screen === i + 1 ? 'text-white' : 'text-gray-500'}`}>{s}</span>
            </div>
            {i < 1 && <div className="flex-1 h-px bg-white/10" />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {screen === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="text-gray-400 text-sm mb-6">Select what you'd like to update. Each chip expands into an edit field.</p>
            <div className="space-y-3">
              {CHIPS.map(chip => (
                <div key={chip.key} className={`rounded-2xl border transition-all overflow-hidden ${selected.has(chip.key) ? 'border-violet-500/40 bg-violet-600/5' : 'border-white/[0.06] bg-[#111111]'}`}>
                  <button onClick={() => toggleChip(chip.key)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-violet-400 text-lg">{chip.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{chip.label}</p>
                        <p className="text-[11px] text-gray-500">{formatValue(chip.key, goal[chip.key])}</p>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined text-gray-500 transition-transform ${selected.has(chip.key) ? 'rotate-180 text-violet-400' : ''}`}>expand_more</span>
                  </button>
                  <AnimatePresence>
                    {selected.has(chip.key) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-6 pb-6">
                          <EditField fieldKey={chip.key} value={draft[chip.key] ?? goal[chip.key]} onChange={(v) => updateDraft(chip.key, v)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-bold hover:bg-white/10 transition-all">← Back</button>
              <button onClick={() => setScreen(2)} className="flex-1 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 active:scale-95 transition-all">
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {screen === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="text-gray-400 text-sm mb-6">Review your changes before updating.</p>

            {selected.size === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-8 text-center">
                <p className="text-gray-400 text-sm">No fields selected. Go back and pick something to change.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {CHIPS.filter(c => selected.has(c.key)).map(chip => (
                  <div key={chip.key} className="rounded-2xl border border-white/[0.06] bg-[#111111] p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">{chip.label}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 p-3 rounded-xl bg-black/30 border border-white/5">
                        <p className="text-[10px] text-gray-500 mb-1">Before</p>
                        <p className="text-sm text-gray-400 line-through">{formatValue(chip.key, goal[chip.key])}</p>
                      </div>
                      <span className="material-symbols-outlined text-violet-500">arrow_forward</span>
                      <div className="flex-1 p-3 rounded-xl bg-violet-600/10 border border-violet-500/20">
                        <p className="text-[10px] text-violet-400 mb-1">After</p>
                        <p className="text-sm text-white font-bold">{formatValue(chip.key, draft[chip.key])}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button onClick={() => setScreen(1)} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-bold hover:bg-white/10 transition-all">← Back</button>
              <button
                onClick={handleConfirm}
                disabled={selected.size === 0 || isSaving}
                className="flex-1 py-3 rounded-xl bg-violet-600 text-white text-sm font-black hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {isSaving ? 'Saving…' : 'Update My Plan →'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ChangeGoal;
