import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { signIn, signInWithGoogle, signUp } from '../auth';
import { GoogleLogin } from '@react-oauth/google';
import SideImage from '../assets/6073424 copy.jpg';
import { useTheme } from '../context/ThemeContext.jsx';

const Login = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [backendWarmup, setBackendWarmup] = useState('idle'); // idle | warming | ready | failed
  const [sessionUser, setSessionUser] = useState(null);
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    setBackendWarmup('warming');
    fetch('/api/health', { method: 'GET', cache: 'no-store', signal: controller.signal })
      .then((r) => {
        if (cancelled) return;
        setBackendWarmup(r.ok ? 'ready' : 'failed');
      })
      .catch(() => {
        if (cancelled) return;
        setBackendWarmup('failed');
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  /*
  useEffect(() => {
    // If already logged in, show quick actions (don’t force redirect)
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setSessionUser(JSON.parse(userData));
      } catch {
        setSessionUser({ UserName: 'User' });
      }
    } else {
      setSessionUser(null);
    }
  }, [navigate]);
  */

  /*
  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event('user-updated'));
    setSessionUser(null);
    setActiveTab('login');
    setInfo('Logged out successfully.');
  };
  */

  const handleBack = () => {
    try {
      if (window.history.length > 1) navigate(-1);
      else navigate('/');
    } catch {
      navigate('/');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {
      if (activeTab === 'login') {
        // Login logic
        const response = await signIn({
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('user', JSON.stringify(response.user));
        window.dispatchEvent(new Event('user-updated'));

        // Apply user's persisted theme if available; otherwise keep current preference
        const persistedTheme = response?.user?.settings?.theme;
        if (persistedTheme && ['light', 'dark', 'system'].includes(persistedTheme)) {
          setTheme(persistedTheme);
        }
        navigate('/dashboard');
      } else {
        // Signup logic
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords don't match");
        }

        const { name, email, password } = formData;
        const response = await signUp({
          name: name,
          email: email,
          password: password
        });
        localStorage.setItem('user', JSON.stringify(response.user));
        window.dispatchEvent(new Event('user-updated'));

        const persistedTheme = response?.user?.settings?.theme;
        if (persistedTheme && ['light', 'dark', 'system'].includes(persistedTheme)) {
          setTheme(persistedTheme);
        }
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err?.message || 'An error occurred. Please try again.';
      setError(message);

      if (String(message).toLowerCase().includes('already registered')) {
        setActiveTab('login');
        setInfo('This email is already registered. Please log in instead.');
      }
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleError = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setInfo('');
    setError(
      `Google login is not allowed for this domain${origin ? ` (${origin})` : ''}. ` +
      `Fix: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID → ` +
      `add this to Authorized JavaScript origins: ${origin || '<your-frontend-origin>'}.`
    );
  };

  const finishLogin = (response) => {
    window.dispatchEvent(new Event('user-updated'));

    const persistedTheme = response?.user?.settings?.theme;
    if (persistedTheme && ['light', 'dark', 'system'].includes(persistedTheme)) {
      setTheme(persistedTheme);
    }
    navigate('/dashboard');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setInfo('');
    setGoogleLoading(true);
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) throw new Error('Google credential missing');
      const response = await signInWithGoogle(idToken);
      finishLogin(response);
    } catch (err) {
      setError(err?.message || 'Google login failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Animation variants
  /*
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };
  */

  /* 
  const tabContentVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    exit: { x: 10, opacity: 0 }
  };
  */

  return (
    <div className="min-h-screen py-20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Left Side: Branding/Visual */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col gap-6"
        >
          <div className="space-y-4">
            <h1 className="text-6xl font-extrabold tracking-tight">
              Master your <br />
              <span className="text-primary">interviews.</span>
            </h1>
            <p className="text-xl text-foreground/60 max-w-md font-medium leading-relaxed">
              Experience the future of interview preparation with AI-powered simulations and real-time feedback.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { label: 'AI Simulations', icon: '🤖' },
              { label: 'Deep Feedback', icon: '📊' },
              { label: 'Voice Mode', icon: '🎙️' },
              { label: 'Video Analysis', icon: '🎥' },
            ].map((feature) => (
              <div key={feature.label} className="glass p-4 rounded-2xl flex items-center gap-3">
                <span className="text-2xl">{feature.icon}</span>
                <span className="font-semibold text-sm">{feature.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="glass rounded-[2rem] p-8 md:p-10 shadow-premium relative overflow-hidden">
            {/* Branding for Mobile */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-primary">Mockneto</h1>
              <p className="text-foreground/60 mt-2">Elevate your career today.</p>
            </div>

            {/* Back Button */}
            <button
              onClick={handleBack}
              className="absolute top-6 left-6 p-2 rounded-full hover:bg-foreground/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>

            {/* Form Toggle */}
            <div className="flex bg-secondary rounded-2xl p-1 mb-8">
              {['login', 'signup'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground/50 hover:text-foreground'
                    }`}
                >
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {info && (
              <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {info}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  {activeTab === 'signup' && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        className="w-full px-5 py-3.5 rounded-2xl bg-secondary border-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="hello@example.com"
                      required
                      className="w-full px-5 py-3.5 rounded-2xl bg-secondary border-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-bold">Password</label>
                      {activeTab === 'login' && (
                        <Link to="/contactus" className="text-xs font-bold text-primary hover:underline">Forgot?</Link>
                      )}
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full px-5 py-3.5 rounded-2xl bg-secondary border-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all outline-none"
                    />
                  </div>

                  {activeTab === 'signup' && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Confirm Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        className="w-full px-5 py-3.5 rounded-2xl bg-secondary border-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all outline-none"
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="shine-hover w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-4"
              >
                {loading ? 'Processing...' : (activeTab === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            {activeTab === 'login' && (
              <div className="mt-8">
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                    <span className="px-4 glass text-foreground/40">Or continue with</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  {googleClientId ? (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="filled_blue"
                      shape="pill"
                      width="320"
                    />
                  ) : (
                    <div className="text-xs text-center text-foreground/40">Google Login Unavailable</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'signup' && (
              <p className="mt-8 text-center text-xs text-foreground/40 leading-relaxed font-medium">
                By joining, you agree to our <br />
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
