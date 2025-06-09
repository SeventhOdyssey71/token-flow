import React, { useEffect, useState } from 'react';
import { useContract } from '../hooks/useContract';
import './ScrollingDistributionBar.css';

interface DistributionItem {
  address: string;
  amount: number;
}

const ScrollingDistributionBar: React.FC = () => {
  const { getDistributionHistory } = useContract();
  const [distributions, setDistributions] = useState<DistributionItem[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let mounted = true;
    let abortController: AbortController | null = null;

    const fetchDistributions = async () => {
      // Cancel any previous request
      if (abortController) {
        abortController.abort();
      }
      
      abortController = new AbortController();
      
      try {
        const history = await getDistributionHistory();
        
        if (!mounted) return;
        
        // Extract all recipient-amount pairs from all distributions
        const allDistributions: DistributionItem[] = [];
        
        history.forEach((dist: any) => {
          dist.recipients.forEach((recipient: string) => {
            allDistributions.push({
              address: recipient,
              amount: dist.amountPerRecipient
            });
          });
        });

        // Sort by most recent and take last 50 distributions
        const recentDistributions = allDistributions.slice(-50);
        
        // Only update if we have data or it's the initial load
        if (recentDistributions.length > 0 || isInitialLoad) {
          // Duplicate the array for seamless scrolling
          setDistributions([...recentDistributions, ...recentDistributions]);
          setIsInitialLoad(false);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching distributions:', error);
        }
      }
    };

    fetchDistributions();
    
    // Refresh every 60 seconds (less frequent to reduce flashing)
    const interval = setInterval(() => {
      if (mounted) {
        fetchDistributions();
      }
    }, 60000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
      if (abortController) {
        abortController.abort();
      }
    };
  }, [getDistributionHistory]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (distributions.length === 0) {
    return (
      <div className="scrolling-distribution-bar">
        <div className="scrolling-content">
          <span className="distribution-item">
            <span className="placeholder-text">Loading recent distributions...</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="scrolling-distribution-bar">
      <div className="scrolling-content">
        {distributions.map((item, index) => (
          <span key={index} className="distribution-item">
            <span className="wallet-address">{formatAddress(item.address)}</span>
            <span className="received-text">received</span>
            <span className="amount">{item.amount.toFixed(4)}</span>
            <span className="currency">SUI</span>
            <span className="separator">•</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default ScrollingDistributionBar;