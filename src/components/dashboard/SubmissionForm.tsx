import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import './Dashboard.css';

interface FormData {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  uniqueId: string;
}

const SubmissionForm: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [walletAddress, setWalletAddress] = useState('');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch form data
  useEffect(() => {
    const fetchFormData = async () => {
      if (!formId) {
        setError('Invalid form link');
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "forms"), where("uniqueId", "==", formId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Form not found');
          setLoading(false);
          return;
        }
        
        // Get the first matching document
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        setFormData({
          id: doc.id,
          name: data.name,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          uniqueId: data.uniqueId
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching form:", error);
        setError('Failed to load form. Please try again.');
        setLoading(false);
      }
    };

    fetchFormData();
  }, [formId]);

  // Submit wallet address
  const submitAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      setError('Please enter your wallet address');
      return;
    }
    
    // Basic validation for Sui wallet address
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 66) {
      setError('Please enter a valid Sui wallet address (0x followed by 64 hex characters)');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await addDoc(collection(db, "submissions"), {
        formId: formData.id,
        walletAddress,
        submittedAt: new Date()
      });
      
      setSuccess(true);
      setWalletAddress('');
      setLoading(false);
    } catch (error) {
      console.error("Error submitting address:", error);
      setError('Failed to submit your address. Please try again.');
      setLoading(false);
    }
  };

  if (loading && !formData) {
    return (
      <div className="submission-container">
        <div className="submission-card">
          <h2>Loading form...</h2>
        </div>
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="submission-container">
        <div className="submission-card error-card">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submission-container">
      <div className="submission-card">
        {success ? (
          <div className="success-message">
            <h2>Thank You!</h2>
            <p>Your wallet address has been successfully submitted.</p>
            <svg className="success-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        ) : (
          <>
            <h2>{formData ? formData.name : 'Submit Your Wallet Address'}</h2>
            <p className="form-description">
              Please enter your Sui wallet address below to be included in the token distribution.
            </p>
            
            <form onSubmit={submitAddress} className="submission-form">
              <div className="input-group">
                <label htmlFor="walletAddress">Sui Wallet Address</label>
                <input
                  id="walletAddress"
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="form-input"
                  required
                />
              </div>
              
              {error && <p className="error-message">{error}</p>}
              
              <button 
                type="submit" 
                className="primary-button"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Address'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default SubmissionForm;
