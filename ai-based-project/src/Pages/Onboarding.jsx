
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserGoal } from '../context/UserGoalContext.jsx';
import { ONBOARDING_ROLES, ONBOARDING_COMPANIES } from '../data/mockData.js';
import API from '../api.jsx';

const STEPS = ['Your Goal', 'Your Background', 'Your Schedule'];

const GOAL_TYPES = [
  { id: 'job', icon: '🎯', title: 'Job Interview', desc: 'Targeting a new role at a company' },
  { id: 'promotion', icon: '📈', title: 'Promotion', desc: 'Preparing for an internal review' },
  { id: 'switch', icon: '🔄', title: 'Career Switch', desc: 'Moving into a new field or role type' },
  { id: 'campus', icon: '🎓', title: 'Campus Placement', desc: 'Preparing for college placement drives' },
  { id: 'exploring', icon: '🧪', title: 'Just Exploring', desc: 'Practice without a specific target' },
];

const LEVELS = ['Entry', 'Mid', 'Senior', 'Lead'];
const AREAS = ['DSA', 'System Design', 'Behavioral', 'Communication', 'All Equal'];
const SCHEDULES = [
  { id: 'Light', label: 'Light', sub: '1–2x / week' },
  { id: 'Regular', label: 'Regular', sub: '3–4x / week' },
  { id: 'Intensive', label: 'Intensive', sub: 'Daily' },
];
const LENGTHS = ['15', '30', '45'];

const Pill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
      active
        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
        : 'bg-white/5 border-white/10 text-gray-400 hover:border-violet-500/40 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const LivePreview = ({ step1, companyInput }) => (
  <motion.div
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    className="hidden md:flex flex-col gap-4 sticky top-8 self-start w-full max-w-xs"
  >
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Preview</p>
    <div className="rounded-3xl bg-neutral-900/60 border border-white/10 p-6 backdrop-blur-xl space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-2xl">
        {GOAL_TYPES.find(g => g.id === step1.goalType)?.icon || '👤'}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Target Role</p>
        <p className="text-white font-bold">{step1.goalType === 'campus' ? 'Campus Placement' : step1.targetRole || '—'}</p>
      </div>
      {step1.goalType !== 'campus' && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Experience</p>
          <p className="text-white font-bold">{step1.experienceLevel || '—'}</p>
        </div>
      )}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Companies</p>
        <div className="flex flex-wrap gap-1.5">
          {step1.companies.length > 0 || companyInput
            ? <>
                {step1.companies.map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-lg bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[10px] font-bold">{c}</span>
                ))}
                {companyInput && (
                  <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold opacity-50">{companyInput}</span>
                )}
              </>
            : <span className="text-gray-600 text-xs">—</span>}
        </div>
      </div>
      {step1.interviewDate && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Interview Date</p>
          <p className="text-white font-bold">{step1.interviewDate}</p>
        </div>
      )}
    </div>
  </motion.div>
);

