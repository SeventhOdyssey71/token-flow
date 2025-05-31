import { useState, useEffect } from 'react'
import './App.css'
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { Link } from 'react-router-dom'
import CSVUploader from './components/CSVUploader'
import './components/CSVUploader.css'
import './components/ConnectButtonStyles.css'

// Mainnet deployed contract address and Splitter object ID
const PACKAGE_ID = "0x0b06ccbf49c99410c3f1584cebaaf1e027c73f5407e1608804d7a2c23bb9bea1"
// Mainnet Splitter object ID
const SPLITTER_ID = "0x3b2dc3d948be777433677be129102a1cde8d9410b555127043f1779e7cb77b27"

function App() {
  // State for token amount and recipients
  const [tokenAmount, setTokenAmount] = useState('')
  const [recipients, setRecipients] = useState([''])
  const [splitType, setSplitType] = useState('equal')
  const [amounts, setAmounts] = useState([''])
  
  // Animation state for UI transitions
  const [isFormVisible, setIsFormVisible] = useState(false)
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  
  // Get the current account for display purposes
  const account = useCurrentAccount()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  
  // Transaction status state
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txMessage, setTxMessage] = useState('')
  const [txDigest, setTxDigest] = useState('')
  
  // Show form with animation after component mounts
  useEffect(() => {
    setTimeout(() => setIsFormVisible(true), 100)
  }, [])
  
  // Apply theme when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  
  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }
  
  // Get account address for display
  const accountAddress = account?.address
  
  // Add a new recipient field
  const addRecipient = () => {
    setRecipients([...recipients, ''])
    setAmounts([...amounts, ''])
  }
  
  // Update recipient at specific index
  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients]
    newRecipients[index] = value
    setRecipients(newRecipients)
  }
  
  // Update amount at specific index
  const updateAmount = (index: number, value: string) => {
    const newAmounts = [...amounts]
    newAmounts[index] = value
    setAmounts(newAmounts)
  }
  
  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      const newRecipients = [...recipients]
      const newAmounts = [...amounts]
      newRecipients.splice(index, 1)
      newAmounts.splice(index, 1)
      setRecipients(newRecipients)
      setAmounts(newAmounts)
    }
  }
  
  // Execute transaction directly from the browser
  const executeTokenSplit = async () => {
    if (!account) {
      setTxStatus('error')
      setTxMessage('Please connect your wallet first')
      return
    }
    
    try {
      setTxStatus('pending')
      setTxMessage('Processing transaction...')
      
      // Filter out empty recipients
      const validRecipients = recipients.filter(r => r.trim() !== '')
      
      if (validRecipients.length === 0) {
        setTxStatus('error')
        setTxMessage('Please add at least one recipient')
        return
      }
      
      // Create a new transaction
      const tx = new Transaction()
      
      // Convert SUI to MIST (1 SUI = 10^9 MIST)
      const amountInMist = Math.floor(Number(tokenAmount) * 1_000_000_000)
      
      // Create a coin to split from the connected wallet
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)])
      
      if (splitType === 'equal') {
        // Call the split_funds_equal function
        tx.moveCall({
          target: `${PACKAGE_ID}::splitter::split_funds_equal`,
          arguments: [
            tx.object(SPLITTER_ID),
            coin,
            tx.pure.vector("address", validRecipients)
          ],
          typeArguments: ['0x2::sui::SUI']
        })
      } else {
        // Convert string amounts to numbers (in MIST)
        const validAmounts = amounts
          .slice(0, validRecipients.length)
          .map(amount => Math.floor(Number(amount) * 1_000_000_000))
        
        // Call the airdrop_funds function
        tx.moveCall({
          target: `${PACKAGE_ID}::splitter::airdrop_funds`,
          arguments: [
            tx.object(SPLITTER_ID),
            coin,
            tx.pure.vector("address", validRecipients),
            tx.pure.vector("u64", validAmounts)
          ],
          typeArguments: ['0x2::sui::SUI']
        })
      }
      
      // Sign and execute the transaction
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result)
            setTxStatus('success')
            setTxDigest(result.digest)
            setTxMessage(`Transaction successful! Digest: ${result.digest}`)
          },
          onError: (error) => {
            console.error('Transaction failed:', error)
            setTxStatus('error')
            setTxMessage(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`)
          }
        }
      )
      
    } catch (error) {
      console.error('Error preparing transaction:', error)
      setTxStatus('error')
      setTxMessage(`Error preparing transaction: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  return (
    <div className="app-container">
      <header>
        <h1>
          <span className="logo">
            <svg className="logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0052cc" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Main circular flow path */}
              <path className="flow-path" d="M12,3c4.97,0,9,4.03,9,9s-4.03,9-9,9s-9-4.03-9-9S7.03,3,12,3 M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2L12,2z" />
              
              {/* Tokens/coins */}
              <circle className="token token-1" cx="12" cy="7" r="2" />
              <circle className="token token-2" cx="7" cy="12" r="2" />
              <circle className="token token-3" cx="12" cy="17" r="2" />
              <circle className="token token-4" cx="17" cy="12" r="2" />
              
              {/* Flow arrows */}
              <path className="flow-arrow" d="M9.5,9.5L7,12l2.5,2.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              <path className="flow-arrow" d="M14.5,14.5L17,12l-2.5,-2.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="title-text">Token <span className="flow-text">Flow</span><span className="beta-tag">Beta</span></span>
        </h1>
        <div className="wallet-connection">
          <div className="theme-toggle-wrapper">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme} 
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <div className="toggle-track">
                <div className="toggle-moon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </div>
                <div className="toggle-sun">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
                    <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
                    <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
                    <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line>
                  </svg>
                </div>
                <div className={`toggle-thumb ${theme === 'dark' ? 'toggle-checked' : ''}`}></div>
              </div>
            </button>
          </div>
          <div className="wallet-button-wrapper">
            <ConnectButton connectText="Connect Wallet" />
            {accountAddress && (
              <div className="connected-address">
                <span className="connected-dot"></span>
                {accountAddress.substring(0, 6)}...{accountAddress.substring(accountAddress.length - 4)}
              </div>
            )}
            <Link to="/dashboard" className="dashboard-link">
              <button className="dashboard-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Address Dashboard
              </button>
            </Link>
          </div>
        </div>
      </header>
      {account ? (
      <div className={`split-form ${isFormVisible ? 'visible' : ''}`}>
        <div className="form-section">
          <h2><span className="section-icon">💰</span>Share SUI Tokens</h2>
          <div className="form-group">
            <label htmlFor="amount">Amount to Share (SUI)</label>
            <div className="input-with-icon">
              <input
                id="amount"
                type="number"
                min="0.1"
                step="0.1"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="Enter amount (min 0.1 SUI)"
              />
              <span className="input-icon">SUI</span>
            </div>
          </div>
          <div className="form-group">
            <label>Method of Sharing</label>
            <select 
              value={splitType} 
              onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
            >
              <option value="equal">Share Equally</option>
              <option value="custom">Specific Amounts</option>
            </select>
          </div>
        </div>
        <div className="form-section">
          <h2><span className="section-icon">👥</span>Recipients</h2>
          <div className="import-options">
            <CSVUploader onAddressesLoaded={(addresses, amounts) => {
              // Replace existing recipients with the loaded ones
              setRecipients(addresses);
              
              // If we have amounts and we're in custom mode, update those too
              if (splitType === 'custom' && amounts && amounts.length > 0) {
                setAmounts(amounts);
              }
            }} />
          </div>
          <div className="recipients-container">
            {recipients.map((recipient, index) => (
              <div key={index} className="recipient-row">
                <div className="recipient-number">{index + 1}</div>
                <div className="recipient-inputs">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    placeholder={`Recipient address`}
                  />
                  {splitType === 'custom' && (
                    <div className="input-with-icon custom-amount">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={amounts[index] || ''}
                        onChange={(e) => updateAmount(index, e.target.value)}
                        placeholder="Amount"
                      />
                      <span className="input-icon">SUI</span>
                    </div>
                  )}
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeRecipient(index)}
                  disabled={recipients.length <= 1}
                  aria-label="Remove recipient"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="recipient-actions">
            <button className="add-btn" onClick={addRecipient}>Add Recipient</button>
            {recipients.length > 1 && (
              <button 
                className="clear-btn" 
                onClick={() => {
                  setRecipients(['']);
                  setAmounts(['']);
                }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
        <button 
          className="split-btn"
          onClick={executeTokenSplit}
          disabled={
            txStatus === 'pending' || 
            !tokenAmount || 
            Number(tokenAmount) < 0.1 || 
            recipients.every(r => !r.trim()) ||
            !account
          }
        >
          {txStatus === 'pending' ? (
            <>
              <span className="loading-spinner"></span>
              Processing...
            </>
          ) : (
            'Send'
          )}
        </button>
        
        {txStatus !== 'idle' && (
          <div className={`status-message ${txStatus}`}>
            {txMessage}
            {txStatus === 'success' && txDigest && (
              <div className="tx-link">
                <a href={`https://suiexplorer.com/txblock/${txDigest}?network=testnet`} target="_blank" rel="noopener noreferrer">
                  View transaction in explorer
                </a>
              </div>
            )}
          </div>
        )}
        
        <div className="instructions">
          <h3><span className="instruction-icon">💡</span>How to use</h3>
          <ol>
            <li>Connect your wallet</li>
            <li>Enter the amount of SUI you want to share</li>
            <li>Choose method of sharing (share equally or specific amounts)</li>
            <li>Add recipient addresses</li>
            <li>Click "Send" to execute the transaction</li>
          </ol>
        </div>
      </div>
      ) : (
        <div className={`connect-prompt ${isFormVisible ? 'visible' : ''}`}>
          <div className="connect-badge">Welcome to</div>
          <div className="connect-icon">
            <svg className="welcome-logo-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="welcome-flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0052cc" stopOpacity="0.8" />
                </linearGradient>
                <filter id="welcome-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="0.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Main circular flow path */}
              <path className="welcome-flow-path" d="M12,3c4.97,0,9,4.03,9,9s-4.03,9-9,9s-9-4.03-9-9S7.03,3,12,3 M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2L12,2z" />
              
              {/* Tokens/coins */}
              <circle className="welcome-token welcome-token-1" cx="12" cy="7" r="2" />
              <circle className="welcome-token welcome-token-2" cx="7" cy="12" r="2" />
              <circle className="welcome-token welcome-token-3" cx="12" cy="17" r="2" />
              <circle className="welcome-token welcome-token-4" cx="17" cy="12" r="2" />
              
              {/* Flow arrows */}
              <path className="welcome-flow-arrow" d="M9.5,9.5L7,12l2.5,2.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              <path className="welcome-flow-arrow" d="M14.5,14.5L17,12l-2.5,-2.5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </div>
          <h2>Welcome to Token Flow</h2>
          <p>Please connect your wallet to share your SUI tokens between multiple addresses.</p>
          <ConnectButton connectText="Connect Wallet" />
        </div>
      )}
    </div>
  )
}

export default App
