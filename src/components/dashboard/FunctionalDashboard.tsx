import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContract } from '../../hooks/useContract';
import WalletStatus from '../WalletStatus';
import ScrollingDistributionBar from '../ScrollingDistributionBar';
import '../../App.css';
import './Dashboard.css';

interface Distribution {
  id: string;
  distributor: string;
  eventName: string;
  totalAmount: number;
  recipients: string[];
  amountPerRecipient: number;
  timestamp: Date;
  txDigest: string;
}

const FunctionalDashboard: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const { getDistributionStats, getUserDistributions } = useContract();
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSuiDonated: 0,
    uniqueWallets: 0,
    totalDistributions: 0,
    distributions: [] as Distribution[]
  });
  const [userStats, setUserStats] = useState({
    totalSuiSent: 0,
    totalSuiReceived: 0,
    distributionsMade: 0,
    distributionsReceived: 0
  });
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const lastAccountRef = useRef<string | undefined>(account?.address);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Only redirect if no wallet is connected AND we're in "mine" mode
    if (!account && viewMode === 'mine') {
      setViewMode('all'); // Switch to "all" mode instead of redirecting
    }
  }, [account, viewMode]);

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

  // Memoized fetch function to prevent recreation on every render
  const fetchStats = useCallback(async (isManualRefresh = false) => {
    // For "mine" mode, require an account; for "all" mode, allow any user
    if (!account && viewMode === 'mine') return;
    
    // Cancel any previous fetch
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    
    // Create new abort controller for this fetch
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    
    // Only show loading on initial load or manual refresh
    if (!isInitialized || isManualRefresh) {
      setIsLoading(true);
    }
    
    try {
      if (viewMode === 'all') {
        // Get all distributions
        const data = await getDistributionStats();
        
        // Check if this request was aborted
        if (!controller.signal.aborted) {
          setStats(data);
          setIsInitialized(true);
        }
      } else if (viewMode === 'mine' && account) {
        // Get user-specific distributions where they are distributor OR recipient
        const myDistributions = await getUserDistributions(account.address);
        
        // Calculate stats for user's distributions
        let totalSuiDonated = 0;
        let totalSuiReceived = 0;
        let distributionsMade = 0;
        let distributionsReceived = 0;
        
        myDistributions.forEach((dist: any) => {
          if (dist.distributor === account.address) {
            // User is distributor
            totalSuiDonated += dist.totalAmount;
            distributionsMade++;
          } else {
            // User is recipient
            totalSuiReceived += dist.amountPerRecipient;
            distributionsReceived++;
          }
        });
        
        // Get unique wallets - all recipients from distributions where user was distributor
        const uniqueRecipientsSet = new Set<string>();
        myDistributions
          .filter((dist: any) => dist.distributor === account.address)
          .forEach((dist: any) => {
            dist.recipients.forEach((recipient: string) => uniqueRecipientsSet.add(recipient));
          });
        
        if (!controller.signal.aborted) {
          setStats({
            totalSuiDonated: totalSuiDonated + totalSuiReceived, // Total involved
            uniqueWallets: uniqueRecipientsSet.size,
            totalDistributions: myDistributions.length,
            distributions: myDistributions
          });
          setUserStats({
            totalSuiSent: totalSuiDonated,
            totalSuiReceived: totalSuiReceived,
            distributionsMade: distributionsMade,
            distributionsReceived: distributionsReceived
          });
          setIsInitialized(true);
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching stats:', error);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [account, viewMode, getDistributionStats, getUserDistributions]);

  // Handle account changes - reset state when wallet changes
  useEffect(() => {
    // Only reset if account actually changed (not just a re-render)
    if (lastAccountRef.current !== account?.address) {
      lastAccountRef.current = account?.address;
      
      // Cancel any ongoing requests when account changes
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
      
      // Reset stats when account changes
      setStats({
        totalSuiDonated: 0,
        uniqueWallets: 0,
        totalDistributions: 0,
        distributions: []
      });
      
      // Reset loading and initialization state
      setIsLoading(true);
      setIsRefreshing(false);
      setIsInitialized(false);
    }
  }, [account?.address]); // Only run when account address changes

  // Initial fetch and interval setup
  useEffect(() => {
    let mounted = true;
    
    // Initial fetch - allow for "all" mode even without account
    if (mounted && (account || viewMode === 'all')) {
      fetchStats();
    }
    
    // Set up interval for refreshing (background updates)
    const interval = setInterval(() => {
      if (mounted && !isLoading && (account || viewMode === 'all')) {
        fetchStats();
      }
    }, 30000);
    
    // Cleanup
    return () => {
      mounted = false;
      clearInterval(interval);
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, [viewMode, account, fetchStats]); // Re-run when viewMode, account or fetchStats changes

  // No longer redirect - allow viewing "All distributions" without wallet

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Memoize average calculation
  const averageDistributionSize = useMemo(() => {
    if (stats.totalDistributions === 0) return 0;
    return stats.totalSuiDonated / stats.totalDistributions;
  }, [stats.totalSuiDonated, stats.totalDistributions]);

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
            <span className="beta-badge desktop-only">Beta</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="nav-actions desktop-nav">
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

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <button className="theme-toggle-mobile" onClick={toggleTheme}>
              {isDarkMode ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                  </svg>
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <Link to="/" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18m-9-9v18"/>
              </svg>
              <span>Home</span>
            </Link>
            {account ? (
              <div className="mobile-wallet-section">
                <WalletStatus />
              </div>
            ) : (
              <ConnectButton connectText="Connect Wallet" />
            )}
          </div>
        </div>
      </nav>

      {/* Scrolling Distribution Bar */}
      <ScrollingDistributionBar />

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
                <h1>Distribution Dashboard</h1>
                <p>Track your token distributions and view on-chain statistics</p>
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
                  <span>New Distribution</span>
                </button>
              </div>
            </div>
          </header>

          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'mine' ? 'active' : ''}`}
              onClick={() => {
                if (viewMode !== 'mine' && account) {
                  // Cancel any ongoing requests
                  if (fetchControllerRef.current) {
                    fetchControllerRef.current.abort();
                  }
                  setViewMode('mine');
                  setStats({
                    totalSuiDonated: 0,
                    uniqueWallets: 0,
                    totalDistributions: 0,
                    distributions: []
                  });
                  setIsLoading(true);
                  setIsInitialized(false);
                }
              }}
              disabled={isLoading || isRefreshing || !account}
              title={!account ? 'Connect wallet to view your distributions' : ''}
            >
              My Distributions
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => {
                if (viewMode !== 'all') {
                  // Cancel any ongoing requests
                  if (fetchControllerRef.current) {
                    fetchControllerRef.current.abort();
                  }
                  setViewMode('all');
                  setStats({
                    totalSuiDonated: 0,
                    uniqueWallets: 0,
                    totalDistributions: 0,
                    distributions: []
                  });
                  setIsLoading(true);
                  setIsInitialized(false);
                }
              }}
              disabled={isLoading || isRefreshing}
            >
              All Distributions
            </button>
          </div>

          {/* User Summary for My Distributions */}
          {viewMode === 'mine' && !isLoading && (
            <div className="user-summary-box" style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Distributions Sent</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>
                    {userStats.totalSuiSent.toFixed(2)} SUI
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    ({userStats.distributionsMade} distributions)
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Distributions Received</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
                    +{userStats.totalSuiReceived.toFixed(2)} SUI
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    ({userStats.distributionsReceived} distributions)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <section className="stats-section">
            <div className="stats-grid">
              <div className="stat-card centered">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{isLoading ? '...' : stats.totalSuiDonated.toFixed(2)}</h3>
                  <p>{viewMode === 'mine' ? 'Total SUI Involved' : 'Total SUI Distributed'}</p>
                  <span className="stat-change neutral">{viewMode === 'mine' ? 'Sent + Received' : 'Lifetime total'}</span>
                </div>
              </div>
              
              <div className="stat-card centered">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{isLoading ? '...' : stats.uniqueWallets.toLocaleString()}</h3>
                  <p>{viewMode === 'mine' ? 'Recipients Reached' : 'Unique Recipients'}</p>
                  <span className="stat-change neutral">{viewMode === 'mine' ? 'From your distributions' : 'Across all distributions'}</span>
                </div>
              </div>
              
              <div className="stat-card centered">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{isLoading ? '...' : stats.totalDistributions}</h3>
                  <p>Total Distributions</p>
                  <span className="stat-change neutral">{viewMode === 'mine' ? 'Your distributions' : 'All time'}</span>
                </div>
              </div>
              
              <div className="stat-card centered">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{isLoading ? '...' : averageDistributionSize.toFixed(2)}</h3>
                  <p>Avg. Distribution Size</p>
                  <span className="stat-change neutral">SUI per distribution</span>
                </div>
              </div>
            </div>
          </section>

          {/* Distribution History */}
          <section className="tab-content">
            <div className="events-content">
              <div className="events-header">
                <h3>Distribution History</h3>
                <button 
                  className={`icon-button ${isRefreshing ? 'refreshing' : ''}`}
                  onClick={() => {
                    setIsRefreshing(true);
                    fetchStats(true);
                  }}
                  disabled={isLoading || isRefreshing}
                  title={isRefreshing ? 'Refreshing...' : 'Refresh data'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isRefreshing ? 'spinning' : ''}>
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>
              
              {isLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading distributions...</p>
                </div>
              ) : stats.distributions.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <h4>No distributions found</h4>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    {viewMode === 'mine' ? 'Start by creating your first distribution!' : 'No distributions have been made yet.'}
                  </p>
                  {viewMode === 'mine' && (
                    <button 
                      className="primary-button"
                      onClick={() => navigate('/create-event')}
                    >
                      Create Distribution
                    </button>
                  )}
                </div>
              ) : (
                <div className="distributions-table">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Event Name</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Total Amount</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Recipients</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Per Recipient</th>
                        {viewMode === 'mine' && <th style={{ padding: '1rem', textAlign: 'left' }}>Your Role</th>}
                        {viewMode === 'mine' && <th style={{ padding: '1rem', textAlign: 'left' }}>Your Amount</th>}
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.distributions.map((dist) => (
                        <tr key={dist.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '1rem' }}>{dist.eventName}</td>
                          <td style={{ padding: '1rem' }}>{dist.totalAmount.toFixed(2)} SUI</td>
                          <td style={{ padding: '1rem' }}>{dist.recipients.length}</td>
                          <td style={{ padding: '1rem' }}>{dist.amountPerRecipient.toFixed(4)} SUI</td>
                          {viewMode === 'mine' && (
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                background: dist.distributor === account?.address ? 'rgba(37, 99, 235, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                                color: dist.distributor === account?.address ? '#2563eb' : '#16a34a',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}>
                                {dist.distributor === account?.address ? 'Distributor' : 'Recipient'}
                              </span>
                            </td>
                          )}
                          {viewMode === 'mine' && (
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                fontWeight: '600',
                                color: dist.distributor === account?.address ? '#ef4444' : '#16a34a'
                              }}>
                                {dist.distributor === account?.address ? '-' : '+'}{' '}
                                {dist.distributor === account?.address ? dist.totalAmount.toFixed(2) : dist.amountPerRecipient.toFixed(4)} SUI
                              </span>
                            </td>
                          )}
                          <td style={{ padding: '1rem' }}>{formatDate(dist.timestamp)}</td>
                          <td style={{ padding: '1rem' }}>
                            <a 
                              href={`https://testnet.suivision.xyz/txblock/${dist.txDigest}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--primary)', textDecoration: 'none' }}
                            >
                              View →
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default FunctionalDashboard;