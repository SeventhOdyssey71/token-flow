import { useState } from 'react';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';

export default function WalletStatus() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!account) return null;

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-status">
      <button
        className="wallet-indicator"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="status-dot"></div>
        <span>{truncateAddress(account.address)}</span>
        <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      
      {showDropdown && (
        <div className="wallet-dropdown">
          <div className="wallet-info">
            <strong>Connected Wallet</strong>
            <span>{account.address}</span>
          </div>
          <button
            className="disconnect-btn"
            onClick={() => {
              disconnect();
              setShowDropdown(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
            </svg>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}