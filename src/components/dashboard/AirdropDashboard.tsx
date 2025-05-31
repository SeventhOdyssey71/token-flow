import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCurrentAccount } from '@mysten/dapp-kit';
import './Dashboard.css';

interface FormData {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  uniqueId: string;
}

interface AddressData {
  id: string;
  walletAddress: string;
  submittedAt: Timestamp;
  formId: string;
}

const AirdropDashboard: React.FC = () => {
  const account = useCurrentAccount();
  // Auth state is available for future authentication features
  useAuthState(auth);
  const [formName, setFormName] = useState('');
  const [forms, setForms] = useState<FormData[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create a new form
  const createForm = async () => {
    if (!formName) {
      setError('Please enter a form name');
      return;
    }
    
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await addDoc(collection(db, "forms"), {
        name: formName,
        createdBy: account.address,
        createdAt: new Date(),
        uniqueId: Math.random().toString(36).substring(2, 15)
      });
      
      setFormName('');
      fetchForms();
      setLoading(false);
    } catch (error) {
      console.error("Error creating form:", error);
      setError("Failed to create form. Please try again.");
      setLoading(false);
    }
  };

  // Fetch user's forms
  const fetchForms = useCallback(async () => {
    if (!account) return;
    
    setLoading(true);
    
    try {
      const q = query(collection(db, "forms"), where("createdBy", "==", account.address));
      const querySnapshot = await getDocs(q);
      const formsList: FormData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        formsList.push({ 
          id: doc.id, 
          name: data.name, 
          createdBy: data.createdBy, 
          createdAt: data.createdAt, 
          uniqueId: data.uniqueId 
        });
      });
      
      setForms(formsList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching forms:", error);
      setError("Failed to fetch your forms. Please try again.");
      setLoading(false);
    }
  }, [account]);

  // Fetch addresses for a specific form
  const fetchAddresses = async (formId: string) => {
    setLoading(true);
    
    try {
      const q = query(collection(db, "submissions"), where("formId", "==", formId));
      const querySnapshot = await getDocs(q);
      const addressList: AddressData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        addressList.push({ 
          id: doc.id, 
          walletAddress: data.walletAddress, 
          submittedAt: data.submittedAt,
          formId: data.formId
        });
      });
      
      setAddresses(addressList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setError("Failed to fetch addresses. Please try again.");
      setLoading(false);
    }
  };

  // Export addresses to CSV
  const exportToCSV = () => {
    if (!addresses.length) {
      setError("No addresses to export");
      return;
    }
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Address\n";
    
    addresses.forEach(item => {
      csvContent += `${item.walletAddress}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `addresses-${selectedForm?.name || 'export'}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (account) {
      fetchForms();
    }
  }, [account, fetchForms]);

  useEffect(() => {
    if (selectedForm) {
      fetchAddresses(selectedForm.id);
    }
  }, [selectedForm]);

  if (!account) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <h2>Address Collection Dashboard</h2>
          <p className="info-message">Please connect your wallet to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2>Address Collection Dashboard</h2>
        
        {/* Create new form */}
        <div className="form-creation">
          <h3>Create New Collection Form</h3>
          <div className="input-group">
            <input 
              type="text" 
              value={formName} 
              onChange={(e) => setFormName(e.target.value)} 
              placeholder="Enter form name" 
              className="form-input"
            />
            <button 
              onClick={createForm} 
              className="primary-button"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Form'}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
        
        {/* List of forms */}
        <div className="forms-list">
          <h3>Your Collection Forms</h3>
          {loading ? (
            <p>Loading...</p>
          ) : forms.length === 0 ? (
            <p className="info-message">No forms created yet</p>
          ) : (
            <ul className="forms-grid">
              {forms.map(form => (
                <li 
                  key={form.id} 
                  onClick={() => setSelectedForm(form)}
                  className={`form-item ${selectedForm?.id === form.id ? 'selected' : ''}`}
                >
                  <div className="form-name">{form.name}</div>
                  <div className="form-date">
                    Created: {form.createdAt?.toDate ? form.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Selected form details */}
        {selectedForm && (
          <div className="form-details">
            <h3>{selectedForm.name}</h3>
            <div className="form-link-container">
              <p>Share this link with recipients:</p>
              <div className="form-link">
                <code>{`${window.location.origin}/submit/${selectedForm.uniqueId}`}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/submit/${selectedForm.uniqueId}`)}
                  className="copy-button"
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <h4>Collected Addresses ({addresses.length})</h4>
            {loading ? (
              <p>Loading addresses...</p>
            ) : addresses.length === 0 ? (
              <p className="info-message">No addresses collected yet</p>
            ) : (
              <>
                <button 
                  onClick={exportToCSV} 
                  className="secondary-button"
                  disabled={addresses.length === 0}
                >
                  Export to CSV
                </button>
                <div className="addresses-table-container">
                  <table className="addresses-table">
                    <thead>
                      <tr>
                        <th>Wallet Address</th>
                        <th>Submission Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addresses.map(address => (
                        <tr key={address.id}>
                          <td className="address-cell">{address.walletAddress}</td>
                          <td>{address.submittedAt?.toDate ? address.submittedAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AirdropDashboard;
