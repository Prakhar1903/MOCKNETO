import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        await API.post('/users/verify-email', { token });
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative z-10 text-center"
      >
        {status === 'loading' && (
          <div className="py-8">
            <span className="material-symbols-outlined text-4xl text-violet-400 animate-spin mb-4">progress_activity</span>
            <h2 className="text-2xl font-black text-white mb-2">Verifying...</h2>
            <p className="text-gray-400">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <span className="material-symbols-outlined text-5xl text-emerald-400 mb-4">verified</span>
            <h2 className="text-2xl font-black text-white mb-2">Email Verified!</h2>
            <p className="text-gray-400 mb-8">{message}</p>
            <Link to="/login" className="px-8 py-3.5 rounded-xl bg-violet-600 text-white font-bold tracking-tight hover:bg-violet-500 transition-all inline-block">
              Continue to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <span className="material-symbols-outlined text-5xl text-rose-400 mb-4">error</span>
            <h2 className="text-2xl font-black text-white mb-2">Verification Failed</h2>
            <p className="text-gray-400 mb-8">{message}</p>
            <Link to="/login" className="text-violet-400 hover:text-white transition-colors">
              Return to Login
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
