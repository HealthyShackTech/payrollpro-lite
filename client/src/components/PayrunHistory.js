// src/components/PayrunHistory.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PayrunHistory = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '8px 12px',
          marginBottom: '16px',
          border: '1px solid #1e4ed8',
          borderRadius: '4px',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        ← Back
      </button>
      <h1 style={{ marginBottom: '10px' }}>Payrun History</h1>
      <p style={{ marginBottom: '10px' }}>Review previous payruns and their status.</p>
      <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#f8fafc' }}>
        <p style={{ margin: 0, color: '#334155' }}>Payrun history details go here.</p>
      </div>
    </div>
  );
};

export default PayrunHistory;
