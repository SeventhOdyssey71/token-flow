import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { useTheme } from '../contexts/ThemeContext';
import { useContract } from '../hooks/useContract';
import WalletStatus from './WalletStatus';
import '../App.css';
import './dashboard/Dashboard.css';
import './CreateEvent.css';

interface ParsedAddress {
  address: string;
  isValid: boolean;
}

const CreateEvent: React.FC = () => {
  useTheme(); // Using theme context
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    createAndDistribute,
    isLoading: contractLoading, 
    error: contractError 
  } = useContract();

  // Form state
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [recipients, setRecipients] = useState<ParsedAddress[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [manualAddresses, setManualAddresses] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Redirect if no wallet connected
  React.useEffect(() => {
    if (!account) {
      navigate('/');
    }
  }, [account, navigate]);

  if (!account) {
    return null;
  }

  const validateSuiAddress = (address: string): boolean => {
    // Basic Sui address validation (64 characters, starts with 0x)
    return /^0x[a-fA-F0-9]{64}$/.test(address.trim());
  };

  const parseCSV = (text: string): ParsedAddress[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const addresses: ParsedAddress[] = [];
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        // Support both single addresses per line and CSV format
        const parts = trimmedLine.split(',').map(part => part.trim());
        parts.forEach(part => {
          if (part) {
            addresses.push({
              address: part,
              isValid: validateSuiAddress(part)
            });
          }
        });
      }
    });
    
    return addresses;
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsedAddresses = parseCSV(text);
        setRecipients(parsedAddresses);
      };
      reader.readAsText(file);
    }
  };

  const handleManualAddresses = () => {
    const parsedAddresses = parseCSV(manualAddresses);
    setRecipients([...recipients, ...parsedAddresses]);
    setManualAddresses('');
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!eventName.trim()) {
      newErrors.eventName = 'Event name is required';
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      newErrors.totalAmount = 'Please enter a valid amount greater than 0';
    }

    if (recipients.length === 0) {
      newErrors.recipients = 'Please add at least one recipient';
    }

    const invalidRecipients = recipients.filter(r => !r.isValid);
    if (invalidRecipients.length > 0) {
      newErrors.recipients = `${invalidRecipients.length} invalid address(es) found`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateCSVTemplate = () => {
    const template = `wallet_address
0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wallet_addresses_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Create and distribute funds immediately in one transaction
      const success = await createAndDistribute({
        name: eventName,
        totalAmount: parseFloat(totalAmount),
        recipients: validRecipients.map(r => r.address)
      });

      if (!success) {
        throw new Error('Failed to distribute funds');
      }
      
      // Navigate back to dashboard with success
      navigate('/dashboard', { 
        state: { 
          message: 'Funds distributed successfully!' 
        } 
      });
    } catch (error: unknown) {
      console.error('Error creating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrors({ 
        general: contractError?.message || errorMessage || 'Failed to create event. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validRecipients = recipients.filter(r => r.isValid);
  const amountPerRecipient = validRecipients.length > 0 ? parseFloat(totalAmount) / validRecipients.length : 0;

  return (
    <div className="dashboard-app-container">
      {/* Navigation */}
      <nav className="dashboard-navbar">
        <div className="nav-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            className="secondary-button"
            style={{ 
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              padding: 'var(--space-md) var(--space-lg)',
              borderRadius: '8px',
              fontSize: 'var(--text-sm)',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              marginRight: '1.5rem'
            }}
          >
            ← Back to Dashboard
          </button>
          {account ? (
            <WalletStatus />
          ) : (
            <ConnectButton connectText="Connect Wallet" />
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main visible">
        <div className="dashboard-container">
          {/* Header */}
          <header className="dashboard-header">
            <div className="header-content">
              <div className="welcome-section">
                <h1>Create Distribution Event</h1>
                <p>Set up a new token distribution for your community</p>
              </div>
            </div>
          </header>

          {/* Create Event Form */}
          <div className="create-event-container">
            <div className="create-event-card">
              <div className="step-indicator">
                <div className={`step ${step >= 1 ? 'active' : ''}`}>
                  <span>1</span>
                  <label>Event Details</label>
                </div>
                <div className="step-connector"></div>
                <div className={`step ${step >= 2 ? 'active' : ''}`}>
                  <span>2</span>
                  <label>Recipients</label>
                </div>
                <div className="step-connector"></div>
                <div className={`step ${step >= 3 ? 'active' : ''}`}>
                  <span>3</span>
                  <label>Review & Create</label>
                </div>
              </div>

              {step === 1 && (
                <div className="form-step">
                  <h3>Event Information</h3>
                  
                  <div className="form-group">
                    <label htmlFor="eventName">Event Name *</label>
                    <input
                      type="text"
                      id="eventName"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Enter event name (e.g., Lagos Tech Week Airdrop)"
                      className={errors.eventName ? 'error' : ''}
                    />
                    {errors.eventName && <span className="error-message">{errors.eventName}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="eventDescription">Description (Optional)</label>
                    <textarea
                      id="eventDescription"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Describe your token distribution event..."
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="totalAmount">Total Amount (SUI) *</label>
                    <input
                      type="number"
                      id="totalAmount"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.001"
                      min="0"
                      className={errors.totalAmount ? 'error' : ''}
                    />
                    {errors.totalAmount && <span className="error-message">{errors.totalAmount}</span>}
                  </div>

                  <div className="form-actions">
                    <button 
                      onClick={() => setStep(2)}
                      className="primary-button"
                      disabled={!eventName.trim() || !totalAmount || parseFloat(totalAmount) <= 0}
                    >
                      Next: Add Recipients
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14m-7-7l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="form-step">
                  <h3>Add Recipients</h3>
                  
                  <div className="upload-section">
                    <div className="upload-methods">
                      <div className="upload-method">
                        <h4>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14,2 14,8 20,8" />
                          </svg>
                          Upload CSV File
                        </h4>
                        <p>Upload a CSV file with wallet addresses</p>
                        <div className="upload-actions">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleCSVUpload}
                            accept=".csv,.txt"
                            style={{ display: 'none' }}
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="upload-button"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Choose File
                          </button>
                          <button 
                            onClick={generateCSVTemplate}
                            className="template-button"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14,2 14,8 20,8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10,9 9,9 8,9" />
                            </svg>
                            Download Template
                          </button>
                        </div>
                        {csvFile && (
                          <div className="file-info">
                            <span>Uploaded: {csvFile.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="divider">OR</div>

                      <div className="upload-method">
                        <h4>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Manual Entry
                        </h4>
                        <p>Paste wallet addresses (one per line)</p>
                        <textarea
                          value={manualAddresses}
                          onChange={(e) => setManualAddresses(e.target.value)}
                          placeholder="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&#10;0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
                          rows={4}
                          className="manual-input"
                        />
                        <button 
                          onClick={handleManualAddresses}
                          className="add-button"
                          disabled={!manualAddresses.trim()}
                        >
                          Add Addresses
                        </button>
                      </div>
                    </div>
                  </div>

                  {recipients.length > 0 && (
                    <div className="recipients-section">
                      <h4>Recipients ({recipients.length})</h4>
                      <div className="recipients-summary">
                        <div className="summary-item">
                          <span className="summary-label">Valid Addresses:</span>
                          <span className="summary-value valid">{validRecipients.length}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Invalid Addresses:</span>
                          <span className="summary-value invalid">{recipients.length - validRecipients.length}</span>
                        </div>
                      </div>
                      
                      <div className="recipients-list">
                        {recipients.map((recipient, index) => (
                          <div key={index} className={`recipient-item ${recipient.isValid ? 'valid' : 'invalid'}`}>
                            <span className="recipient-address">{recipient.address}</span>
                            <div className="recipient-actions">
                              {recipient.isValid ? (
                                <span className="status-badge valid">Valid</span>
                              ) : (
                                <span className="status-badge invalid">Invalid</span>
                              )}
                              <button 
                                onClick={() => removeRecipient(index)}
                                className="remove-button"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {errors.recipients && (
                    <div className="error-message">{errors.recipients}</div>
                  )}

                  <div className="form-actions">
                    <button 
                      onClick={() => setStep(1)}
                      className="secondary-button"
                    >
                      ← Back
                    </button>
                    <button 
                      onClick={() => setStep(3)}
                      className="primary-button"
                      disabled={validRecipients.length === 0}
                    >
                      Next: Review
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14m-7-7l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="form-step">
                  <h3>Review & Create Event</h3>
                  
                  <div className="review-section">
                    <div className="review-card">
                      <h4>Event Summary</h4>
                      <div className="review-item">
                        <span className="review-label">Event Name:</span>
                        <span className="review-value">{eventName}</span>
                      </div>
                      {eventDescription && (
                        <div className="review-item">
                          <span className="review-label">Description:</span>
                          <span className="review-value">{eventDescription}</span>
                        </div>
                      )}
                      <div className="review-item">
                        <span className="review-label">Total Amount:</span>
                        <span className="review-value">{totalAmount} SUI</span>
                      </div>
                      <div className="review-item">
                        <span className="review-label">Recipients:</span>
                        <span className="review-value">{validRecipients.length} addresses</span>
                      </div>
                      <div className="review-item highlight">
                        <span className="review-label">Amount per recipient:</span>
                        <span className="review-value">{amountPerRecipient.toFixed(6)} SUI</span>
                      </div>
                    </div>
                  </div>

                  {errors.general && (
                    <div className="error-message">{errors.general}</div>
                  )}

                  <div className="form-actions">
                    <button 
                      onClick={() => setStep(2)}
                      className="secondary-button"
                      disabled={isLoading}
                    >
                      ← Back
                    </button>
                    <button 
                      onClick={handleCreateEvent}
                      className="primary-button"
                      disabled={isLoading || contractLoading}
                    >
                      {(isLoading || contractLoading) ? (
                        <>
                          <div className="spinner"></div>
                          Creating Event...
                        </>
                      ) : (
                        <>
                          Create Event
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateEvent;