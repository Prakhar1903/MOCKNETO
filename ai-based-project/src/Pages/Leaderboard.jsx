import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API from '../api';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await API.get('/interview/leaderboard');
        if (res.data?.leaderboard) {
          setLeaders(res.data.leaderboard);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <main className="text-white px-4 md:px-8 max-w-5xl mx-auto pt-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400 mb-2">Global Rankings</p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          Top <span className="text-violet-400">Performers.</span>
        </h1>
        <p className="text-gray-400 mt-3 text-sm max-w-xl mx-auto leading-relaxed">
          See how you stack up against the best. Rankings are based on average interview scores.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-3xl bg-[#111111] border border-white/[0.06] overflow-hidden"
      >
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-black/20">
          <h2 className="text-lg font-bold text-white">Leaderboard</h2>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span className="material-symbols-outlined text-sm">info</span>
            Top 20 users by average score
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading rankings...</div>
        ) : leaders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No data available yet.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {leaders.map((user, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                className="p-5 flex items-center gap-4 transition-colors"
              >
                <div className="w-8 text-center font-black text-xl text-gray-500">
                  {idx + 1 === 1 ? '🥇' : idx + 1 === 2 ? '🥈' : idx + 1 === 3 ? '🥉' : idx + 1}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30 overflow-hidden shrink-0">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-violet-300 font-bold text-sm">
                      {user.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{user.userName}</h3>
                  <p className="text-xs text-gray-500">{user.totalSessions} sessions completed</p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-white">{user.avgScore}<span className="text-xs text-gray-500 font-normal">/100</span></div>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Avg Score</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </main>
  );
};

export default Leaderboard;
