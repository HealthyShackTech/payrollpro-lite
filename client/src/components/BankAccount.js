import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import './BankAccount.css';

const BankAccount = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [primaryBankName, setPrimaryBankName] = useState('');
  const [statementText, setStatementText] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bsbNumber, setBsbNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [bsbData, setBsbData] = useState(null); // State to store BSB data for table

  useEffect(() => {
    const fetchBankAccountDetails = async () => {
      try {
        setError('');
        const response = await api.get(`/api/employees/${id}`);
        
        if (!response.data) {
          throw new Error('Employee not found');
        }

        // If bankAccount exists, populate the form fields
        // If not, leave fields empty (allowing user to create new bank account)
        if (response.data.bankAccount) {
          const { bankAccount } = response.data;
          setPrimaryBankName(bankAccount.primaryBankName || '');
          setStatementText(bankAccount.statementText || '');
          setAccountName(bankAccount.accountName || '');
          setBsbNumber(bankAccount.bsbNumber || '');
          setAccountNumber(bankAccount.accountNumber || '');
        } else {
          // No bank account data yet - show empty form
          setPrimaryBankName('');
          setStatementText('');
          setAccountName('');
          setBsbNumber('');
          setAccountNumber('');
        }
      } catch (error) {
        console.error('Error fetching bank account details:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error fetching bank account details';
        setError(`Error fetching employee data: ${errorMessage}`);
      }
    };

    fetchBankAccountDetails();
  }, [id]);

  const handleUpdate = async () => {
    if (!primaryBankName || !statementText || !accountName || !bsbNumber || !accountNumber) {
      setError('Please fill in all bank account details');
      return;
    }

    try {
      const updatedBankAccount = {
        primaryBankName,
        statementText,
        accountName,
        bsbNumber,
        accountNumber
      };

      await api.put(`/api/employees/${id}/update-bank-account`, { bankAccount: updatedBankAccount });
      setMessage('Bank account details updated successfully');
      setError('');

      setTimeout(() => {
        setMessage('');
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Error:', error);
      setMessage('');
    }
  };

  const handleVerifyBSB = async () => {
    // Validate BSB number format
    const cleanBSB = bsbNumber.replace(/[^0-9]/g, '');
    
    if (cleanBSB.length !== 6) {
      setError('BSB number must be 6 digits');
      setVerificationMessage('');
      setBsbData(null);
      return;
    }

    const formattedBSB = `${cleanBSB.slice(0, 3)}-${cleanBSB.slice(3)}`;
    setVerificationMessage('Verifying BSB...');
    setError('');
    setBsbData(null);

    try {
      const response = await api.post('/api/verify-bsb', {
        bsbcode: formattedBSB
      });
      
      // Handle new API response format: { success: true, data: [...], metadata: {...} }
      if (!response.data.success) {
        setBsbData(null);
        setVerificationMessage('');
        setError(response.data.message || 'BSB verification failed');
        return;
      }

      // Extract data from new API format
      const bsbDataArray = response.data.data;
      
      if (bsbDataArray && Array.isArray(bsbDataArray) && bsbDataArray.length > 0) {
        // Use the first result
        const bsbResult = bsbDataArray[0];
        setBsbData(bsbResult);
        
        // Build success message with bank details
        const bankName = bsbResult.BSBName || '';
        const bankCode = bsbResult.BSBCode || '';
        const fiMnemonic = bsbResult.FiMnemonic || '';
        const address = bsbResult.Address ? `${bsbResult.Address}, ${bsbResult.Suburb || ''} ${bsbResult.State || ''}`.trim() : '';
        
        let successMsg = `BSB Verification Successful: ${bankName || bankCode}`;
        if (fiMnemonic) {
          successMsg += ` (${fiMnemonic})`;
        }
        if (address) {
          successMsg += ` - ${address}`;
        }
        
        setVerificationMessage(successMsg);
        setError('');
      } else {
        setBsbData(null);
        setVerificationMessage('BSB code not found in database');
        setError('');
      }
    } catch (error) {
      console.error('BSB verification error:', error);
      setBsbData(null);
      setVerificationMessage('');
      
      // Handle different types of errors
      let errorMessage = 'Error verifying BSB';
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage = 'Network error: Unable to connect to BSB verification service. Please check your internet connection and try again.';
      } else if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const responseMessage = error.response.data?.message || '';
        
        if (status === 401 || status === 403) {
          errorMessage = 'BSB API authentication failed. The API key may be missing or invalid. Please contact administrator.';
        } else if (status === 500) {
          errorMessage = responseMessage || 'BSB API key not configured. Please contact administrator to configure BSB_API_KEY.';
        } else if (status === 502 || status === 503) {
          errorMessage = 'BSB service is temporarily unavailable. Please try again later.';
        } else if (status === 404) {
          errorMessage = 'BSB code not found in database.';
        } else {
          errorMessage = responseMessage || `BSB verification failed (Error ${status}). Please try again.`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from BSB verification service. The service may be down or unreachable.';
      } else {
        // Error setting up the request
        errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      }
      
      setError(`BSB Verification Failed: ${errorMessage}`);
    }
  };

  return (
    <div className="bank-account-container">
      <h2>Bank Account Details for Employee ID: {id}</h2>
      <button onClick={() => navigate(-1)}>Back</button>

      <label>
        Primary Bank Name:
        <input
          type="text"
          value={primaryBankName}
          onChange={(e) => setPrimaryBankName(e.target.value)}
          placeholder="Enter primary bank name"
        />
      </label>

      <label>
        Statement Text:
        <input
          type="text"
          value={statementText}
          onChange={(e) => setStatementText(e.target.value)}
          placeholder="Enter statement text"
        />
      </label>

      <label>
        Account Name:
        <input
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Enter account name"
        />
      </label>

      <label>
  BSB Number:
  <div className="inline-container">
    <input
      type="text"
      value={bsbNumber.length > 3 ? `${bsbNumber.slice(0, 3)}-${bsbNumber.slice(3)}` : bsbNumber}
      onChange={(e) => setBsbNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
      placeholder="Enter BSB number"
    />
  </div>
  <button onClick={handleVerifyBSB} className="verify-button">Verify</button>
</label>


      {verificationMessage && <p>{verificationMessage}</p>}

    {/* Display BSB data in a table */}
    {bsbData && (
      <div className="bsb-result-table">
        <table>
          <thead>
            <tr>
              <th>BSB Code</th>
              <th>BSB Name</th>
              <th>Financial Institution</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{bsbData.BSBCode}</td>
              <td>{bsbData.BSBName}</td>
              <td>{bsbData.FiMnemonic}</td>
              <td>
                {bsbData.Address && (
                  <div>
                    {bsbData.Address}
                    {bsbData.Suburb && `, ${bsbData.Suburb}`}
                    {bsbData.State && ` ${bsbData.State}`}
                    {bsbData.Postcode && ` ${bsbData.Postcode}`}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )}



      <label>
        Account Number:
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Enter account number"
        />
      </label>

      <button onClick={handleUpdate}>Update Bank Account</button>

      {message && <p className="green">{message}</p>}
      {error && <p className="red">{error}</p>}
    </div>
  );
};

export default BankAccount;
