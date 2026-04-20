import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer border-t border-subtle mt-16">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="logo-text text-gradient">WeTano Engage</span>
          <p className="footer-tagline">Premium AI Agent Control Platform</p>
        </div>
        
        <div className="footer-links">
          <div className="link-column">
            <h4 className="column-title">Product</h4>
            <Link to="/features">Features</Link>
            <Link to="/integrations">Integrations</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
          <div className="link-column">
            <h4 className="column-title">Resources</h4>
            <Link to="/docs">Documentation</Link>
            <Link to="/api">API Reference</Link>
            <Link to="/blog">Blog</Link>
          </div>
          <div className="link-column">
            <h4 className="column-title">Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom text-center mt-12 mb-8 text-secondary text-sm">
        <p>&copy; {new Date().getFullYear()} WeTano Engage. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
