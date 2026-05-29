import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import API from '../api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      const res = await API.post('/users/forgot-password', { email });
      setMessage(res.data.message || 'If that email is registered, a reset link was sent.');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to send reset link. Try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
      {/* Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative z-10"
      >
        <h2 className="text-2xl font-black text-white mb-2">Forgot Password?</h2>
        <p className="text-sm text-gray-400 mb-8">
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </p>

        {status === 'success' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2">mark_email_read</span>
            <h3 className="text-lg font-bold text-white mb-2">Check your email</h3>
            <p className="text-sm text-emerald-400/80">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            
            {status === 'error' && (
              <p className="text-sm text-rose-400 font-medium">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-xl hover:bg-violet-500 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
