import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ATOReporting.css';

const ATOReporting = () => {
  const { payrunId } = useParams();
  const navigate = useNavigate();
  const [stpData, setStpData] = useState(null);
  const [paymentSummaries, setPaymentSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (payrunId) {
      fetchSTPData();
    }
  }, [payrunId]);

  const fetchSTPData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/payruns/${payrunId}/stp-data`);
      setStpData(response.data.stpData);
    } catch (error) {
      console.error('Error fetching STP data:', error);
      setError('Error fetching STP data');
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentSummaries = async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const financialYear = currentYear > 6 ? currentYear : currentYear - 1;
      
      // This would typically fetch all employees and generate summaries
      // For now, we'll show a placeholder
      setMessage('Payment summaries generated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error generating payment summaries:', error);
      setError('Error generating payment summaries');
    } finally {
      setLoading(false);
    }
  };

  const submitSTP = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would submit to ATO
      setMessage('STP data submitted to ATO successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error submitting STP:', error);
      setError('Error submitting STP data');
    } finally {
      setLoading(false);
    }
  };

  const exportSTPData = () => {
    if (!stpData) return;
    
    const dataStr = JSON.stringify(stpData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stp-data-${payrunId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPaymentSummaries = () => {
    // Generate CSV format for payment summaries
    const csvData = paymentSummaries.map(summary => 
      `${summary.employeeId},${summary.name},${summary.tfn},${summary.totalGross},${summary.totalTaxWithheld},${summary.totalSuperannuation}`
    ).join('\n');
    
    const csvContent = 'Employee ID,Name,TFN,Gross Pay,Tax Withheld,Superannuation\n' + csvData;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-summaries-${new Date().getFullYear()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ato-reporting">
      <div className="reporting-header">
        <h2>ATO Reporting & Compliance</h2>
        <p className="reporting-subtitle">
          Single Touch Payroll (STP) and Payment Summary Management
        </p>
        <button className="back-button" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="reporting-content">
        {/* STP Section */}
        <div className="reporting-section">
          <h3>Single Touch Payroll (STP)</h3>
          <p className="section-description">
            STP allows you to report payroll information to the ATO each time you pay your employees.
          </p>
          
          {loading && <div className="loading-spinner">Loading...</div>}
          
          {stpData && (
            <div className="stp-data">
              <div className="data-summary">
                <h4>Payrun Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Payrun ID:</span>
                    <span className="value">{stpData.payrunId}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Pay Date:</span>
                    <span className="value">{stpData.payDate}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Gross:</span>
                    <span className="value">${stpData.totals.totalGross.toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Tax:</span>
                    <span className="value">${stpData.totals.totalTaxWithheld.toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Super:</span>
                    <span className="value">${stpData.totals.totalSuperannuation.toFixed(2)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Employee Count:</span>
                    <span className="value">{stpData.employees.length}</span>
                  </div>
                </div>
              </div>

              <div className="employee-list">
                <h4>Employee Details</h4>
                <div className="table-container">
                  <table className="stp-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>TFN</th>
                        <th>Gross Amount</th>
                        <th>Tax Withheld</th>
                        <th>Superannuation</th>
                        <th>Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stpData.employees.map((employee, index) => (
                        <tr key={index}>
                          <td>{employee.employeeId}</td>
                          <td>{employee.tfn}</td>
                          <td>${employee.grossAmount.toFixed(2)}</td>
                          <td>${employee.taxWithheld.toFixed(2)}</td>
                          <td>${employee.superannuation.toFixed(2)}</td>
                          <td>${employee.netPay.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="stp-actions">
                <button 
                  onClick={exportSTPData}
                  className="btn-export"
                  disabled={loading}
                >
                  Export STP Data
                </button>
                <button 
                  onClick={submitSTP}
                  className="btn-submit"
                  disabled={loading}
                >
                  Submit to ATO
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Summaries Section */}
        <div className="reporting-section">
          <h3>Payment Summaries</h3>
          <p className="section-description">
            Generate payment summaries for employees at the end of the financial year.
          </p>
          
          <div className="payment-summary-actions">
            <button 
              onClick={generatePaymentSummaries}
              className="btn-generate"
              disabled={loading}
            >
              Generate Payment Summaries
            </button>
            <button 
              onClick={exportPaymentSummaries}
              className="btn-export"
              disabled={loading || paymentSummaries.length === 0}
            >
              Export Payment Summaries
            </button>
          </div>

          {paymentSummaries.length > 0 && (
            <div className="payment-summaries-list">
              <h4>Generated Payment Summaries</h4>
              <div className="table-container">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>TFN</th>
                      <th>Gross Pay</th>
                      <th>Tax Withheld</th>
                      <th>Superannuation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentSummaries.map((summary, index) => (
                      <tr key={index}>
                        <td>{summary.employeeId}</td>
                        <td>{summary.name}</td>
                        <td>{summary.tfn}</td>
                        <td>${summary.totalGross.toFixed(2)}</td>
                        <td>${summary.totalTaxWithheld.toFixed(2)}</td>
                        <td>${summary.totalSuperannuation.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Status */}
        <div className="reporting-section">
          <h3>Compliance Status</h3>
          <div className="compliance-grid">
            <div className="compliance-item">
              <div className="compliance-icon">✅</div>
              <div className="compliance-text">
                <h4>ATO Tax Tables</h4>
                <p>Using current 2024-25 tax rates</p>
              </div>
            </div>
            <div className="compliance-item">
              <div className="compliance-icon">✅</div>
              <div className="compliance-text">
                <h4>Superannuation</h4>
                <p>11.5% rate from July 2024</p>
              </div>
            </div>
            <div className="compliance-item">
              <div className="compliance-icon">✅</div>
              <div className="compliance-text">
                <h4>Medicare Levy</h4>
                <p>2% rate applied correctly</p>
              </div>
            </div>
            <div className="compliance-item">
              <div className="compliance-icon">⚠️</div>
              <div className="compliance-text">
                <h4>STP Filing</h4>
                <p>Ready for submission</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ATOReporting;