const Step1 = ({ data, onChange, companyInput, setCompanyInput }) => {
  const [roleSuggestions, setRoleSuggestions] = useState([]);

  const handleRoleInput = (v) => {
    onChange('targetRole', v);
    setRoleSuggestions(v.length > 1 ? ONBOARDING_ROLES.filter(r => r.toLowerCase().includes(v.toLowerCase())).slice(0, 5) : []);
  };

  const addCompany = (c) => {
    const trimmed = c.trim();
    if (trimmed && !data.companies.includes(trimmed)) onChange('companies', [...data.companies, trimmed]);
    setCompanyInput('');
  };

  const removeCompany = (c) => onChange('companies', data.companies.filter(x => x !== c));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">What's your goal?</p>
        <div className="grid grid-cols-2 gap-3">
          {GOAL_TYPES.map(g => (
            <button
              key={g.id}
              onClick={() => onChange('goalType', g.id)}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-95 ${
                data.goalType === g.id
                  ? 'bg-violet-600/20 border-violet-500/40 shadow-lg shadow-violet-500/10'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="text-2xl mb-2">{g.icon}</div>
              <p className="text-sm font-bold text-white">{g.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {data.goalType !== 'campus' && (
        <>
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Target Role</p>
            <input
              value={data.targetRole}
              onChange={e => handleRoleInput(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 outline-none transition-all placeholder-gray-600"
            />
            {roleSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                {roleSuggestions.map(r => (
                  <button key={r} onClick={() => { onChange('targetRole', r); setRoleSuggestions([]); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Experience Level</p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map(l => <Pill key={l} active={data.experienceLevel === l} onClick={() => onChange('experienceLevel', l)}>{l}</Pill>)}
            </div>
          </div>
        </>
      )}

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Target Companies</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {data.companies.map(c => (
            <span key={c} onClick={() => removeCompany(c)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[11px] font-bold cursor-pointer hover:bg-rose-500/15 hover:border-rose-500/20 hover:text-rose-300 transition-all group">
              {c} <span className="opacity-0 group-hover:opacity-100 text-xs">×</span>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={companyInput}
            onChange={e => setCompanyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCompany(companyInput)}
            placeholder="Type a company + Enter"
            list="company-suggestions"
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 outline-none transition-all placeholder-gray-600"
          />
          <datalist id="company-suggestions">
            {ONBOARDING_COMPANIES.map(c => <option key={c} value={c} />)}
          </datalist>
          <button onClick={() => addCompany(companyInput)}
            className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-400 font-black text-sm hover:bg-violet-600/30 transition-colors">
            +
          </button>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Interview Date <span className="text-gray-600 normal-case font-normal">(optional)</span></p>
        <input
          type="date"
          value={data.interviewDate}
          onChange={e => onChange('interviewDate', e.target.value)}
          className="bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 outline-none transition-all w-full"
        />
      </div>
    </div>
  );
};

const Step2 = ({ data, onChange, goalType }) => {
  const [uploadState, setUploadState] = useState('idle'); // idle | uploading | success | error
  const [isDragging, setIsDragging] = useState(false);
  const isCampus = goalType === 'campus';

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) { setUploadState('error'); return; }
    setUploadState('uploading');
    try {
      const form = new FormData();
      form.append('resume', file);
      await API.post('/upload-resume', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadState('success');
      onChange('resumeName', file.name);
    } catch {
      setUploadState('error');
    }
  };

  return (
    <div className="space-y-8">
      {isCampus ? (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">College / University</p>
          <input
            value={data.college || ''}
            onChange={e => onChange('college', e.target.value)}
            placeholder="e.g. Stanford University"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 outline-none transition-all placeholder-gray-600"
          />
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Current Role</p>
          <input
            value={data.currentRole || ''}
            onChange={e => onChange('currentRole', e.target.value)}
            placeholder="e.g. Junior Frontend Developer"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500/50 outline-none transition-all placeholder-gray-600"
          />
        </div>
      )}

      {isCampus ? (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Graduation Year</p>
          <div className="flex flex-wrap gap-2">
            {['2024', '2025', '2026', '2027'].map(y => (
              <Pill key={y} active={data.graduationYear === y} onClick={() => onChange('graduationYear', y)}>{y}</Pill>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
            Years of Experience — <span className="text-violet-400">{data.yearsOfExperience >= 10 ? '10+' : data.yearsOfExperience}</span>
          </p>
          <input
            type="range" min={0} max={10} value={data.yearsOfExperience || 0}
            onChange={e => onChange('yearsOfExperience', Number(e.target.value))}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1"><span>0</span><span>10+</span></div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Strongest Area</p>
        <div className="flex flex-wrap gap-2">
          {AREAS.map(a => (
            <Pill key={a} active={data.strongestArea === a} onClick={() => {
              onChange('strongestArea', a);
              if (data.weakestArea === a) onChange('weakestArea', '');
            }}>{a}</Pill>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Weakest Area</p>
        <div className="flex flex-wrap gap-2">
          {AREAS.filter(a => a !== data.strongestArea).map(a => (
            <Pill key={a} active={data.weakestArea === a} onClick={() => onChange('weakestArea', a)}>{a}</Pill>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Resume <span className="text-gray-600 normal-case font-normal">(optional PDF)</span></p>
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById('resume-input').click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:border-violet-500/40 bg-black/20'
          }`}
        >
          <input id="resume-input" type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          {uploadState === 'idle' && (
            <>
              <span className="material-symbols-outlined text-3xl text-gray-500 mb-2 block">upload_file</span>
              <p className="text-sm text-gray-400">Drag & drop or <span className="text-violet-400 font-bold">click to browse</span></p>
              <p className="text-xs text-gray-600 mt-1">PDF only</p>
            </>
          )}
          {uploadState === 'uploading' && (
            <div className="flex flex-col items-center gap-2">
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="material-symbols-outlined text-3xl text-violet-400">sync</motion.span>
              <p className="text-sm text-gray-400">Uploading…</p>
            </div>
          )}
          {uploadState === 'success' && (
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-emerald-400">check_circle</span>
              <p className="text-sm text-emerald-400 font-bold">{data.resumeName || 'Resume uploaded!'}</p>
            </div>
          )}
          {uploadState === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-rose-400">error</span>
              <p className="text-sm text-rose-400">Upload failed. Please try a PDF.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Step3 = ({ data, onChange, step1, step2 }) => (
  <div className="space-y-8">
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Practice Frequency</p>
      <div className="grid grid-cols-3 gap-3">
        {SCHEDULES.map(s => (
          <button key={s.id} onClick={() => onChange('schedule', s.id)}
            className={`p-4 rounded-2xl border text-center transition-all active:scale-95 ${
              data.schedule === s.id
                ? 'bg-violet-600/20 border-violet-500/40'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
            }`}>
            <p className="text-sm font-bold text-white">{s.label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.sub}</p>
          </button>
        ))}
      </div>
    </div>

    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Session Length</p>
      <div className="flex gap-2">
        {LENGTHS.map(l => (
          <Pill key={l} active={data.sessionLength === l} onClick={() => onChange('sessionLength', l)}>{l} min</Pill>
        ))}
      </div>
    </div>

    <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10">
      <div>
        <p className="text-sm font-bold text-white">Email Reminders</p>
        <p className="text-xs text-gray-500 mt-0.5">Get nudged when you fall behind</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={!!data.notifications}
          onChange={e => onChange('notifications', e.target.checked)} />
        <div className="w-12 h-6 rounded-full bg-neutral-800 border border-white/5 peer-checked:bg-violet-600 relative transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:rounded-full after:bg-gray-400 after:transition-all peer-checked:after:translate-x-[22px] peer-checked:after:bg-white" />
      </label>
    </div>

    <div className="mt-8 p-6 rounded-2xl bg-violet-600/10 border border-violet-500/20">
      <p className="text-sm font-bold text-white mb-2">Almost ready!</p>
      <p className="text-xs text-gray-300 leading-relaxed">
        Your plan is tailored for <span className="text-violet-300 font-bold">{step1.goalType === 'campus' ? 'Campus Placement' : step1.targetRole || 'your goal'}</span>
        {step1.companies.length > 0 ? ` targeting ${step1.companies.join(', ')}` : ''}.
        {step2.strongestArea && step2.weakestArea ? ` We'll focus on improving your ${step2.weakestArea} while maintaining your strength in ${step2.strongestArea}.` : ''}
      </p>
    </div>
  </div>
);

const LoadingScreen = ({ onDone }) => {
  const [phase, setPhase] = useState(0);
  const messages = [
    'Analyzing your target companies…',
    'Identifying weak areas to focus on…',
    'Building your personalized plan…',
    'Almost there…',
  ];

  React.useEffect(() => {
    const interval = setInterval(() => setPhase(p => (p + 1) % messages.length), 700);
    const timeout = setTimeout(onDone, 2800);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#060606] flex flex-col items-center justify-center z-50">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-3xl mb-8 mx-auto shadow-2xl shadow-violet-500/30">
          <span className="material-symbols-outlined text-white text-4xl">psychology</span>
        </div>
        <h2 className="text-2xl font-black text-white mb-3">Building your plan</h2>
        <AnimatePresence mode="wait">
          <motion.p key={phase} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="text-gray-400 text-sm mb-10">{messages[phase]}</motion.p>
        </AnimatePresence>
        <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mx-auto">
          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5, ease: 'easeInOut' }}
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" />
        </div>
      </motion.div>
    </div>
  );
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { setGoal } = useUserGoal();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [companyInput, setCompanyInput] = useState('');

  const [step1, setStep1] = useState({ goalType: null, targetRole: '', experienceLevel: '', companies: [], interviewDate: '' });
  const [step2, setStep2] = useState({ currentRole: '', college: '', yearsOfExperience: 0, graduationYear: '', strongestArea: '', weakestArea: '', resumeName: '' });
  const [step3, setStep3] = useState({ schedule: '', sessionLength: '30', notifications: true });

  const update1 = (k, v) => setStep1(p => ({ ...p, [k]: v }));
  const update2 = (k, v) => setStep2(p => ({ ...p, [k]: v }));
  const update3 = (k, v) => setStep3(p => ({ ...p, [k]: v }));

  const canProceedStep0 = !!step1.goalType && (step1.goalType === 'campus' || (!!step1.targetRole && !!step1.experienceLevel));

  const handleFinish = async () => {
    setLoading(true);
    const fullGoal = { ...step1, ...step2, ...step3, onboardingComplete: true };
    await setGoal(fullGoal);
  };

  if (loading) return <LoadingScreen onDone={() => navigate('/dashboard', { replace: true })} />;

  return (
    <div className="min-h-screen bg-[#060606] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-600/8 blur-[100px] rounded-full" />
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/5">
        <motion.div animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.4 }}
          className="h-full bg-gradient-to-r from-violet-600 to-cyan-400" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-8 pb-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-violet-400 text-base">psychology</span>
        </div>
        <span className="font-black text-white tracking-tight">Mockneto</span>
        <div className="ml-auto flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className={`text-[10px] font-bold uppercase tracking-widest ${i === step ? 'text-violet-400' : i < step ? 'text-emerald-400' : 'text-gray-600'}`}>
              {i < step ? '✓ ' : `${i + 1}. `}{s}
              {i < STEPS.length - 1 && <span className="ml-2 text-gray-700">·</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile summary strip */}
      <div className="md:hidden px-6 py-3 flex gap-2 overflow-x-auto">
        {step1.targetRole && <span className="flex-shrink-0 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-300 text-[10px] font-bold">{step1.targetRole}</span>}
        {step1.experienceLevel && <span className="flex-shrink-0 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold">{step1.experienceLevel}</span>}
        {step1.companies.slice(0, 2).map(c => <span key={c} className="flex-shrink-0 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-[10px] font-bold">{c}</span>)}
      </div>

      {/* Main content */}
      <div className="relative z-10 px-6 pb-32 max-w-5xl mx-auto flex gap-12">
        <div className="flex-1 min-w-0">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-400 mb-2">Step {step + 1} of {STEPS.length}</p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{STEPS[step]}</h1>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {step === 0 && <Step1 data={step1} onChange={update1} companyInput={companyInput} setCompanyInput={setCompanyInput} />}
              {step === 1 && <Step2 data={step2} onChange={update2} goalType={step1.goalType} />}
              {step === 2 && <Step3 data={step3} onChange={update3} step1={step1} step2={step2} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Live preview — desktop only */}
        <div className="w-72 flex-shrink-0 pt-4">
          <LivePreview step1={step1} companyInput={companyInput} />
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#060606]/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between gap-4">
        {step > 0 ? (
          <button onClick={() => setStep(s => s - 1)}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-bold hover:bg-white/10 transition-all active:scale-95">
            ← Back
          </button>
        ) : <div />}

        <div className="flex items-center gap-3 ml-auto">
          {step > 0 && step < 2 && (
            <button onClick={() => setStep(s => s + 1)}
              className="px-6 py-3 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-300 transition-colors">
              Skip for now
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !canProceedStep0}
              className="px-8 py-3 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 active:scale-95 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
              Continue →
            </button>
          ) : (
            <button onClick={handleFinish}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-black hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-violet-500/20">
              Build My Plan →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
