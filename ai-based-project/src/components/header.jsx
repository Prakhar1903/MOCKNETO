import React from "react";
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Profile from './Profile.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const Header = () => {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Get user data from localStorage
    const sync = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      } else {
        setUser(null);
      }
    };

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('user-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('user-updated', sync);
    };
  }, []);

  useEffect(() => {
    const closeOnRoute = () => setMenuOpen(false);
    window.addEventListener('popstate', closeOnRoute);
    return () => window.removeEventListener('popstate', closeOnRoute);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const isMobile = () => window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    if (!menuOpen || !isMobile()) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] px-4 py-3 md:px-8">
      <div className="mx-auto max-w-7xl">
        <nav className="glass rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-300">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-xl font-bold">M</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground bg-clip-text">
              Mockneto
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { name: 'Home', path: '/' },
              { name: 'Practice', path: '/dashboard' },
              { name: 'Tips', path: '/interviewtips' },
              { name: 'Help', path: '/faq' },
              { name: 'Contact', path: '/contactus' }
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-semibold transition-all relative py-1 group ${location.pathname === item.path ? 'text-primary' : 'text-foreground/60 hover:text-foreground'
                  }`}
              >
                {item.name}
                <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-transform duration-300 origin-left ${location.pathname === item.path ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'
                  }`}></span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            {user ? (
              <Profile />
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Get Started
              </Link>
            )}

            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-foreground/5 transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed inset-x-4 top-[84px] z-[1001] md:hidden">
          <div className="glass rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <nav className="flex flex-col gap-2">
              <Link className="px-4 py-3 rounded-xl hover:bg-foreground/5 transition-colors font-medium" to="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link className="px-4 py-3 rounded-xl hover:bg-foreground/5 transition-colors font-medium" to="/dashboard" onClick={() => setMenuOpen(false)}>Practice</Link>
              <Link className="px-4 py-3 rounded-xl hover:bg-foreground/5 transition-colors font-medium" to="/interviewtips" onClick={() => setMenuOpen(false)}>Interview Tips</Link>
              <Link className="px-4 py-3 rounded-xl hover:bg-foreground/5 transition-colors font-medium" to="/faq" onClick={() => setMenuOpen(false)}>Help Center</Link>
              <Link className="px-4 py-3 rounded-xl hover:bg-foreground/5 transition-colors font-medium" to="/contactus" onClick={() => setMenuOpen(false)}>Contact Us</Link>
              {!user && (
                <Link
                  className="mt-2 block text-center px-4 py-4 rounded-xl bg-primary text-white font-bold shadow-lg"
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
