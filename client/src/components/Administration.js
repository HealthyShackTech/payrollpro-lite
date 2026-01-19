// src/components/Administration.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Administration = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Administration</h1>
      <p>Manage administrative tasks here, such as system settings, user roles, and more.</p>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '40px' }}>
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', width: '30%' }}>
          <h2>User Management</h2>
          <p>Manage user roles, permissions, and accounts.</p>
          <button style={{ padding: '10px 20px', marginTop: '10px' }}>Go to User Management</button>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', width: '30%' }}>
          <h2>Settings</h2>
          <p>Adjust system settings and configurations.</p>
          <button
            style={{ padding: '10px 20px', marginTop: '10px' }}
            onClick={() => navigate('/administration/settings')}
          >
            Go to Settings
          </button>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', width: '30%' }}>
          <h2>Reports</h2>
          <p>Access various administrative reports.</p>
          <button style={{ padding: '10px 20px', marginTop: '10px' }}>View Reports</button>
        </div>
      </div>
    </div>
  );
};

export default Administration;
