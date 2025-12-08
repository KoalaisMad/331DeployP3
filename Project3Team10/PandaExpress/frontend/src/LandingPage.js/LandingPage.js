import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import API_URL from '../config';

function LandingPage() {
  const navigate = useNavigate();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleRedirect = (path) => {
    window.location.href = path;
  };



  const handleCashierClick = () => {
    setShowPinModal(true);
    setPin('');
    setPinError('');
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    // You can change this PIN or validate against a database
    if (pin === '1020') {
      setShowPinModal(false);
      navigate('/cashier');
    } else {
      setPinError('Invalid PIN. Please try again.');
      setPin('');
    }
  };

  const handlePinChange = (e) => {
    setPin(e.target.value);
    setPinError('');
  };

  const handleModalClose = () => {
    setShowPinModal(false);
    setPin('');
    setPinError('');
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <h1 className="landing-title">Panda Express POS System</h1>
      </header>
      
      <div className="landing-container">
        <h2 className="landing-subtitle">Select Your Role to Continue</h2>
        
        <div className="role-cards">
          <div className="role-card customer-card" onClick={() => handleNavigation('/customer')}>
            <div className="role-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </div>
            <h2>Customer</h2>
            <p>Self-service kiosk for placing orders</p>
          </div>

          {/* RESTORED GOOGLE AUTH BUTTON */}
          <div className="role-card cashier-card" onClick={() => handleRedirect(`${API_URL}/auth/google/start?view=cashier`)}>
            <div className="role-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
            </div>
            <h2>Cashier</h2>
            <p>Process customer orders and payments</p>
          </div>

          {/* RESTORED GOOGLE AUTH BUTTON */}
          <div className="role-card manager-card" onClick={() => handleRedirect(`${API_URL}/auth/google/start?view=manager`)}>
            <div className="role-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
            </div>
            <h2>Manager</h2>
            <p>Manage inventory, employees, and reports</p>
          </div>
        </div>
      </div>

      {showPinModal && (
        <div className="pin-modal-overlay" onClick={handleModalClose}>
          <div className="pin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cashier PIN Required</h3>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                value={pin}
                onChange={handlePinChange}
                placeholder="Enter PIN"
                maxLength="4"
                autoFocus
                className="pin-input"
              />
              {pinError && <p className="pin-error">{pinError}</p>}
              <div className="pin-modal-buttons">
                <button type="submit" className="pin-submit-btn">Enter</button>
                <button type="button" onClick={handleModalClose} className="pin-cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
