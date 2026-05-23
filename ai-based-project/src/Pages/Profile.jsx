import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api.jsx';

const Profile = () => {
  const [user, setUser] = useState({
    name: 'Alex Harrison',
    email: 'alex@example.com',
    role: 'Senior Frontend Engineer',
    experience: 'Senior',
    skills: ['React', 'TypeScript', 'System Design', 'Node.js'],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('user') || '{}');
    const name = local.UserName || local.name;
    const email = local.Email || local.email;
    if (name || email) setUser(p => ({ ...p, ...(name && { name }), ...(email && { email }) }));
  }, []);

  const getInitials = (name) =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const prev = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...prev, name: user.name, email: user.email }));
      setMessage('✓ Saved successfully');
    } catch {
      setMessage('Save failed. Please retry.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !user.skills.includes(s)) {
      setUser(p => ({ ...p, skills: [...p.skills, s] }));
      setNewSkill('');
    }
  };

  const removeSkill = (s) => setUser(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const completion = 85;

  return (
    <main className="text-white px-4 md:px-8 max-w-7xl mx-auto pt-8 pb-32">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 mb-2">User Identity</p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Your <span className="text-white/25">Profile.</span>
        </h1>
      </motion.div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── LEFT: Profile Identity Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-4 rounded-3xl bg-[#111111] border border-white/[0.06] p-8 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl bg-gradient-to-r from-violet-600 via-cyan-400 to-violet-600" />

          {/* Avatar */}
          <div className="relative mt-4 mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 p-[3px]">
              <div className="w-full h-full rounded-full bg-[#0c0c0c] flex items-center justify-center text-2xl font-black text-white">
                {getInitials(user.name)}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-1 w-10 h-10 rounded-full bg-[#111111] border border-[#111111] flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-400 text-lg">verified</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-white leading-tight mb-1">{user.name}</h2>
          <p className="text-sm text-gray-400 mb-8">{user.email}</p>

          {/* Completion bar */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Profile Completion</span>
              <span className="text-xs font-black text-cyan-400">{completion}%</span>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full border border-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${completion}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400"
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="w-full mt-8 pt-6 border-t border-white/[0.04] grid grid-cols-2 gap-4">
            {[
              { label: 'Interviews', value: '24', icon: 'forum' },
              { label: 'Best Score', value: '92%', icon: 'grade' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-black/30 border border-white/5">
                <span className="material-symbols-outlined text-violet-400 text-xl">{s.icon}</span>
                <p className="text-lg font-black text-white">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Personal Info */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-3xl bg-[#111111] border border-white/[0.06] p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-6">Personal Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              {[
                { label: 'Username', key: 'name', type: 'text' },
                { label: 'Contact Email', key: 'email', type: 'email' },
              ].map(({ label, key, type }) => (
                <div key={key} className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</label>
                  <input type={type} value={user[key]}
                    onChange={e => setUser(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3.5 text-sm text-white focus:border-violet-500/40 outline-none transition-all placeholder-gray-600"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <button onClick={handleSave} disabled={isSaving}
                className="px-7 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-[11px] font-black uppercase tracking-[0.18em] transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50">
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
              {message && (
                <span className={`text-xs font-bold ${message.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>{message}</span>
              )}
            </div>
          </motion.div>

          {/* Career + Skills — 2-col row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-3xl bg-[#111111] border border-white/[0.06] p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-6">Career Target</p>
              <div className="space-y-3">
                {[
                  { label: 'Target Role', value: user.role },
                  { label: 'Experience Level', value: user.experience },
                ].map(item => (
                  <div key={item.label} className="p-4 rounded-2xl bg-black/30 border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">{item.label}</p>
                    <p className="text-sm font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-3xl bg-[#111111] border border-white/[0.06] p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-5">Technical Skills</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {user.skills.map(s => (
                  <span key={s} onClick={() => removeSkill(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 border border-white/[0.06] text-[10px] font-bold text-gray-300 hover:border-rose-500/30 hover:text-rose-400 transition-all cursor-pointer group">
                    {s}
                    <span className="opacity-0 group-hover:opacity-100 text-xs">×</span>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  placeholder="Add skill…"
                  className="flex-1 min-w-0 bg-black/30 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-violet-500/40 outline-none transition-all"
                />
                <button onClick={addSkill}
                  className="px-3 py-2 rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-400 text-xs font-black hover:bg-violet-600/30 transition-colors">
                  +
                </button>
              </div>
            </motion.div>
          </div>

          {/* AI Insight Card */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-3xl bg-[#111111] border border-violet-500/15 p-8 relative overflow-hidden group hover:border-violet-500/25 transition-all">
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-violet-600/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-violet-600/15 transition-all" />
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-violet-400">psychology</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-2">AI Talent Assessment</p>
                <p className="text-sm font-bold text-white mb-2">Personalized Insights</p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  <span className="text-emerald-400 font-bold">Strengths: </span>Deep React knowledge, strong architectural thinking.<br />
                  <span className="text-orange-400 font-bold">Growth areas: </span>Performance optimization at scale, data structures.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
};

export default Profile;