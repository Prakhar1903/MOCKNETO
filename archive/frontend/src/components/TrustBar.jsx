import React from 'react';
import './TrustBar.css';

const TrustBar = () => {
  return (
    <section className="trust-bar">
      <div className="trust-container">
        <div className="trust-stat">
          <span className="stat-number text-gradient">10K+</span>
          <span className="stat-label">Agents Managed</span>
        </div>
        <div className="trust-stat">
          <span className="stat-number text-gradient">99.9%</span>
          <span className="stat-label">Platform Uptime</span>
        </div>
        <div className="trust-stat">
          <span className="stat-number text-gradient">50ms</span>
          <span className="stat-label">Avg Response Time</span>
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
