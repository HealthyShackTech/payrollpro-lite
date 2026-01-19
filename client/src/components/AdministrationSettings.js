// src/components/AdministrationSettings.js
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const listStyle = { marginTop: '20px', paddingLeft: '18px', lineHeight: '1.9' };
const settings = [
  { key: 'business', label: 'Business Setting' },
  { key: 'payroll', label: 'Payroll Setting' },
  { key: 'report', label: 'Report Setting' },
  { key: 'import-export', label: 'Import and Export data' },
];

const AdministrationSettings = () => {
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
      <h1 style={{ marginBottom: '10px' }}>Settings</h1>
      <p style={{ marginBottom: '10px' }}>Choose the configuration area you want to manage:</p>
      <ul style={listStyle}>
        {settings.map((setting) => (
          <li key={setting.key} style={{ marginBottom: '6px' }}>
            <Link
              to={`/administration/settings/${setting.key}`}
              style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
            >
              {setting.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdministrationSettings;
