import React from 'react';
import { Link } from 'react-router-dom';
import './AuthShared.css';

const Signup = () => {
  return (
    <div className="auth-container reverse">
      {/* Reverse layout: Form on left, Brand on right */}
      
      <div className="auth-right">
        <div className="auth-form-wrapper glass-container">
          <h2 className="auth-title typography-display">Create Account</h2>
          <p className="auth-subtitle">Start building your AI agent fleet today</p>
          
          <div className="auth-oauth">
            <button className="oauth-btn">
              <span>Google</span>
            </button>
            <button className="oauth-btn">
              <span>GitHub</span>
            </button>
          </div>
          
          <div className="auth-divider">
            <span>or sign up with email</span>
          </div>

          <form className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@company.com" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" />
            </div>
            <button type="button" className="btn-primary auth-submit">Create Account</button>
          </form>
          
          <p className="auth-switch">
            Already have an account? <Link to="/login" className="text-gradient hover-trigger">Log in</Link>
          </p>
        </div>
      </div>

      <div className="auth-left">
        <div className="auth-brand">
          <Link to="/" className="logo-text text-gradient">WeTano Engage</Link>
          <p className="auth-tagline">The premium control center for autonomous web agents.</p>
        </div>
        <div className="auth-orbpulse"></div>
      </div>
    </div>
  );
};

export default Signup;
