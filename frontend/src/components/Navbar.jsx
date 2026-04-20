import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar glass">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text text-gradient">WeTano Engage</span>
        </Link>
        <div className="navbar-links">
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/signup" className="btn-primary">Get Started</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
