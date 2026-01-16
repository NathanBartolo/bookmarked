import React, { useState, useEffect, useRef } from 'react'; 
import { Link, useLocation } from "react-router-dom";

// Asset Imports
import LoginImage from "../assets/images/login-icon.png";
import LogoutImage from "../assets/images/logout-icon.png";

// Style Imports
import "../style/Navbar.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Navbar({ user, loading }) {
  // manages visibility of the user dropdown and the mobile navigation links
  const [menuOpen, setMenuOpen] = useState(false); 
  const [mobileLinksOpen, setMobileLinksOpen] = useState(false);
  
  // ref hooks for handling clicks outside the menus
  const userMenuRef = useRef(); // specifically for the Login/Logout dropdown
  const mobileNavRef = useRef(); // specifically for the Hamburger and Nav Links
  
  const location = useLocation();

  // redirects user to the Google OAuth backend route
  const handleAuth = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  // closes menus when the user clicks anywhere else on the screen
  useEffect(() => {
    const handleClickOutside = (event) => {
      // close user dropdown if clicking outside its container
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      // close mobile Hamburger menu if clicking outside the Hamburger or the links
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target)) {
        setMobileLinksOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // auto-close menus when the URL path changes
  useEffect(() => {
    setMenuOpen(false);
    setMobileLinksOpen(false);
  }, [location]);

  // hide the Navbar during the profile creation onboarding step
  if (location.pathname === '/create-profile') {
    return null; 
  }

  return (
    <nav>
      {/* Mobile Navigation*/}
      {/* wrap hamburger and links in a ref to detect outside clicks */}
      <div className="mobile-nav-container" ref={mobileNavRef}>
        <button 
          className="hamburger" 
          onClick={() => setMobileLinksOpen(!mobileLinksOpen)}
          aria-label="Toggle navigation"
        >
          <span className={`bar ${mobileLinksOpen ? 'open' : ''}`}></span>
          <span className={`bar ${mobileLinksOpen ? 'open' : ''}`}></span>
          <span className={`bar ${mobileLinksOpen ? 'open' : ''}`}></span>
        </button>

        <div className={`nav-links ${mobileLinksOpen ? "mobile-active" : ""}`}>
          <Link to="/">Home</Link>
          <Link to="/search">Search</Link>
          <Link to="/shelves">Shelves</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </div>

      {/* User Actions - Login/Logout Dropdown */}
      <div className="nav-actions" ref={userMenuRef}>
        {loading ? (
            <div className="nav-spinner"></div>
        ) : (
            <img 
            className="icon-image"
            src={!user ? LoginImage : LogoutImage} 
            alt="User Menu"
            onClick={() => setMenuOpen(!menuOpen)}
            />
        )}

        {/* Auth Dropdown */}
        {menuOpen && (
          <div className="dropdown-menu">
            
            {!user ? (
              <div className="auth-dropdown-content">
                <p className="dropdown-label">Join Bookmarked</p>
                <button className="continue-button" onClick={handleAuth}>
                  Continue with Google
                </button>
              </div>
            ) : (
              <div className="auth-dropdown-content">
                <p className="dropdown-label">User: {user.nickname || user.displayName}</p>
                {/* UPDATED: Used ${API_BASE_URL} for Logout */}
                <button className="logout-button" onClick={() => {
                  localStorage.removeItem('authToken');
                  window.location.href = `${API_BASE_URL}/auth/logout`;
                }}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;