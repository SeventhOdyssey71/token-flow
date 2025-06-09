import { useState, useEffect, useRef } from 'react'
import './App.css'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { useTheme } from './contexts/ThemeContext'
import { Link, useNavigate } from 'react-router-dom'
import WalletStatus from './components/WalletStatus'

// Mouse tracking hook for parallax effects
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return mousePosition;
};

// Scroll progress hook
const useScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = (window.scrollY / height) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', updateScrollProgress);
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  return scrollProgress;
};

function App() {
  const { isDarkMode, toggleTheme } = useTheme();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mousePosition = useMousePosition();
  const scrollProgress = useScrollProgress();
  const heroRef = useRef<HTMLElement>(null);

  const handleGetStarted = () => {
    if (account) {
      navigate('/dashboard');
    } else {
      // Scroll to a connect wallet section or show connection prompt
      document.querySelector('.nav-actions')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  useEffect(() => {
    setIsVisible(true);
    
    // Testimonial rotation
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % 3);
    }, 4000);

    return () => clearInterval(testimonialInterval);
  }, []);

  // Close mobile menu on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen]);

  // Parallax effect for hero elements
  const parallaxTransform = `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`;
  const parallaxTransformInverse = `translate(${mousePosition.x * -0.005}px, ${mousePosition.y * -0.005}px)`;

  const testimonials = [
    {
      text: "TokenFlow made our event distribution seamless. Over 500 attendees received tokens instantly!",
      author: "Sarah Chen",
      role: "Event Organizer, Lagos Tech Week"
    },
    {
      text: "The most intuitive token distribution tool I've used. Our community loves the simplicity.",
      author: "Michael Okoye",
      role: "Community Lead, Web3 Bridge"
    },
    {
      text: "Built by Nigerians for the world. TokenFlow represents the best of African innovation.",
      author: "Amara Okafor",
      role: "Founder, Africa Web3 Alliance"
    }
  ];

  return (
    <div className="app-container">
      {/* Scroll Progress Indicator */}
      <div 
        className="scroll-progress"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Navigation Header */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <svg className="brand-logo" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" />
                  <stop offset="100%" stopColor="currentColor" opacity="0.6" />
                </linearGradient>
                <filter id="logo-glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <rect x="4" y="4" width="10" height="10" rx="2" fill="url(#logo-gradient)" filter="url(#logo-glow)" />
              <rect x="18" y="4" width="10" height="10" rx="2" fill="url(#logo-gradient)" filter="url(#logo-glow)" opacity="0.8" />
              <rect x="4" y="18" width="10" height="10" rx="2" fill="url(#logo-gradient)" filter="url(#logo-glow)" opacity="0.6" />
              <rect x="18" y="18" width="10" height="10" rx="2" fill="url(#logo-gradient)" filter="url(#logo-glow)" opacity="0.9" />
              <path d="M14 14 L26 26 M26 14 L14 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            </svg>
            <span className="brand-name">TokenFlow</span>
            <span className="beta-badge desktop-only">Beta</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="nav-actions desktop-nav">
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <a href="#features" className="nav-link">Features</a>
            <a href="#events" className="nav-link">Events</a>
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

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <Link 
              to="/dashboard" 
              className="mobile-menu-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Dashboard
            </Link>
            
            <a 
              href="#features" 
              className="mobile-menu-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Features
            </a>
            
            <a 
              href="#events" 
              className="mobile-menu-item"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Events
            </a>
            
            <button 
              className="theme-toggle-mobile"
              onClick={toggleTheme}
            >
              {isDarkMode ? (
                <>
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
                  Light Mode
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  Dark Mode
                </>
              )}
            </button>
            
            <div className="mobile-wallet-section">
              {account ? (
                <WalletStatus />
              ) : (
                <ConnectButton connectText="Connect Wallet" />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className={`hero-section ${isVisible ? 'visible' : ''}`}>
        <div className="hero-background">
          <div 
            className="floating-orb orb-1"
            style={{ transform: parallaxTransform }}
          />
          <div 
            className="floating-orb orb-2"
            style={{ transform: parallaxTransformInverse }}
          />
          <div 
            className="floating-orb orb-3"
            style={{ transform: parallaxTransform }}
          />
          
          {/* Animated Grid Dots */}
          <div className="grid-dots">
            {Array.from({ length: 50 }, (_, i) => (
              <div 
                key={i} 
                className="grid-dot"
                style={{
                  animationDelay: `${Math.random() * 2}s`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            Now in Beta
          </div>
          
          <h1 className="hero-title">
            <span className="gradient-text">Simple Token</span>
            <br />
            <span className="gradient-text-secondary">Distribution</span>
            <span className="title-decoration">
              
            </span>
          </h1>
          
          <p className="hero-description">
            TokenFlow revolutionizes token distribution with a community-first approach. 
            Built by Nigerian developers for the global Web3 ecosystem, making token distribution 
            <span className="highlight-text"> effortless and secure</span>.
          </p>
          
          <div className="hero-actions">
            <button onClick={handleGetStarted} className="primary-button">
              <span>{account ? 'Go to Dashboard' : 'Connect Wallet to Start'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
              <div className="button-glow"></div>
            </button>
            <a href="#features" className="secondary-button">
              <span>Explore Features</span>
              <div className="button-ripple"></div>
            </a>
          </div>
          
      
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonial-container">
          <div className="testimonial-content">
            <div className="testimonial-quote">
              <svg viewBox="0 0 24 24" fill="currentColor" className="quote-icon">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
              </svg>
            </div>
            <div className="testimonials-slider">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className={`testimonial ${index === currentTestimonial ? 'active' : ''}`}
                >
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <strong>{testimonial.author}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="testimonial-indicators">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentTestimonial ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonial(index)}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <div className="section-badge">
            <span>✨ Features</span>
          </div>
          <h2 className="section-title">Why Choose TokenFlow?</h2>
          <p className="section-description">
            Everything you need for seamless token distribution, built with love by the community
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card" data-tilt>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h3>Secure & Reliable</h3>
            <p>Built on Sui blockchain with enterprise-grade security, instant finality, and zero downtime. Your tokens are always safe.</p>
            <div className="feature-hover-effect"></div>
          </div>
          
          <div className="feature-card" data-tilt>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="19" x2="12" y2="21" />
              </svg>
            </div>
            <h3>User Friendly</h3>
            <p>Intuitive interface designed for both technical and non-technical users. No blockchain expertise required.</p>
            <div className="feature-hover-effect"></div>
          </div>
          
          <div className="feature-card" data-tilt>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>Lightning Fast</h3>
            <p>Sub-second transaction finality means instant token distribution. No more waiting, no more delays.</p>
            <div className="feature-hover-effect"></div>
          </div>
          
          <div className="feature-card" data-tilt>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>Community Driven</h3>
            <p>Built by the community, for the community. Open source, transparent, and continuously improving.</p>
            <div className="feature-hover-effect"></div>
          </div>
        </div>
      </section>

      {/* Recent Events Section */}
      <section id="events" className="events-showcase">
        <div className="section-header">
          <div className="section-badge">
            <span> Success Stories</span>
          </div>
          <h2 className="section-title">Recent Events</h2>
          <p className="section-description">
            See how communities across Africa are using TokenFlow to power their events
          </p>
        </div>
        <div className="events-carousel">
          <div className="event-showcase-card">
            <div className="event-image">
              <div className="event-badge">Lagos</div>
              <div className="event-pattern"></div>
            </div>
            <div className="event-info">
              <div className="event-meta">
                <span className="event-date">March 2024</span>
                <span className="event-type">Tech Meetup</span>
              </div>
              <h3>Walrus Protocol Launch</h3>
              <p>500+ attendees • 10,000 WALRUS tokens distributed • Zero failed transactions</p>
              <a href="#" className="event-link">
                <span>View on Explorer</span>
                  
                
              </a>
            </div>
          </div>
          
          <div className="event-showcase-card">
            <div className="event-image">
              <div className="event-badge">Benin City</div>
              <div className="event-pattern"></div>
            </div>
            <div className="event-info">
              <div className="event-meta">
                <span className="event-date">February 2024</span>
                <span className="event-type">Workshop</span>
              </div>
              <h3>Web3 Builders Workshop</h3>
              <p>200+ developers • 5,000 BUILD tokens • Real-time analytics</p>
              <a href="#" className="event-link">
                <span>View on Explorer</span>
                
                 
                
              </a>
            </div>
          </div>
          
          <div className="event-showcase-card">
            <div className="event-image">
              <div className="event-badge">Abuja</div>
              <div className="event-pattern"></div>
            </div>
            <div className="event-info">
              <div className="event-meta">
                <span className="event-date">January 2024</span>
                <span className="event-type">Conference</span>
              </div>
              <h3>Africa Web3 Summit</h3>
              <p>1000+ attendees • 25,000 SUMMIT tokens • Multi-chain support</p>
              <a href="#" className="event-link">
                <span>View on Explorer</span>
                
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <div className="cta-badge">
            <span>🚀 Ready to Launch?</span>
          </div>
          <h2>Start Distributing Tokens Today</h2>
          <p>Join the hundreds of communities already using TokenFlow to power their token distribution events across Africa and beyond.</p>
          <button onClick={handleGetStarted} className="cta-button">
            <span>{account ? 'Go to Dashboard' : 'Connect Wallet First'}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </button>
          <div className="cta-stats">
          
          
           
          </div>
        </div>
        <div className="cta-decoration">
          <svg viewBox="0 0 400 300" className="cta-svg">
            <defs>
              <linearGradient id="cta-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.05" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="150" r="120" fill="url(#cta-gradient)" className="pulse-circle" />
            <circle cx="200" cy="150" r="80" fill="url(#cta-gradient)" className="pulse-circle-delayed" />
            <circle cx="200" cy="150" r="40" fill="url(#cta-gradient)" className="pulse-circle" />
          </svg>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <svg className="footer-logo" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="10" height="10" rx="2" fill="currentColor" opacity="0.9" />
                <rect x="18" y="4" width="10" height="10" rx="2" fill="currentColor" opacity="0.7" />
                <rect x="4" y="18" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
                <rect x="18" y="18" width="10" height="10" rx="2" fill="currentColor" opacity="0.8" />
              </svg>
              <h4>TokenFlow</h4>
            </div>
            <p>Empowering Web3 communities across Africa with simple, secure token distribution.</p>
            <div className="footer-social">
              <a href="#" aria-label="Twitter">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" aria-label="Discord">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.191.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a href="#" aria-label="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#events">Events</a>
            <a href="/dashboard">Dashboard</a>
            <a href="#">Documentation</a>
            <a href="#">API</a>
          </div>
          
          <div className="footer-section">
            <h4>Community</h4>
            <a href="#">Discord Server</a>
            <a href="#">Twitter</a>
            <a href="#">GitHub</a>
            <a href="#">Blog</a>
            <a href="#">Newsletter</a>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Contact Us</a>
            <a href="#">Bug Reports</a>
            <a href="#">Feature Requests</a>
            <a href="#">Status Page</a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; 2024 TokenFlow. Built with ❤️ by the Nigerian Web3 Community</p>
            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <span>•</span>
              <a href="#">Terms of Service</a>
              <span>•</span>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App