// src/components/SuperPayments.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

const SuperPayments = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ superRate: 10.5 });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPayrollSettings = async () => {
      setLoading(true);
      setStatus({ type: '', message: '' });
      try {
        const res = await api.get('/api/payroll-settings');
        if (res.data?.data) {
          setForm((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (error) {
        console.error('Failed to load payroll settings', error);
        setStatus({ type: 'error', message: 'Failed to load payroll settings' });
      } finally {
        setLoading(false);
      }
    };

    loadPayrollSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = { ...form, superRate: Number(form.superRate) || 0 };
      const res = await api.put('/api/payroll-settings', payload);
      if (res.data?.data) {
        setForm((prev) => ({ ...prev, ...res.data.data }));
      }
      setStatus({ type: 'success', message: 'Super rate saved' });
    } catch (error) {
      console.error('Failed to save payroll settings', error);
      setStatus({ type: 'error', message: error?.response?.data?.error || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

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
      <h1 style={{ marginBottom: '10px' }}>Superannuation Payments</h1>
      <p style={{ marginBottom: '16px' }}>
        Set the default employer superannuation contribution rate applied to payroll calculations.
      </p>

      {status.message ? (
        <div
          style={{
            marginBottom: '12px',
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${status.type === 'error' ? '#fecdd3' : '#bbf7d0'}`,
            backgroundColor: status.type === 'error' ? '#fef2f2' : '#ecfdf3',
            color: status.type === 'error' ? '#b91c1c' : '#15803d',
            fontWeight: 600,
          }}
        >
          {status.message}
        </div>
      ) : null}

      <div
        style={{
          padding: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          background: '#ffffff',
          maxWidth: '360px',
          boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 700, color: '#0f172a' }}>
          Super rate (%)
          <input
            type="number"
            min="0"
            step="0.1"
            name="superRate"
            value={form.superRate}
            onChange={handleChange}
            disabled={loading || saving}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
            }}
          />
        </label>
        <div style={{ marginTop: '12px', textAlign: 'right' }}>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              opacity: saving || loading ? 0.8 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        <div style={{ marginTop: '8px', color: '#475569', fontSize: '13px' }}>
          {loading ? 'Loading current rate…' : 'Applied to future payroll calculations.'}
        </div>
      </div>
    </div>
  );
};

export default SuperPayments;
