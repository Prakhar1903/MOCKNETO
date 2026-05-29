import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api.jsx';
import { useUserGoal } from '../context/UserGoalContext.jsx';

const Profile = () => {
  const navigate = useNavigate();
  const { goal } = useUserGoal();
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
  const [resumeState, setResumeState] = useState('idle'); // idle | uploading | success | error
  const [resumePreview, setResumePreview] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);

  const [historyCount, setHistoryCount] = useState(0);
  const [profileResumePreview, setProfileResumePreview] = useState(''); // text preview from DB

  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('user') || '{}');
    const name = local.UserName || local.name;
    const email = local.Email || local.email;
    if (name || email) setUser(p => ({ ...p, ...(name && { name }), ...(email && { email }) }));

    // Fetch resume + history from backend
    API.get('/me')
      .then(res => {
        const text = res.data?.user?.resumeText;
        if (text && text.trim().length > 10) {
          setProfileResumePreview(text);
          setResumeState('success');
          setResumeFileName('Resume on file');
          setResumePreview(text.substring(0, 200) + '...');
        }
      })
      .catch(err => console.error('Error fetching /me on profile:', err));

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    fetch('/api/interview/history', { credentials: 'include', headers })
      .then(res => res.json())
      .then(data => {
        if (data && data.history) {
          setHistoryCount(data.history.length);
        }
      })
      .catch(err => console.error("Error fetching history for profile", err));
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

  const handleResumeUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setResumeState('error');
      setResumePreview('Only PDF files are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResumeState('error');
      setResumePreview('File size must be under 5MB.');
      return;
    }
    setResumeState('uploading');
    setResumeFileName(file.name);
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const res = await API.post('/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data;
      setResumeState('success');
      setResumeFileName(file.name);
      setResumePreview(data.resumeTextPreview || 'Resume parsed successfully.');
      setProfileResumePreview(data.resumeTextPreview || '');
    } catch {
      setResumeState('error');
      setResumePreview('Upload failed. Please try again.');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleResumeUpload(file);
  };

  const completion = 85;

  return (
    <main className="text-white px-4 md:px-8 max-w-6xl mx-auto pt-8 pb-32">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400 mb-1.5">User Identity</p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Your <span className="text-white/20">Profile.</span>
        </h1>
      </motion.div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

        {/* ── LEFT: Profile Identity Card ── */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-3xl bg-[#111111] border border-white/[0.06] p-7 flex flex-col items-center text-center relative overflow-hidden"
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
          </div>

          <h2 className="text-2xl font-black text-white leading-tight mb-1 capitalize">{user.name}</h2>
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
          <div className="w-full mt-8 pt-6 border-t border-white/[0.04] grid grid-cols-3 gap-3">
            {[
              { label: 'Interviews', value: String(historyCount || 0), icon: 'forum', onClick: () => navigate('/reports') },
              { label: 'Best Score', value: '92%', icon: 'grade' },
              { label: 'Time', value: '18h', icon: 'timer' },
            ].map(s => (
              <div 
                key={s.label} 
                onClick={s.onClick || null}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-black/30 border border-white/5 ${s.onClick ? 'cursor-pointer hover:border-violet-500/35 hover:bg-violet-500/5 transition-all' : ''}`}
              >
                <span className="material-symbols-outlined text-violet-400 text-[18px]">{s.icon}</span>
                <p className="text-base font-black text-white">{s.value}</p>
                <p className="text-[8px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">{s.label}</p>
              </div>
            ))}
          </div>
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-6">

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
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Career Target</p>
                <button onClick={() => navigate('/change-goal')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/15 border border-violet-500/20 text-violet-400 text-[10px] font-black hover:bg-violet-600/25 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-xs">edit</span> Update Goal
                </button>
              </div>
              <div className="space-y-0">
                {[
                  { label: 'Goal', value: goal?.goalType === 'campus' ? 'Campus Placement' : goal?.goalType === 'job' ? 'Job Interview' : goal?.goalType === 'promotion' ? 'Promotion' : goal?.goalType === 'switch' ? 'Career Switch' : goal?.goalType === 'exploring' ? 'Just Exploring' : '—' },
                  { label: goal?.goalType === 'campus' ? 'College' : 'Role', value: goal?.goalType === 'campus' ? (goal?.college || '—') : (goal?.targetRole || user.role) },
                  { label: goal?.goalType === 'campus' ? 'Grad Year' : 'Experience', value: goal?.goalType === 'campus' ? (goal?.graduationYear || '—') : (goal?.experienceLevel || user.experience) },
                  ...(goal?.interviewDate ? [{ label: 'Target Date', value: goal.interviewDate }] : []),
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 flex-shrink-0">{item.label}</p>
                    <div className="flex-1 border-b border-dashed border-white/10" />
                    <p className="text-sm font-bold text-white text-right truncate max-w-[150px]">{item.value}</p>
                  </div>
                ))}
                {goal?.companies?.length > 0 && (
                  <div className="pt-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Companies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {goal.companies.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded-lg bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[10px] font-bold">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-3xl bg-[#111111] border border-white/[0.06] p-8 flex flex-col h-full">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-4">Technical Skills</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {user.skills.map(s => (
                  <span key={s} onClick={() => removeSkill(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 border border-white/[0.06] text-[10px] font-bold text-gray-300 hover:border-rose-500/30 hover:text-rose-400 transition-all cursor-pointer group">
                    {s}
                    <span className="opacity-0 group-hover:opacity-100 text-xs">×</span>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-auto">
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

          {/* AI Assessment — full width, compact */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-3xl bg-[#111111] border border-violet-500/15 p-8 relative overflow-hidden group hover:border-violet-500/25 transition-all">
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-violet-600/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-violet-600/15 transition-all" />
            <div className="flex items-start gap-5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-violet-400 text-xl">psychology</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-2">AI Talent Assessment</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                  <p className="text-sm text-gray-400">
                    <span className="text-emerald-400 font-bold">Strengths: </span>
                    {goal?.strongestArea ? `Solid foundation in ${goal.strongestArea}.` : 'Deep React knowledge, strong architectural thinking.'}
                  </p>
                  <p className="text-sm text-gray-400">
                    <span className="text-orange-400 font-bold">Growth areas: </span>
                    {goal?.weakestArea ? `Needs focus on ${goal.weakestArea}.` : 'Performance optimization at scale, data structures.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Schedule + Resume — single merged card */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-3xl bg-[#111111] border border-white/[0.06] p-8">
            <div className="flex items-start gap-0 flex-wrap sm:flex-nowrap">
              {/* Practice Schedule */}
              <div className="flex-1 min-w-0 pr-8">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-3">Practice Schedule</p>
                <div className="flex items-center gap-4 bg-black/30 border border-white/5 rounded-2xl px-4 py-3">
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-0.5">Frequency</p>
                    <p className="text-sm font-bold text-white">{goal?.schedule || 'Not set'}</p>
                  </div>
                  <div className="w-px h-7 bg-white/10 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-0.5">Session</p>
                    <p className="text-sm font-bold text-white">{goal?.sessionLength ? `${goal.sessionLength} min` : 'Not set'}</p>
                  </div>
                </div>
              </div>
              {/* Vertical divider */}
              <div className="hidden sm:block w-px self-stretch bg-white/[0.05] mx-0" />
              {/* Resume Upload Card */}
              <div className="flex-1 min-w-0 pl-8 sm:pl-8 pt-5 sm:pt-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 mb-3">Resume for AI Questions</p>
                <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); }} />

                {resumeState === 'idle' || resumeState === 'error' ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl px-4 py-4 cursor-pointer transition-all text-center ${
                      isDragging ? 'border-violet-500/70 bg-violet-500/10' : 'border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5'
                    }`}>
                    <span className="material-symbols-outlined text-2xl text-white/20 block mb-1">{resumeState === 'error' ? 'error' : 'upload_file'}</span>
                    <p className="text-xs font-bold text-white/40">{resumeState === 'error' ? resumePreview : 'Drop PDF or click to upload'}</p>
                    <p className="text-[10px] text-white/20 mt-0.5">Max 5MB · PDF only</p>
                  </div>
                ) : resumeState === 'uploading' ? (
                  <div className="flex items-center gap-3 bg-black/30 border border-white/5 rounded-2xl px-4 py-3 animate-pulse">
                    <span className="material-symbols-outlined text-violet-400 text-xl">hourglass_top</span>
                    <div>
                      <p className="text-xs font-bold text-white/70">Parsing resume…</p>
                      <p className="text-[10px] text-white/30">{resumeFileName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/8 border border-emerald-500/25 rounded-2xl px-4 py-3.5 space-y-2.5">
                    {/* Top row: icon + name + replace */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                        <div>
                          <p className="text-xs font-bold text-emerald-300 leading-none">{resumeFileName}</p>
                          <p className="text-[9px] text-white/30 mt-0.5">
                            {profileResumePreview
                              ? `~${profileResumePreview.trim().split(/\s+/).length.toLocaleString()} words parsed`
                              : 'Saved to your profile'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-violet-500/15 border border-violet-500/20 text-violet-400">
                          AI Ready
                        </span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] text-white/30 hover:text-violet-400 transition-colors font-bold"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                    {/* Text preview snippet */}
                    {resumePreview && (
                      <div className="bg-black/30 rounded-xl px-3 py-2 border border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Preview</p>
                        <p className="text-[10px] text-white/40 leading-relaxed line-clamp-3">{resumePreview}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
};

export default Profile;