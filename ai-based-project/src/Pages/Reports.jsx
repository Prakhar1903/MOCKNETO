import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useUserGoal } from '../context/UserGoalContext';
import API from '../api';

const MOCK_METRICS = [
  { label: 'Global Grade', value: 'A-', trend: '+6%', icon: 'grade', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { label: 'Success Rate', value: '94.2%', trend: '+4%', icon: 'trending_up', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
];

const MOCK_RADAR_DATA = [
  { subject: 'Technical', A: 120, fullMark: 150 },
  { subject: 'Comms', A: 98, fullMark: 150 },
  { subject: 'Behavioral', A: 86, fullMark: 150 },
  { subject: 'Logic', A: 99, fullMark: 150 },
];

const MOCK_CHART_DATA = [
  { name: 'Jan', value: 45, trend: '+2' },
  { name: 'Feb', value: 52, trend: '+7' },
  { name: 'Mar', value: 48, trend: '-4' },
  { name: 'Apr', value: 61, trend: '+13' },
  { name: 'May', value: 55, trend: '-6' },
  { name: 'Jun', value: 67, trend: '+12' },
  { name: 'Jul', value: 72, trend: '+5' },
];

const MOCK_SESSIONS = [
  { id: 1, title: 'React Frontend Architecture', date: '2 days ago', score: '88/100', grade: 'Excellent', gradeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'code', insight: 'Strong grasp of component lifecycle', type: 'Technical' },
  { id: 2, title: 'System Design: Scalability', date: '4 days ago', score: '76/100', grade: 'Good', gradeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: 'hub', insight: 'Consider database sharding earlier', type: 'System Design' },
  { id: 3, title: 'Behavioral: Leadership', date: '1 week ago', score: '64/100', grade: 'Needs Polish', gradeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: 'groups', insight: 'More specific STAR examples needed', type: 'Behavioral' },
];

const Reports = () => {
  const navigate = useNavigate();
  const { goal } = useUserGoal();
  const [activeRange, setActiveRange] = useState('30D');
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
        
        const [userRes, historyData] = await Promise.all([
          API.get('/me'),
          fetch('/api/interview/history', { credentials: 'include', headers }).then(r => r.json())
        ]);
        if (userRes.data?.user?.streak) {
          setStreak(userRes.data.user.streak);
        }
        if (historyData?.history) {
          setSessions(historyData.history);
        }
      } catch (err) {
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Use mock sessions if no real history exists yet to keep UI looking good
  const displaySessions = sessions.length > 0 ? sessions : MOCK_SESSIONS;

  return (
    <main className="text-white px-4 md:px-8 max-w-7xl mx-auto pt-8 pb-32">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 mb-2">Performance Monitoring</p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          Analytics <span className="text-white/25">& Insights.</span>
        </h1>
        <p className="text-gray-400 mt-3 text-sm max-w-xl leading-relaxed">
          Track your interview progress, visualize your growth trajectory, and identify key improvement areas.
        </p>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[...MOCK_METRICS, { label: 'Total Sessions', value: displaySessions.length || 0, trend: 'All time', icon: 'task_alt', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' }].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="rounded-3xl bg-[#111111] border border-white/[0.06] p-6 flex items-center justify-between hover:border-white/10 transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} border ${stat.border} flex items-center justify-center shadow-lg`}>
                <span className={`material-symbols-outlined ${stat.color} text-2xl`}>{stat.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-1">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-white leading-none">{stat.value}</p>
                  <span className="text-[10px] font-bold text-emerald-400 mb-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">{stat.trend}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* ── Skill Radar Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="xl:col-span-1 rounded-3xl bg-[#111111] border border-white/[0.06] p-8 relative overflow-hidden"
        >
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-violet-600/5 blur-[60px] rounded-full pointer-events-none" />
          <h2 className="text-lg font-bold text-white mb-6 relative z-10">Skill Balance</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MOCK_RADAR_DATA}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }} />
                <Radar
                  name="Skills"
                  dataKey="A"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Performance Chart (Enhanced) ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="xl:col-span-2 rounded-3xl bg-[#111111] border border-white/[0.06] p-8 relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-600/8 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-white">Monthly Performance</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                {['bar', 'line'].map((t) => (
                  <button key={t} onClick={() => setChartType(t)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${chartType === t ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                {['7D', '30D', '3M', '6M'].map((r) => (
                  <button key={r} onClick={() => setActiveRange(r)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeRange === r ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={MOCK_CHART_DATA} margin={{ top: 20, right: 16, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#ffffff05' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                            <p className="text-gray-400 font-bold text-[10px] mb-2 uppercase tracking-widest">{label}</p>
                            <div className="flex items-center gap-3">
                              <p className="text-xl font-black text-white">{payload[0].value}%</p>
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ${payload[0].payload.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {payload[0].payload.trend}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={90} label={{ position: 'right', value: 'Top 5%', fill: '#8b5cf6', fontSize: 10, fontWeight: 900 }} stroke="#8b5cf6" strokeDasharray="5 5" />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="url(#vg)">
                    {MOCK_CHART_DATA.map((_, index) => (
                      <Cell key={index} fillOpacity={index === MOCK_CHART_DATA.length - 1 ? 1 : 0.7} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={MOCK_CHART_DATA} margin={{ top: 20, right: 16, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
                            <p className="text-gray-400 font-bold text-[10px] mb-2 uppercase tracking-widest">{label}</p>
                            <div className="flex items-center gap-3">
                              <p className="text-xl font-black text-white">{payload[0].value}%</p>
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-white/5 border border-white/10 ${payload[0].payload.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {payload[0].payload.trend}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={90} label={{ position: 'right', value: 'Top 5%', fill: '#8b5cf6', fontSize: 10, fontWeight: 900 }} stroke="#8b5cf6" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#111' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Performance Insights ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="rounded-3xl bg-[#111111] border border-white/[0.06] p-8 mb-6"
      >
        <h2 className="text-lg font-bold text-white mb-6">Your Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4 px-3 py-1 rounded bg-emerald-500/5 border border-emerald-500/10 w-fit">Top Strengths</p>
            <div className="flex flex-wrap gap-2">
              {['System Design (92%)', 'React Architecture (88%)', 'API Security (84%)'].map(skill => (
                <span key={skill} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-white/80 group-hover:bg-white/10 transition-colors">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-4 px-3 py-1 rounded bg-rose-500/5 border border-rose-500/10 w-fit">Needs Focus</p>
            <div className="flex flex-wrap gap-2">
              {['Binary Trees (64%)', 'Leadership (64%)', 'Data Normalization (68%)'].map(skill => (
                <span key={skill} className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/10 text-xs font-medium text-rose-300">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Consistency Heatmap ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="rounded-3xl bg-[#111111] border border-white/[0.06] p-8 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Consistency Tracking</h2>
            <p className="text-sm text-gray-500">Daily practice frequency</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-white leading-none">{streak.current}</p>
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mt-1 italic">Day Streak</p>
          </div>
        </div>
        {streak.current === 0 && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
            <p className="text-gray-400 text-sm font-medium">Complete your first session to start tracking consistency</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {[...Array(35)].map((_, i) => {
              const isActive = i < streak.current;
              return (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-sm transition-all duration-300 ${
                    isActive ? 'bg-violet-600/80' : 'bg-white/5'
                  }`} 
                  title={isActive ? 'Practiced' : 'Missed'}
                />
              )
            })}
          </div>
        )}
      </motion.div>

      {/* ── Target Readiness ── */}
      {goal?.companies && goal.companies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.52 }}
          className="rounded-3xl bg-[#111111] border border-white/[0.06] p-8 mb-6"
        >
          <h2 className="text-lg font-bold text-white mb-6">Target Readiness</h2>
          <div className="flex flex-wrap gap-4">
            {goal.companies.map((company, i) => (
               <div key={company} className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#181818] border border-white/5 hover:border-violet-500/30 transition-all flex-1 min-w-[200px]">
                 <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                   <span className="material-symbols-outlined text-violet-400 text-xl">domain</span>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-white tracking-wide">{company}</p>
                   <p className="text-xs text-gray-400 mt-1 font-medium tracking-widest uppercase">Readiness: <span className="text-emerald-400 font-bold">{70 + i * 5}%</span></p>
                 </div>
               </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Session History with Filters ── */}
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }} className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-white">Session History</h2>
          <div className="flex overflow-x-auto bg-black/40 rounded-xl p-1 border border-white/5 no-scrollbar">
            {['All', 'Technical', 'Behavioral', 'System Design'].map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeFilter === f ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-8">Loading history...</div>
        ) : (
          <div className="flex flex-col gap-3">
            {displaySessions
              .filter(s => activeFilter === 'All' || s.mode === activeFilter || s.type === activeFilter || !s.type)
              .map((session, idx) => (
              <motion.div key={session._id || session.id}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.08 }}
                whileHover={{ x: 6 }}
                onClick={() => session._id ? navigate(`/session/${session._id}`) : null}
                className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-[#111111] border border-white/[0.06] hover:border-violet-500/25 transition-all cursor-pointer gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-violet-400 transition-colors uppercase">
                      {session.icon || 'history'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{session.title || `${session.company || 'Practice'} - ${session.jobRole || 'Interview'}`}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-500">
                        {session.date ? (new Date(session.date).toString() === 'Invalid Date' ? session.date : new Date(session.date).toLocaleDateString()) : session.date}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <p className="text-[10px] font-black text-violet-400/80 uppercase tracking-widest leading-none bg-violet-400/5 px-2 py-0.5 rounded border border-violet-400/10 italic truncate max-w-[200px]">
                        {session.insight || session.focusArea || session.mode}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <p className="text-base font-black text-white">{session.score ? (String(session.score).includes('/') ? session.score : `${session.score}/100`) : 'N/A'}</p>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    session.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    session.score >= 60 ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                    'bg-orange-500/10 text-orange-400 border-orange-500/20'
                  }`}>
                    {session.grade || (session.score >= 80 ? 'Excellent' : session.score >= 60 ? 'Good' : 'Needs Polish')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ── Path to A+ CTA ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="rounded-[2.5rem] p-[1px] bg-gradient-to-r from-violet-500/40 via-fuchsia-500/20 to-violet-500/40 shadow-2xl overflow-hidden"
      >
        <div className="bg-[#0a0a0a] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10 max-w-xl">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-violet-400 mb-4">Focus Recommendation</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Path to <span className="text-violet-400">A+.</span></h2>
            <p className="text-gray-400 text-lg">Your weakest area is <span onClick={() => navigate('/interviewsetup')} className="text-rose-400 font-bold decoration-rose-400/30 underline underline-offset-4 decoration-2 cursor-pointer hover:text-rose-300 transition-colors">Binary Trees</span>. Improve it with a focused 20-minute practice session.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-8 py-5 rounded-2xl bg-violet-600 text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 overflow-hidden shadow-[0_20px_50px_rgba(139,92,246,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative z-10">Start Practice</span>
            <span className="material-symbols-outlined relative z-10 text-sm transition-transform group-hover:translate-x-1">trending_up</span>
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
};

export default Reports;