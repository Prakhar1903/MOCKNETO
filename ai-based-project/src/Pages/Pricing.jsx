import React from 'react';
import { motion } from 'framer-motion';

const Pricing = () => {
  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10 mb-16"
      >
        <span className="text-xs font-black uppercase tracking-[0.3em] text-violet-400 mb-4 block">Upgrade Your Prep</span>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Choose Your Arsenal</h1>
        <p className="text-white/50 max-w-lg mx-auto">Get unlimited AI mock interviews, detailed scorecards, and premium company question banks.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 z-10 max-w-4xl w-full">
        {/* Free Plan */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-sm relative overflow-hidden"
        >
          <h2 className="text-2xl font-bold mb-2">Basic Starter</h2>
          <p className="text-white/40 text-sm mb-6">Perfect for quick practice.</p>
          <div className="mb-8">
            <span className="text-4xl font-extrabold">$0</span>
            <span className="text-white/40"> / forever</span>
          </div>
          
          <ul className="space-y-4 mb-8">
            {['5 AI Interviews / month', 'Basic Question Bank', 'Standard Analytics', 'Community Support'].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                {feature}
              </li>
            ))}
          </ul>
          
          <button className="w-full py-4 rounded-xl border border-white/20 bg-white/5 font-bold hover:bg-white/10 transition-all">
            Current Plan
          </button>
        </motion.div>

        {/* Pro Plan */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[2rem] border border-violet-500/50 bg-violet-600/10 p-8 backdrop-blur-sm relative overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.15)]"
        >
          <div className="absolute top-0 right-0 bg-violet-600 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-2xl">Most Popular</div>
          <h2 className="text-2xl font-bold mb-2 text-violet-300">Mockneto Pro</h2>
          <p className="text-white/40 text-sm mb-6">For serious job seekers.</p>
          <div className="mb-8">
            <span className="text-4xl font-extrabold">$15</span>
            <span className="text-white/40"> / month</span>
          </div>
          
          <ul className="space-y-4 mb-8">
            {['Unlimited AI Interviews', 'Premium FAANG Question Bank', 'Code Editor for DSA', 'Resume Upload & Parsing', 'Shareable Performance Scorecards'].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm text-white/90">
                <span className="material-symbols-outlined text-violet-400 text-[18px]">check_circle</span>
                {feature}
              </li>
            ))}
          </ul>
          
          <button className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            Upgrade Now
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;
