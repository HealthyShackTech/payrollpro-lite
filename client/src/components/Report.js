// src/components/Report.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const listStyle = { marginTop: '20px', paddingLeft: '16px', lineHeight: '1.8' };

const Report = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1>Report</h1>
      </header>
      <p>Choose a report to view:</p>
      <ul style={listStyle}>
        <li>
          <button
            onClick={() => navigate('/report/payroll-summary')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              color: '#2563eb',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Payroll Summary
          </button>
        </li>
        <li>
          <button
            onClick={() => navigate('/report/payrun-history')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              color: '#2563eb',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Payrun History
          </button>
        </li>
      </ul>
    </div>
  );
};

export default Report;
