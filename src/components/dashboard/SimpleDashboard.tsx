import React, { useState, useEffect } from 'react';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import WalletStatus from '../WalletStatus';
import '../../App.css';
import './Dashboard.css';

const SimpleDashboard: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to home if no wallet is connected
    if (!account) {
      navigate('/');
    }
  }, [account, navigate]);

  // Show success message if redirected from create event
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Redirect to home if no wallet connected
  if (!account) {
    return null;
  }

  return (
    <div className="dashboard-app-container">
      {/* Navigation */}
      <nav className="dashboard-navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <svg className="brand-logo" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="dashboard-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="currentColor" opacity="0.6" />
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="10" height="10" rx="2" fill="url(#dashboard-logo-gradient)" />
              <rect x="18" y="4" width="10" height="10" rx="2" fill="url(#dashboard-logo-gradient)" opacity="0.8" />
              <rect x="4" y="18" width="10" height="10" rx="2" fill="url(#dashboard-logo-gradient)" opacity="0.6" />
              <rect x="18" y="18" width="10" height="10" rx="2" fill="url(#dashboard-logo-gradient)" opacity="0.9" />
            </svg>
            <span className="brand-name">TokenFlow</span>
            <span className="beta-badge">Beta</span>
          </Link>
          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {isDarkMode ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            {account ? (
              <WalletStatus />
            ) : (
              <ConnectButton connectText="Connect Wallet" />
            )}
          </div>
        </div>
      </nav>

      {/* Success Message */}
      {successMessage && (
        <div className="success-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Dashboard */}
      <main className="dashboard-main visible">
        <div className="dashboard-container">
          {/* Header */}
          <header className="dashboard-header">
            <div className="header-content">
              <div className="welcome-section">
                <h1>Welcome to TokenFlow!</h1>
                <p>Instantly distribute tokens to multiple recipients with one click</p>
              </div>
              <div className="header-actions">
                <button 
                  className="create-event-btn"
                  onClick={() => navigate('/create-event')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span>Distribute Tokens</span>
                </button>
              </div>
            </div>
          </header>

          {/* Quick Start Guide */}
          <section className="stats-section">
            <div className="quick-start-card" style={{ padding: '2rem', background: 'var(--surface)', borderRadius: '12px' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>How it works</h2>
              <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="step-item" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>1️⃣</div>
                  <h3>Add Recipients</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Upload a CSV or paste wallet addresses</p>
                </div>
                <div className="step-item" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>2️⃣</div>
                  <h3>Set Amount</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Specify total SUI to distribute</p>
                </div>
                <div className="step-item" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>3️⃣</div>
                  <h3>One-Click Distribution</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Sign transaction and funds are sent instantly</p>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="tab-content">
            <div className="overview-content">
              <div className="overview-grid">
                {/* Quick Actions */}
                <div className="quick-actions-card">
                  <h3>Features</h3>
                  <div className="actions-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="action-item" style={{ cursor: 'default', background: 'var(--surface-hover)' }}>
                      <div className="action-icon">⚡</div>
                      <div className="action-text">
                        <h4>Instant Distribution</h4>
                        <p>Funds are distributed immediately in one transaction</p>
                      </div>
                    </div>
                    
                    <div className="action-item" style={{ cursor: 'default', background: 'var(--surface-hover)' }}>
                      <div className="action-icon">💰</div>
                      <div className="action-text">
                        <h4>Equal Splitting</h4>
                        <p>Automatically divides total amount equally among recipients</p>
                      </div>
                    </div>
                    
                    <div className="action-item" style={{ cursor: 'default', background: 'var(--surface-hover)' }}>
                      <div className="action-icon">🔒</div>
                      <div className="action-text">
                        <h4>Secure & Direct</h4>
                        <p>Funds go directly from your wallet to recipients</p>
                      </div>
                    </div>
                    
                    <div className="action-item" style={{ cursor: 'default', background: 'var(--surface-hover)' }}>
                      <div className="action-icon">📊</div>
                      <div className="action-text">
                        <h4>No Storage Required</h4>
                        <p>Simple one-time distributions without complex setup</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Get Started */}
                <div className="recent-activity-card">
                  <h3>Ready to distribute?</h3>
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                      Start distributing tokens to your community with just a few clicks
                    </p>
                    <button 
                      className="primary-button"
                      onClick={() => navigate('/create-event')}
                      style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
                    >
                      Start Distribution
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14m-7-7l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SimpleDashboard;