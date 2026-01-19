import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../utils/axiosConfig';
import './payrun.css';

// Rate Management Modal Component
const RateManagementModal = ({ employee, onClose, onSave }) => {
  const [rates, setRates] = useState({
    normalRate: employee.normalRate || '',
    saturdayRate: employee.saturdayRate || '',
    sundayRate: employee.sundayRate || '',
    customRate: employee.customRate || '',
    directorFee: employee.directorFee || ''
  });

  const handleInputChange = (field, value) => {
    setRates(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(rates);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">
              Rate Management - {employee.firstName} {employee.surname}
            </h3>
          <button onClick={onClose} className="modal-close-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        <div className="modal-content">
          <div className="rate-grid">
            <div className="rate-field">
              <label>Normal Rate ($/hour)</label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.normalRate}
                  onChange={(e) => handleInputChange('normalRate', e.target.value)}
                  placeholder="Enter normal hourly rate"
                />
              </div>

            <div className="rate-field">
              <label>Saturday Rate ($/hour)</label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.saturdayRate}
                  onChange={(e) => handleInputChange('saturdayRate', e.target.value)}
                  placeholder="Enter Saturday hourly rate"
                />
              </div>

            <div className="rate-field">
              <label>Sunday Rate ($/hour)</label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.sundayRate}
                  onChange={(e) => handleInputChange('sundayRate', e.target.value)}
                  placeholder="Enter Sunday hourly rate"
                />
              </div>

            <div className="rate-field">
              <label>Custom Rate ($/hour)</label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.customRate}
                  onChange={(e) => handleInputChange('customRate', e.target.value)}
                  placeholder="Enter custom hourly rate"
                />
              </div>

            <div className="rate-field full-width">
              <label>Director Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={rates.directorFee}
                  onChange={(e) => handleInputChange('directorFee', e.target.value)}
                  placeholder="Enter director fee amount"
                />
              </div>
            </div>
          </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          <button onClick={handleSave} className="btn-primary">
              Save Rates
            </button>
        </div>
      </div>
    </div>
  );
};

