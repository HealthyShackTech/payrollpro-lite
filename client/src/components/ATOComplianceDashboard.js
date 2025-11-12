import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ATOComplianceDashboard.css';

const ATOComplianceDashboard = () => {
  const navigate = useNavigate();
  const [complianceData, setComplianceData] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 6, 1).toISOString().split('T')[0], // July 1st
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchComplianceData();
  }, [dateRange]);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const [complianceResponse, auditResponse] = await Promise.all([
        axios.get(`http://localhost:5001/api/compliance-report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        axios.get(`http://localhost:5001/api/audit-trail/export?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      ]);
      
      setComplianceData(complianceResponse.data.report);
      setAuditTrail(auditResponse.data.data);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      setError('Error fetching compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getComplianceStatus = () => {
    if (!complianceData) return 'unknown';
    
    const { complianceFlags } = complianceData;
    const totalEntries = complianceData.totalEntries;
    
    if (totalEntries === 0) return 'no-data';
    
    const complianceRate = (complianceFlags.atoCompliant / totalEntries) * 100;
    
    if (complianceRate >= 95) return 'excellent';
    if (complianceRate >= 85) return 'good';
    if (complianceRate >= 70) return 'warning';
    return 'critical';
  };

  const getStatusColor = (status) => {
    const colors = {
      excellent: '#27ae60',
      good: '#f39c12',
      warning: '#e67e22',
      critical: '#e74c3c',
      'no-data': '#95a5a6',
      unknown: '#bdc3c7'
    };
    return colors[status] || colors.unknown;
  };

  const getStatusText = (status) => {
    const texts = {
      excellent: 'Excellent Compliance',
      good: 'Good Compliance',
      warning: 'Needs Attention',
      critical: 'Critical Issues',
      'no-data': 'No Data Available',
      unknown: 'Unknown Status'
    };
    return texts[status] || texts.unknown;
  };

  const exportComplianceReport = () => {
    if (!complianceData || !auditTrail) return;
    
    const reportData = {
      complianceReport: complianceData,
      auditTrail: auditTrail,
      exportDate: new Date().toISOString(),
      dateRange: dateRange
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ato-compliance-report-${dateRange.startDate}-to-${dateRange.endDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const complianceStatus = getComplianceStatus();

  return (
    <div className="ato-compliance-dashboard">
      <div className="dashboard-header">
        <h2>ATO Compliance Dashboard</h2>
        <p className="dashboard-subtitle">
          Monitor payroll compliance with Australian Taxation Office requirements
        </p>
        <button className="back-button" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="dashboard-controls">
        <div className="date-range-selector">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            value={dateRange.startDate}
            onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            className="date-input"
          />
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            value={dateRange.endDate}
            onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            className="date-input"
          />
          <button onClick={fetchComplianceData} className="btn-refresh" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading && <div className="loading-spinner">Loading compliance data...</div>}

      {error && <div className="error-message">{error}</div>}

      {complianceData && (
        <div className="dashboard-content">
          {/* Compliance Status Overview */}
          <div className="compliance-overview">
            <div className="status-card">
              <div className="status-indicator" style={{ backgroundColor: getStatusColor(complianceStatus) }}>
                <span className="status-icon">
                  {complianceStatus === 'excellent' ? '✅' : 
                   complianceStatus === 'good' ? '⚠️' : 
                   complianceStatus === 'warning' ? '⚠️' : 
                   complianceStatus === 'critical' ? '❌' : '❓'}
                </span>
              </div>
              <div className="status-content">
                <h3>{getStatusText(complianceStatus)}</h3>
                <p>Overall compliance rating for the selected period</p>
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{complianceData.totalEntries}</div>
                <div className="metric-label">Total Audit Entries</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{complianceData.complianceFlags.atoCompliant}</div>
                <div className="metric-label">ATO Compliant</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{complianceData.complianceFlags.taxCalculationVerified}</div>
                <div className="metric-label">Tax Calculations Verified</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{complianceData.complianceFlags.stpSubmitted}</div>
                <div className="metric-label">STP Submissions</div>
              </div>
            </div>
          </div>

          {/* Action Breakdown */}
          <div className="action-breakdown">
            <h3>Action Breakdown</h3>
            <div className="action-chart">
              {Object.entries(complianceData.actions).map(([action, count]) => (
                <div key={action} className="action-item">
                  <div className="action-name">{action.replace(/_/g, ' ').toUpperCase()}</div>
                  <div className="action-count">{count}</div>
                  <div className="action-bar">
                    <div 
                      className="action-fill" 
                      style={{ 
                        width: `${(count / complianceData.totalEntries) * 100}%`,
                        backgroundColor: getStatusColor(complianceStatus)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Entity Breakdown */}
          <div className="entity-breakdown">
            <h3>Entity Breakdown</h3>
            <div className="entity-chart">
              {Object.entries(complianceData.entities).map(([entity, count]) => (
                <div key={entity} className="entity-item">
                  <div className="entity-name">{entity.toUpperCase()}</div>
                  <div className="entity-count">{count}</div>
                  <div className="entity-bar">
                    <div 
                      className="entity-fill" 
                      style={{ 
                        width: `${(count / complianceData.totalEntries) * 100}%`,
                        backgroundColor: getStatusColor(complianceStatus)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="timeline-section">
            <h3>Recent Activity Timeline</h3>
            <div className="timeline-container">
              {complianceData.timeline.slice(0, 10).map((entry, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-time">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-action">{entry.action.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="timeline-entity">{entry.entityType} - {entry.entityId}</div>
                    <div className="timeline-flags">
                      {entry.complianceFlags.atoCompliant && <span className="flag ato-compliant">ATO Compliant</span>}
                      {entry.complianceFlags.taxCalculationVerified && <span className="flag tax-verified">Tax Verified</span>}
                      {entry.complianceFlags.stpSubmitted && <span className="flag stp-submitted">STP Submitted</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Section */}
          <div className="export-section">
            <h3>Export Compliance Data</h3>
            <p>Export comprehensive compliance data for ATO reporting and auditing purposes.</p>
            <button onClick={exportComplianceReport} className="btn-export">
              Export Compliance Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATOComplianceDashboard;


