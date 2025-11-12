import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import './PayrollProcessing.css';

const PayrollProcessing = () => {
  const navigate = useNavigate();
  const [payrollHistoryData, setPayrollHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'paymentDate', direction: 'desc' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, submit

  useEffect(() => {
    fetchPayrollData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payrollHistoryData, searchTerm, filterStatus, sortConfig]);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/payroll-history');
      const data = response.data;
      setPayrollHistoryData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error fetching payroll data');
      console.error('Error fetching payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payrollHistoryData];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.payrunId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.paymentDate.includes(searchTerm) ||
        entry.orderNumber.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(entry => entry.stpFiling === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'paymentDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortConfig.key === 'orderNumber') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (typeof aValue === 'number') {
        // For numeric fields like totalEarnings, totalTax, etc.
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredData(filtered);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAddPayRun = async () => {
    const confirmed = window.confirm("Create a new pay run?");
    if (!confirmed) return;

    const newPayrunId = `PR-${Date.now()}`;
    const paymentDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Australia/Hobart' }).format(new Date());
    
    const highestOrderNumber = payrollHistoryData.reduce((max, entry) => {
      return Math.max(max, Number(entry.orderNumber) || 0);
    }, 0);

    const newPayRun = {
      payrunId: newPayrunId,
      orderNumber: highestOrderNumber + 1,
      paymentDate: paymentDate,
      wage: 0,
      tax: 0,
      super: 0,
      netPay: 0,
      stpFiling: "Pending"
    };

    try {
      const response = await api.post('/api/payroll-history', newPayRun);
      const savedPayRun = response.data;
      setPayrollHistoryData((prevData) => [...prevData, savedPayRun]);
      navigate(`/payroll/payrun/${newPayrunId}?date=${paymentDate}`);
    } catch (err) {
      setError(err.message || 'Error creating new pay run');
      console.error('Error creating pay run:', err);
    }
  };

  const handleDelete = async (payrunId, e) => {
    e.stopPropagation();
    const confirmed = window.confirm("Are you sure you want to delete this pay run?");
    if (!confirmed) return;

    try {
      await api.delete(`/api/payroll-history/${payrunId}`);
      setPayrollHistoryData((prevData) => prevData.filter((entry) => entry.payrunId !== payrunId));
    } catch (err) {
      setError(err.message || 'Error deleting pay run');
      console.error('Error deleting pay run:', err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { class: 'status-pending', label: 'Pending' },
      'submit': { class: 'status-submitted', label: 'Submitted' },
      'Submitted': { class: 'status-submitted', label: 'Submitted' },
    };
    
    const config = statusConfig[status] || statusConfig['Pending'];
    return (
      <span className={`status-badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const renderSortIcon = (column) => {
    if (sortConfig.key !== column) {
      return <span className="sort-icon">⇅</span>;
    }
    return sortConfig.direction === 'asc' ? <span className="sort-icon">↑</span> : <span className="sort-icon">↓</span>;
  };

  // Calculate summary statistics
  const summary = filteredData.reduce((acc, entry) => {
    acc.totalEarnings += entry.totalEarnings || 0;
    acc.totalTax += entry.totalTax || 0;
    acc.totalSuper += entry.totalSuperannuation || 0;
    acc.totalNetPay += (entry.totalEarnings || 0) - (entry.totalTax || 0);
    acc.count += 1;
    return acc;
  }, { totalEarnings: 0, totalTax: 0, totalSuper: 0, totalNetPay: 0, count: 0 });

  if (loading) {
    return (
      <div className="payroll-processing-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payroll-processing-container">
      {/* Header Section */}
      <div className="payroll-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="page-title">Payroll Processing</h1>
            <p className="page-subtitle">Manage and process all payroll runs</p>
          </div>
          <button 
            onClick={handleAddPayRun}
            className="btn-primary btn-add-payrun"
          >
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create New Pay Run</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon earnings">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="card-content">
            <p className="card-label">Total Earnings</p>
            <p className="card-value">{formatCurrency(summary.totalEarnings)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon tax">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="card-content">
            <p className="card-label">Total Tax</p>
            <p className="card-value">{formatCurrency(summary.totalTax)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon super">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="card-content">
            <p className="card-label">Total Super</p>
            <p className="card-value">{formatCurrency(summary.totalSuper)}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon netpay">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="card-content">
            <p className="card-label">Total Net Pay</p>
            <p className="card-value">{formatCurrency(summary.totalNetPay)}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by Payrun ID, Date, or Order Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({payrollHistoryData.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'Pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('Pending')}
          >
            Pending ({payrollHistoryData.filter(p => p.stpFiling === 'Pending').length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'submit' ? 'active' : ''}`}
            onClick={() => setFilterStatus('submit')}
          >
            Submitted ({payrollHistoryData.filter(p => p.stpFiling === 'submit').length})
          </button>
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

      {/* Payroll Table */}
      <div className="payroll-table-container">
        {filteredData.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3>No payroll runs found</h3>
            <p>{searchTerm || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Create your first pay run to get started'}</p>
            {!searchTerm && filterStatus === 'all' && (
              <button onClick={handleAddPayRun} className="btn-primary">
                Create First Pay Run
              </button>
            )}
          </div>
        ) : (
          <table className="payroll-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('orderNumber')} className="sortable">
                  <div className="th-content">
                    <span>Order</span>
                    {renderSortIcon('orderNumber')}
                  </div>
                </th>
                <th onClick={() => handleSort('payrunId')} className="sortable">
                  <div className="th-content">
                    <span>Payrun ID</span>
                    {renderSortIcon('payrunId')}
                  </div>
                </th>
                <th onClick={() => handleSort('paymentDate')} className="sortable">
                  <div className="th-content">
                    <span>Payment Date</span>
                    {renderSortIcon('paymentDate')}
                  </div>
                </th>
                <th onClick={() => handleSort('totalEarnings')} className="sortable">
                  <div className="th-content">
                    <span>Earnings</span>
                    {renderSortIcon('totalEarnings')}
                  </div>
                </th>
                <th onClick={() => handleSort('totalTax')} className="sortable">
                  <div className="th-content">
                    <span>Tax</span>
                    {renderSortIcon('totalTax')}
                  </div>
                </th>
                <th onClick={() => handleSort('totalSuperannuation')} className="sortable">
                  <div className="th-content">
                    <span>Super</span>
                    {renderSortIcon('totalSuperannuation')}
                  </div>
                </th>
                <th onClick={() => handleSort('totalEarnings')} className="sortable">
                  <div className="th-content">
                    <span>Net Pay</span>
                    {renderSortIcon('totalEarnings')}
                  </div>
                </th>
                <th onClick={() => handleSort('stpFiling')} className="sortable">
                  <div className="th-content">
                    <span>Status</span>
                    {renderSortIcon('stpFiling')}
                  </div>
                </th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((entry) => {
                const netPay = (entry.totalEarnings || 0) - (entry.totalTax || 0);
                return (
                  <tr
                    key={entry.payrunId}
                    onClick={() => navigate(`/payroll/payrun/${entry.payrunId}?date=${entry.paymentDate}`)}
                    className="table-row"
                  >
                    <td className="order-number">{entry.orderNumber}</td>
                    <td className="payrun-id">{entry.payrunId}</td>
                    <td className="payment-date">{entry.paymentDate}</td>
                    <td className="currency">{formatCurrency(entry.totalEarnings)}</td>
                    <td className="currency">{formatCurrency(entry.totalTax)}</td>
                    <td className="currency">{formatCurrency(entry.totalSuperannuation)}</td>
                    <td className="currency net-pay">{formatCurrency(netPay)}</td>
                    <td>{getStatusBadge(entry.stpFiling)}</td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      {entry.stpFiling !== 'submit' && (
                        <button
                          onClick={(e) => handleDelete(entry.payrunId, e)}
                          className="btn-delete"
                          title="Delete pay run"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Results Count */}
      {filteredData.length > 0 && (
        <div className="results-count">
          Showing {filteredData.length} of {payrollHistoryData.length} pay run{payrollHistoryData.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default PayrollProcessing;