const PayRun = () => {
  const { payrunId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedEmployeeForRate, setSelectedEmployeeForRate] = useState(null);
  const [payrunInfo, setPayrunInfo] = useState(null);
  const queryParams = new URLSearchParams(location.search);
  const paymentDate = queryParams.get('date') || payrunInfo?.paymentDate;

// Fetch employee data
const fetchEmployees = useCallback(async () => {
  try {
      setLoading(true);
      setError(null);
      
      const employeeResponse = await api.get('/api/employees');
      
      // Validate response is JSON
      if (!employeeResponse || !employeeResponse.data) {
        throw new Error('Invalid response from server');
      }
      
    let payrunResponseData = [];
    
    try {
        const payrunResponse = await api.get(`/api/payruns/${payrunId}/employees`);
        
        // Validate response is JSON
        if (payrunResponse && payrunResponse.data && Array.isArray(payrunResponse.data)) {
          payrunResponseData = payrunResponse.data;
        }
    } catch (error) {
      // Check if error is due to HTML response (404 page, etc.)
      if (error.response) {
        const contentType = error.response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          console.warn(`Server returned HTML instead of JSON for payrunId: ${payrunId}. This may indicate the payrun doesn't exist yet.`);
        } else {
          console.warn(`No pay run data found for payrunId: ${payrunId}`, error.response.status);
        }
      } else if (error.message && error.message.includes('JSON')) {
        console.warn(`Received non-JSON response for payrunId: ${payrunId}`);
      } else {
        console.warn(`No pay run data found for payrunId: ${payrunId}`, error.message);
      }
    }

      // Combine employee personal data with payrun data
    const combinedData = employeeResponse.data.map(emp => {
        const payData = payrunResponseData.find(p => p.employeeId === emp._id);
        return {
        ...emp,
          ...payData,
      };
    });

    setEmployees(combinedData);
  } catch (error) {
    console.error('Error fetching employee data:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to load employee data. Please try again.';
    if (error.response) {
      const contentType = error.response.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        errorMessage = 'Server returned an error page. Please check if the server is running correctly.';
      } else if (error.response.status === 404) {
        errorMessage = 'Employee data not found.';
      } else if (error.response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    } else if (error.message && error.message.includes('JSON')) {
      errorMessage = 'Server returned invalid data. Please check the server connection.';
    } else if (error.message && error.message.includes('Network')) {
      errorMessage = 'Network error. Please check your connection and ensure the server is running.';
    }
    
      setError(errorMessage);
    } finally {
      setLoading(false);
  }
}, [payrunId]);

const fetchPayrunInfo = useCallback(async () => {
  try {
    const response = await api.get(`/api/payrun/${payrunId}`);
    setPayrunInfo(response.data);
  } catch (error) {
    console.warn('Failed to load payrun info:', error);
  }
}, [payrunId]);

  useEffect(() => {
    fetchEmployees();
    fetchPayrunInfo();
  }, [payrunId, fetchEmployees]);

  const handleBackClick = () => {
    navigate('/payroll');
  };

  const handleCheckboxChange = (empId) => {
    setSelectedEmployees((prevSelected) => {
      const updatedSelection = { ...prevSelected };
      if (updatedSelection[empId]) {
        delete updatedSelection[empId];
      } else {
        updatedSelection[empId] = true;
      }
      return updatedSelection;
    });
  };

  const handleSelectAll = () => {
    const allEmployeeIds = employees.map(emp => emp.employeeId || emp._id);
    const allSelected = allEmployeeIds.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
    setSelectedEmployees(allSelected);
  };

  const handleDeselectAll = () => {
    setSelectedEmployees({});
  };

  const handleOpenRateModal = (employee) => {
    setSelectedEmployeeForRate(employee);
    setShowRateModal(true);
  };

  const handleCloseRateModal = () => {
    setShowRateModal(false);
    setSelectedEmployeeForRate(null);
  };

  const handleSaveEmployeeRates = async (rates) => {
    try {
      const employeeId = selectedEmployeeForRate.employeeId || selectedEmployeeForRate._id;
      
      await api.put(`/api/employees/${employeeId}`, {
        normalRate: rates.normalRate,
        saturdayRate: rates.saturdayRate,
        sundayRate: rates.sundayRate,
        customRate: rates.customRate,
        directorFee: rates.directorFee
      });

      fetchEmployees();
      setShowRateModal(false);
      setSelectedEmployeeForRate(null);
    } catch (error) {
      console.error('Error saving employee rates:', error);
      setError('Failed to save employee rates');
    }
  };

  const handleDeleteEmployeeRates = async (employeeId) => {
    const confirmed = window.confirm("Are you sure you want to delete this employee's rates?");
    if (confirmed) {
      try {
        await api.put(`/api/employees/${employeeId}`, {
          normalRate: '',
          saturdayRate: '',
          sundayRate: '',
          customRate: '',
          directorFee: ''
        });

        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee rates:', error);
        setError('Failed to delete employee rates');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const hasNumericRate = (value) =>
    value !== null && value !== undefined && value !== '' && !Number.isNaN(Number(value));

  const calculateNetPay = (earnings, tax) => {
    if (!earnings) return 0;
    return earnings - tax;
  };

  const calculateTotals = () => {
    return employees.reduce((totals, emp) => {
      const earnings = emp?.earnings || 0;
      const tax = emp?.taxAmount || 0;
      const superannuation = emp?.superannuationAmount || 0;
      const netPay = calculateNetPay(earnings, tax);

      return {
        totalEarnings: totals.totalEarnings + earnings,
        totalTax: totals.totalTax + tax,
        totalSuper: totals.totalSuper + superannuation,
        totalNetPay: totals.totalNetPay + netPay,
      };
    }, { totalEarnings: 0, totalTax: 0, totalSuper: 0, totalNetPay: 0 });
  };

  const totals = calculateTotals();

  const handleDeletePayRun = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this pay run?");
    if (confirmed) {
      try {
        await api.delete(`/api/payroll-history/${payrunId}`);
        navigate('/payroll');
      } catch (error) {
        console.error('Error deleting pay run:', error);
        setError('Failed to delete pay run');
      }
    }
  };

  const navigateToPayslip = (empId) => {
    navigate(`/payroll/payrun/${payrunId}/${empId}`);
  };

  if (loading) {
    return (
      <div className="payrun-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading pay run data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payrun-container">
      {/* Header Section */}
      <div className="payrun-header">
        <div className="header-content">
          <button onClick={handleBackClick} className="btn-back">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Payroll</span>
          </button>
          <div className="header-title-section">
            <h1 className="page-title">Pay Run Management</h1>
            <p className="page-subtitle">Pay Run ID: {payrunId}</p>
          </div>
          <div className="header-actions">
            <button onClick={handleDeletePayRun} className="btn-danger">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete Pay Run</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pay Run Info Cards */}
      <div className="info-cards">
        <div className="info-card">
          <div className="card-icon payrun-id-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
          <div className="card-content">
            <p className="card-label">Pay Run ID</p>
            <p className="card-value">{payrunId}</p>
          </div>
        </div>

        <div className="info-card">
          <div className="card-icon date-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="card-content">
            <p className="card-label">Payment Date</p>
            <p className="card-value">{paymentDate || 'Not specified'}</p>
          </div>
        </div>

        <div className="info-card">
          <div className="card-icon employees-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            </div>
          <div className="card-content">
            <p className="card-label">Total Employees</p>
            <p className="card-value">{employees.length}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card earnings">
          <div className="summary-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="summary-content">
            <p className="summary-label">Total Earnings</p>
            <p className="summary-value">{formatCurrency(totals.totalEarnings)}</p>
          </div>
        </div>

        <div className="summary-card tax">
          <div className="summary-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
              </div>
          <div className="summary-content">
            <p className="summary-label">Total Tax</p>
            <p className="summary-value">{formatCurrency(totals.totalTax)}</p>
              </div>
        </div>

        <div className="summary-card super">
          <div className="summary-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="summary-content">
            <p className="summary-label">Total Super</p>
            <p className="summary-value">{formatCurrency(totals.totalSuper)}</p>
          </div>
        </div>

        <div className="summary-card netpay">
          <div className="summary-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="summary-content">
            <p className="summary-label">Total Net Pay</p>
            <p className="summary-value">{formatCurrency(totals.totalNetPay)}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
      {error && (
        <div className="error-alert">
          <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-alert">×</button>
              </div>
      )}

      {/* Selection Controls */}
      <div className="selection-controls">
        <div className="selection-info">
          <span className="selection-badge">
            {Object.keys(selectedEmployees).length} Selected
          </span>
          <div className="selection-buttons">
            <button onClick={handleSelectAll} className="btn-select">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Select All
            </button>
            <button onClick={handleDeselectAll} className="btn-deselect">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Deselect All
            </button>
              </div>
            </div>
          </div>

        {/* Employee List */}
      <div className="employee-table-container">
          {employees.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            <h3>No employees found</h3>
            <p>Get started by adding employees to this pay run.</p>
            </div>
          ) : (
          <table className="employee-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={Object.keys(selectedEmployees).length === employees.length && employees.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleSelectAll();
                      } else {
                        handleDeselectAll();
                      }
                    }}
                    className="checkbox-input"
                  />
                </th>
                <th>Employee Name</th>
                <th>Earnings</th>
                <th>Tax</th>
                <th>Super</th>
                <th>Net Pay</th>
                <th>Rates</th>
                <th>Actions</th>
                </tr>
              </thead>
            <tbody>
              {employees.map((emp) => {
                const empId = emp.employeeId || emp._id;
                const isSelected = selectedEmployees[empId];
                const earnings = emp?.earnings || 0;
                const tax = emp?.taxAmount || 0;
                const superannuation = emp?.superannuationAmount || 0;
                const netPay = calculateNetPay(earnings, tax);
                const rateItems = [
                  { key: 'normal', label: 'Normal', value: emp.normalRate, suffix: '/hr' },
                  { key: 'saturday', label: 'Saturday', value: emp.saturdayRate, suffix: '/hr' },
                  { key: 'sunday', label: 'Sunday', value: emp.sundayRate, suffix: '/hr' },
                  { key: 'custom', label: 'Custom', value: emp.customRate, suffix: '/hr' },
                  { key: 'director', label: 'Director Fee', value: emp.directorFee }
                ].filter((rate) => hasNumericRate(rate.value));
                const hasRates = rateItems.length > 0;

                return (
                  <React.Fragment key={empId}>
                    <tr
                      onClick={() => navigateToPayslip(empId)}
                      className={`table-row ${isSelected ? 'selected' : ''}`}
                    >
                    <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => handleCheckboxChange(empId)}
                        onClick={(e) => e.stopPropagation()}
                        className="checkbox-input"
                      />
                    </td>
                    <td className="employee-name" onClick={() => navigateToPayslip(empId)}>
                      <div className="name-primary">
                        {emp.firstName || 'Unnamed'} {emp.surname || 'Unnamed'}
                        </div>
                      {emp.jobTitle && (
                        <div className="name-secondary">{emp.jobTitle}</div>
                      )}
                      </td>
                    <td className="currency" onClick={() => navigateToPayslip(empId)}>
                      {formatCurrency(earnings)}
                    </td>
                    <td className="currency" onClick={() => navigateToPayslip(empId)}>
                      {formatCurrency(tax)}
                    </td>
                    <td className="currency" onClick={() => navigateToPayslip(empId)}>
                      {formatCurrency(superannuation)}
                    </td>
                    <td className="currency net-pay" onClick={() => navigateToPayslip(empId)}>
                      {formatCurrency(netPay)}
                    </td>
                    <td className="rates-col" onClick={(e) => e.stopPropagation()}>
                      <div className="rates-buttons">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRateModal(emp);
                          }}
                          className="btn-rate-edit"
                          title="Edit rates"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {hasRates && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEmployeeRates(empId);
                            }}
                            className="btn-rate-delete"
                            title="Delete rates"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    <td className="actions-col" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                            e.stopPropagation();
                          navigateToPayslip(empId);
                        }}
                        className="btn-view-payslip"
                        title="View payslip"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    </td>
                  </tr>
                  <tr
                    className={`rate-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => navigateToPayslip(empId)}
                  >
                    <td colSpan="8" className="rate-cell">
                      <div className="rate-row-content">
                        <span className="rate-row-label">Rates</span>
                        {hasRates ? (
                          <div className="rate-badges">
                            {rateItems.map((rate) => (
                              <span key={rate.key} className="rate-badge">
                                {rate.label}: {formatCurrency(rate.value)}{rate.suffix || ''}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="rate-empty">No rates set</span>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
                );
              })}

                  {/* Total Row */}
              <tr className="total-row">
                <td colSpan="2" className="total-label">Total</td>
                <td className="currency total-value">{formatCurrency(totals.totalEarnings)}</td>
                <td className="currency total-value">{formatCurrency(totals.totalTax)}</td>
                <td className="currency total-value">{formatCurrency(totals.totalSuper)}</td>
                <td className="currency total-value net-pay">{formatCurrency(totals.totalNetPay)}</td>
                <td colSpan="2"></td>
                </tr>
              </tbody>
            </table>
        )}
      </div>

      {/* Rate Management Modal */}
      {showRateModal && selectedEmployeeForRate && (
        <RateManagementModal
          employee={selectedEmployeeForRate}
          onClose={handleCloseRateModal}
          onSave={handleSaveEmployeeRates}
        />
      )}
    </div>
  );
};

export default PayRun;
