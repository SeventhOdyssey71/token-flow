import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContract } from '../../hooks/useContract';
import '../../App.css';
import './Dashboard.css';

interface EventData {
  id: string;
  name: string;
  creator: string;
  totalDeposited: any;
  recipients: string[];
  isActive: boolean;
  createdAt: string;
}

interface DisplayEvent {
  id: string;
  name: string;
  date: string;
  participants: number;
  status: 'active' | 'completed';
  tokensDistributed: number;
  successRate: number;
}

// Scrolling strip bar component
const ScrollingStripBar: React.FC = () => {
  // Placeholder data
  const events = [
    { address: '0xA1B2...C3D4', amount: '10', coin: 'SUI' },
    { address: '0xE5F6...7890', amount: '25', coin: 'SUI' },
    { address: '0x1234...5678', amount: '5', coin: 'SUI' },
    { address: '0x9ABC...DEF0', amount: '100', coin: 'SUI' },
    { address: '0xAAAA...BBBB', amount: '50', coin: 'SUI' },
  ];
  // Repeat the events to make the strip long enough
  const repeated = [...events, ...events, ...events];
  return (
    <div className="scrolling-strip-bar">
      <div className="scrolling-strip-content">
        {repeated.map((e, i) => (
          <span className="strip-item" key={i}>
            <span className="strip-address">{e.address}</span> just received <span className="strip-amount">{e.amount}</span> <span className="strip-coin">{e.coin}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const AirdropDashboard: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const { getUserEvents, distributeFunds } = useContract();
  const [activeTab, setActiveTab] = useState('overview');
  const [isVisible, setIsVisible] = useState(false);
  const [showDisconnectMenu, setShowDisconnectMenu] = useState(false);
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to home if no wallet is connected
    if (!account) {
      navigate('/');
      return;
    }
    setIsVisible(true);
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

  // Fetch user's events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!account) return;
      
      setIsLoadingEvents(true);
      try {
        const userEvents = await getUserEvents();
        
        // Transform event data for display
        const displayEvents: DisplayEvent[] = userEvents.map((event: EventData) => {
          const totalSui = event.totalDeposited?.value ? 
            parseInt(event.totalDeposited.value) / 1_000_000_000 : 0;
          
          return {
            id: event.id,
            name: event.name,
            date: new Date(parseInt(event.createdAt)).toISOString().split('T')[0],
            participants: event.recipients.length,
            status: event.isActive ? 'active' : 'completed',
            tokensDistributed: event.isActive ? 0 : totalSui,
            successRate: event.isActive ? 0 : 100,
          };
        });
        
        setEvents(displayEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [account, getUserEvents]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.wallet-status')) {
        setShowDisconnectMenu(false);
      }
    };

    if (showDisconnectMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDisconnectMenu]);

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  // Redirect to home if no wallet connected
  if (!account) {
    return null;
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const totalParticipants = events.reduce((sum, event) => sum + event.participants, 0);
  const totalTokens = events.reduce((sum, event) => sum + event.tokensDistributed, 0);
  const completedEvents = events.filter(event => event.status === 'completed').length;
  const activeEvents = events.filter(event => event.status === 'active');

  const handleDistributeFunds = async (eventId: string) => {
    try {
      const success = await distributeFunds(eventId);
      if (success) {
        setSuccessMessage('Funds distributed successfully!');
        // Refresh events
        const userEvents = await getUserEvents();
        const displayEvents: DisplayEvent[] = userEvents.map((event: EventData) => {
          const totalSui = event.totalDeposited?.value ? 
            parseInt(event.totalDeposited.value) / 1_000_000_000 : 0;
          
          return {
            id: event.id,
            name: event.name,
            date: new Date(parseInt(event.createdAt)).toISOString().split('T')[0],
            participants: event.recipients.length,
            status: event.isActive ? 'active' : 'completed',
            tokensDistributed: event.isActive ? 0 : totalSui,
            successRate: event.isActive ? 0 : 100,
          };
        });
        setEvents(displayEvents);
      }
    } catch (error) {
      console.error('Error distributing funds:', error);
    }
  };

  return (
    <div className="dashboard-app-container">
      {/* Top Feedback Bar */}
      <div className="feedback-bar top">
        Submit your feedback and questions <a href="#" className="feedback-link">here</a>
      </div>
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
            <div className="wallet-status">
              <div 
                className="wallet-indicator"
                onClick={() => setShowDisconnectMenu(!showDisconnectMenu)}
              >
                <div className="status-dot"></div>
                <span>{formatAddress(account.address)}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="dropdown-arrow">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              
              {showDisconnectMenu && (
                <div className="wallet-dropdown">
                  <div className="wallet-info">
                    <strong>Connected Wallet</strong>
                    <span>{account.address}</span>
                  </div>
                  <button 
                    className="disconnect-btn"
                    onClick={handleDisconnect}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Scrolling Strip Bar */}
      <ScrollingStripBar />

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
      <main className={`dashboard-main ${isVisible ? 'visible' : ''}`}>
        <div className="dashboard-container">
          {/* Header */}
          <header className="dashboard-header">
            <div className="header-content">
              <div className="welcome-section">
                <h1>Welcome back!</h1>
                <p>Manage your token distributions and track event analytics for {formatAddress(account.address)}</p>
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
                  <span>Create Event</span>
                </button>
              </div>
            </div>
          </header>

          {/* Stats Overview */}
          <section className="stats-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{isLoadingEvents ? '...' : totalParticipants.toLocaleString()}</h3>
                  <p>Total Participants</p>
                  <span className="stat-change neutral">{events.length} events</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{isLoadingEvents ? '...' : completedEvents}</h3>
                  <p>Events Completed</p>
                  <span className="stat-change neutral">{activeEvents.length} active</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>{isLoadingEvents ? '...' : totalTokens.toFixed(2)}</h3>
                  <p>SUI Distributed</p>
                  <span className="stat-change neutral">Total distributed</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>99.9%</h3>
                  <p>Success Rate</p>
                  <span className="stat-change neutral">Stable</span>
                </div>
              </div>
            </div>
          </section>

          {/* Tab Navigation */}
          <nav className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            <button 
              className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            <button 
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </nav>

          {/* Tab Content */}
          <section className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-content">
                <div className="overview-grid">
                  {/* Quick Actions */}
                  <div className="quick-actions-card">
                    <h3>Quick Actions</h3>
                    <div className="actions-grid">
                      <button 
                        className="action-item"
                        onClick={() => navigate('/create-event')}
                      >
                        <div className="action-icon">📝</div>
                        <div className="action-text">
                          <h4>Create Event</h4>
                          <p>Start a new token distribution</p>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14m-7-7l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <button className="action-item">
                        <div className="action-icon">📊</div>
                        <div className="action-text">
                          <h4>View Analytics</h4>
                          <p>Check event performance</p>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14m-7-7l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <button className="action-item">
                        <div className="action-icon">⚙️</div>
                        <div className="action-text">
                          <h4>Settings</h4>
                          <p>Configure your account</p>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14m-7-7l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <button className="action-item">
                        <div className="action-icon">📋</div>
                        <div className="action-text">
                          <h4>Export Data</h4>
                          <p>Download event reports</p>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14m-7-7l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="recent-activity-card">
                    <h3>Recent Activity</h3>
                    {isLoadingEvents ? (
                      <div className="activity-list">
                        <p>Loading events...</p>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="activity-list">
                        <p>No events yet. Create your first event to get started!</p>
                      </div>
                    ) : (
                      <div className="activity-list">
                        {events.slice(0, 3).map((event) => (
                          <div key={event.id} className="activity-item">
                            <div className={`activity-dot ${event.status}`}></div>
                            <div className="activity-content">
                              <h4>{event.name} {event.status === 'completed' ? 'completed' : 'is active'}</h4>
                              <p>
                                {event.participants} participants
                                {event.status === 'completed' && ` • ${event.tokensDistributed} SUI distributed`}
                              </p>
                              <span className="activity-time">
                                {new Date(event.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="events-content">
                <div className="events-header">
                  <h3>Your Events</h3>
                  <button 
                    className="create-event-btn"
                    onClick={() => navigate('/create-event')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    New Event
                  </button>
                </div>
                
                {isLoadingEvents ? (
                  <div className="events-grid">
                    <p>Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="events-empty">
                    <p>No events found. Create your first event to get started!</p>
                  </div>
                ) : (
                  <div className="events-grid">
                    {events.map((event) => (
                      <div key={event.id} className={`event-card ${event.status}`}>
                        <div className="event-header">
                          <h4>{event.name}</h4>
                          <span className={`status-badge ${event.status}`}>
                            {event.status === 'completed' ? 'Completed' : 'Active'}
                          </span>
                        </div>
                        
                        <div className="event-stats">
                          <div className="event-stat">
                            <span className="stat-label">Participants</span>
                            <span className="stat-value">{event.participants}</span>
                          </div>
                          <div className="event-stat">
                            <span className="stat-label">SUI</span>
                            <span className="stat-value">{event.tokensDistributed.toFixed(2)}</span>
                          </div>
                          <div className="event-stat">
                            <span className="stat-label">Success Rate</span>
                            <span className="stat-value">{event.successRate}%</span>
                          </div>
                        </div>
                        
                        <div className="event-date">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        
                        <div className="event-actions">
                          <button className="view-details-btn">View Details</button>
                          {event.status === 'active' && (
                            <button 
                              className="manage-btn"
                              onClick={() => handleDistributeFunds(event.id)}
                            >
                              Distribute Funds
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="analytics-content">
                <h3>Analytics Dashboard</h3>
                <div className="analytics-placeholder">
                  <div className="placeholder-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <h4>Advanced Analytics Coming Soon</h4>
                  <p>Detailed insights into your token distribution performance, participant engagement, and success metrics.</p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-content">
                <h3>Settings</h3>
                <div className="settings-sections">
                  <div className="settings-section">
                    <h4>Profile Settings</h4>
                    <div className="setting-item">
                      <label>Display Name</label>
                      <input type="text" placeholder="Enter your display name" />
                    </div>
                    <div className="setting-item">
                      <label>Email Notifications</label>
                      <label className="toggle">
                        <input type="checkbox" defaultChecked />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="settings-section">
                    <h4>Event Defaults</h4>
                    <div className="setting-item">
                      <label>Default Token Amount</label>
                      <input type="number" placeholder="100" />
                    </div>
                    <div className="setting-item">
                      <label>Auto-close Events</label>
                      <label className="toggle">
                        <input type="checkbox" />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AirdropDashboard;