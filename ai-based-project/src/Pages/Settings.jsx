import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import { useUserGoal } from '../context/UserGoalContext.jsx';
import API from '../api.jsx';
import { motion } from 'framer-motion';

const SETTINGS_KEY = 'appSettings';

const defaultSettings = {
  emailNotifications: true,
  defaultDifficulty: 'Medium',
  preferredLanguage: 'English',
  autoPlayVoice: true,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...(JSON.parse(raw) || {}) };
  } catch { return defaultSettings; }
}

function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { goal, clearOnboarding } = useUserGoal();
  const [settings, setSettings] = useState(() => loadSettings());
  const [message, setMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState({ name: 'User', email: 'user@example.com', initials: 'U' });

  useEffect(() => { saveSettings(settings); }, [settings]);

  useEffect(() => {
    (async () => {
      try {
        setIsSyncing(true);
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        const name = u.UserName || u.name || 'User';
        const parts = name.trim().split(/\s+/).filter(Boolean);
        const initials = parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
        setUser({ name, email: u.Email || u.email || 'user@example.com', initials: initials || 'U' });
        const res = await API.get('/me');
        const backend = res?.data?.user?.settings;
        if (backend) setSettings(s => ({ ...s, ...backend }));
      } catch {} finally { setIsSyncing(false); }
    })();
  }, [setTheme]);

  useEffect(() => {
    const t = setTimeout(async () => {
      try { setIsSyncing(true); await API.put('/me', { settings: { ...settings, theme } }); }
      catch {} finally { setIsSyncing(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [settings, theme]);

  const showToast = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  return (
    <main className="text-white px-6 md:px-10 pt-8 pb-28 w-full">

      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 mb-2">Configuration</p>
        <div className="flex items-center gap-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Settings</h1>
          {isSyncing && (
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="material-symbols-outlined text-gray-600 text-2xl">sync</motion.span>
          )}
        </div>
        <p className="text-gray-400 mt-3 text-sm max-w-lg">Manage your preferences, interview settings, and appearance.</p>
      </motion.div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-bold shadow-2xl backdrop-blur-md">
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Account — spans 2 cols */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-3xl bg-[#111111] border border-white/[0.06] p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-6">Account Details</p>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center text-xl font-black text-white">
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold text-white truncate">{user.name}</p>
              <p className="text-sm text-gray-400 truncate">{user.email}</p>
            </div>
            <span className="px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest flex-shrink-0">
              PRO
            </span>
          </div>
        </motion.div>

        {/* Appearance — 1 col */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-3xl bg-[#111111] border border-white/[0.06] p-8 flex flex-col gap-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Appearance</p>
          <div className="flex-1 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-black/30 border border-white/5">
              <span className="material-symbols-outlined text-cyan-400">display_settings</span>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Active Theme</p>
                <p className="text-sm font-bold text-white capitalize">{theme === 'system' ? `System (${resolvedTheme})` : theme}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-black/30 rounded-xl p-1 border border-white/5">
              {['light', 'dark', 'system'].map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${theme === t ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Interview Prefs — spans 2 cols */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-3xl bg-[#111111] border border-white/[0.06] p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-6">Interview Preferences</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <SettingSelect label="Default Difficulty" options={['Easy', 'Medium', 'Hard']} value={settings.defaultDifficulty}
              onChange={v => setSettings(s => ({ ...s, defaultDifficulty: v }))} />
            <SettingSelect label="Preferred Language" options={['English', 'Spanish', 'French', 'German']} value={settings.preferredLanguage}
              onChange={v => setSettings(s => ({ ...s, preferredLanguage: v }))} />
          </div>
          <div className="pt-6 border-t border-white/[0.04]">
            <SettingToggle label="Auto-play AI Voice" desc="Automatically read responses aloud during interviews."
              checked={!!settings.autoPlayVoice} onChange={v => setSettings(s => ({ ...s, autoPlayVoice: v }))} />
          </div>
        </motion.div>

        {/* Notifications — 1 col */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-3xl bg-[#111111] border border-white/[0.06] p-8 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-6">Notifications</p>
          <SettingToggle label="Email Alerts" desc="Weekly digests and interview reminders."
            checked={!!settings.emailNotifications} onChange={v => setSettings(s => ({ ...s, emailNotifications: v }))} />
        </motion.div>

        {/* Goal & Preferences — full width */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="lg:col-span-3 rounded-3xl bg-[#111111] border border-violet-500/10 p-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Goal &amp; Preferences</p>
            <button onClick={() => navigate('/change-goal')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/15 border border-violet-500/20 text-violet-400 text-[10px] font-black hover:bg-violet-600/25 transition-all active:scale-95">
              <span className="material-symbols-outlined text-xs">edit</span> Update My Goal
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Target Role', value: goal?.targetRole || '—' },
              { label: 'Experience', value: goal?.experienceLevel || '—' },
              { label: 'Interview Date', value: goal?.interviewDate || '—' },
            ].map(item => (
              <div key={item.label} className="p-4 rounded-2xl bg-black/30 border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">{item.label}</p>
                <p className="text-sm font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
          {goal?.companies?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {goal.companies.map(c => (
                <span key={c} className="px-3 py-1 rounded-lg bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[10px] font-bold">{c}</span>
              ))}
            </div>
          )}
          <button
            onClick={() => { clearOnboarding(); navigate('/onboarding'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-white/20 transition-all active:scale-95">
            <span className="material-symbols-outlined text-sm">refresh</span> Re-run Full Onboarding
          </button>
        </motion.div>

        {/* Danger Zone — full width */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-3 rounded-3xl bg-[#111111] border border-rose-500/10 p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-6">Danger Zone</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10">
              <div>
                <p className="text-sm font-bold text-white">Clear History</p>
                <p className="text-xs text-gray-500 mt-1">Remove all local interview cache.</p>
              </div>
              <button onClick={() => { try { localStorage.removeItem('interviewFeedback'); showToast('History cleared.'); } catch {} }}
                className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-colors flex-shrink-0">
                Clear
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-orange-500/5 border border-orange-500/10">
              <div>
                <p className="text-sm font-bold text-white">Factory Reset</p>
                <p className="text-xs text-gray-500 mt-1">Restore all settings to defaults.</p>
              </div>
              <button onClick={() => { setSettings(defaultSettings); setTheme('system'); showToast('Settings reset.'); }}
                className="px-5 py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest transition-colors flex-shrink-0">
                Reset
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </main>
  );
};

const AnimatePresence = ({ children }) => <>{children}</>;

const SettingToggle = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-bold text-white">{label}</p>
      {desc && <p className="text-xs text-gray-500 mt-1">{desc}</p>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange?.(e.target.checked)} />
      <div className="w-12 h-6 rounded-full bg-neutral-800 border border-white/5 peer-checked:bg-violet-600 peer-checked:border-violet-500 relative transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:rounded-full after:bg-gray-400 after:transition-all peer-checked:after:translate-x-[22px] peer-checked:after:bg-white" />
    </label>
  </div>
);

const SettingSelect = ({ label, options, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label>
    <div className="relative">
      <select value={value} onChange={e => onChange?.(e.target.value)}
        className="appearance-none w-full bg-black/30 border border-white/[0.06] text-white text-sm font-medium rounded-xl px-4 pr-10 py-3 focus:border-violet-500/50 focus:outline-none transition-all">
        {options.map(o => <option key={o} value={o} className="bg-neutral-900">{o}</option>)}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-lg">unfold_more</span>
    </div>
  </div>
);

export default Settings;