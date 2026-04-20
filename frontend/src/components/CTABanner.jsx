import React from 'react';
import { Link } from 'react-router-dom';
import './CTABanner.css';

const CTABanner = () => {
  return (
    <section className="cta-banner-wrapper">
      <div className="cta-banner glass">
        <h2 className="cta-title">Ready to deploy your agents?</h2>
        <p className="cta-desc">Join leading teams building the next generation of autonomous web services.</p>
        <Link to="/signup" className="btn-primary cta-btn">Get Started Free</Link>
      </div>
    </section>
  );
};

export default CTABanner;
