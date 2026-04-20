import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation up to 10 degrees
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 8, y: -8 }); // Reset to default tilt
  };

  return (
    <section className="hero-section">
      <div className="hero-bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      
      <div className="hero-content">
        <h1 className="hero-title">
          Command Your <br />
          <span className="text-gradient">AI Agent Fleet</span>
        </h1>
        <p className="hero-subtitle">
          The premium control center for deploying, monitoring, and scaling your autonomous web agents.
        </p>
        
        <div className="hero-ctas">
          <Link to="/signup" className="btn-primary hero-btn">Start Building Free</Link>
          <Link to="/login" className="btn-secondary hero-btn">Sign In to Dashboard</Link>
        </div>

        <div className="hero-visual-wrapper">
          <div 
            className="hero-dashboard-card glass"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            }}
          >
            <div className="dashboard-mock-header">
              <div className="mock-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="mock-title">Agent Control Panel</div>
            </div>
            <div className="dashboard-mock-body">
              <div className="mock-sidebar"></div>
              <div className="mock-main">
                <div className="mock-stats">
                  <div className="mock-stat-card"></div>
                  <div className="mock-stat-card"></div>
                  <div className="mock-stat-card"></div>
                </div>
                <div className="mock-chart"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
