import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './PayslipHistory.css';  // Import the new CSS file for PayslipHistory

const PayslipHistory = () => {
  const { id } = useParams();
  const [payHistory, setPayHistory] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const calculateNetPay = (earnings, tax) => {
    if (!earnings) return 0;

    return earnings - tax;
  };

  useEffect(() => {
    const fetchPayHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/employees/${id}/pay-history`);
        setPayHistory(response.data);
      } catch (error) {
        console.error('Error fetching pay history:', error);
        setError('An error occurred while fetching pay history.');
      }
    };

    if (id) {
      fetchPayHistory();
    }
  }, [id]);

  return (
    <div className="container">
      <h2>Pay History for Employee {id}</h2>

      {/* Back Button */}
      <button className="back-button" onClick={() => navigate(-1)}>
        Back
      </button>

      {error && <p className="error-message">{error}</p>}
      
      {payHistory.length === 0 ? (
        <p>No pay history found for this employee.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Pay Date</th>
              <th>Salary</th>
              <th>Tax</th>
              <th>Superannuation</th>
              <th>Net Pay</th>
            </tr>
          </thead>
          <tbody>
            {payHistory.map((pay) => (
              <tr key={pay._id}>
                <td>{new Date(pay?.payDate).toLocaleDateString()}</td>
                <td>${pay?.earnings.toFixed(2) || 0}</td>
                <td>${pay?.taxAmount.toFixed(2) || 0}</td>
                <td>${pay?.superannuationAmount.toFixed(2) || 0}</td>
                <td className="net-pay">${calculateNetPay(pay?.earnings || 0, pay?.taxAmount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PayslipHistory;
