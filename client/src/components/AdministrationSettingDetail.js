// src/components/AdministrationSettingDetail.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/axiosConfig';

const settingDetails = {
  business: {
    title: 'Business Setting',
    description: 'Configure company information, addresses, branding, and compliance details.',
  },
  payroll: {
    title: 'Payroll Setting',
    description: 'Set pay schedules, leave accrual rules, deductions, and pay item defaults.',
    children: [
      { key: 'pay-items', label: 'Pay Items' },
      { key: 'superannuation-payments', label: 'Superannuation Payments' },
      { key: 'single-touch-payroll', label: 'Single Touch Payroll' },
    ],
  },
  report: {
    title: 'Report Setting',
    description: 'Manage report templates, export formats, and delivery preferences.',
  },
  'import-export': {
    title: 'Import and Export data',
    description: 'Import employees or pay items, and export reports or journals for accounting.',
  },
};

const businessSections = [
  {
    title: 'Business details',
    description: 'Update the primary identifiers used on invoices and filings.',
    fields: [
      { label: 'Business name', name: 'businessName' },
      { label: 'Trading name', name: 'tradingName' },
      { label: 'ABN', name: 'abn' },
      { label: 'ACN', name: 'acn' },
    ],
  },
  {
    title: 'Industry details',
    description: 'Keep your industry classifications current for compliance.',
    fields: [
      { label: 'Business industry', name: 'businessIndustry' },
      { label: 'Specific industry code', name: 'specificIndustryCode' },
    ],
  },
  {
    title: 'Contact details',
    description: 'Where we can reach you and what appears on documents.',
    fields: [
      { label: 'Address', name: 'address' },
      { label: 'Website', name: 'website' },
      { label: 'Email', name: 'email', type: 'email' },
      { label: 'Phone', name: 'phone', type: 'tel' },
      { label: 'Fax', name: 'fax' },
    ],
  },
];

const AdministrationSettingDetail = () => {
  const navigate = useNavigate();
  const { setting } = useParams();
  const detail = settingDetails[setting];
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    tradingName: '',
    abn: '',
    acn: '',
    businessIndustry: '',
    specificIndustryCode: '',
    address: '',
    website: '',
    email: '',
    phone: '',
    fax: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const isBusinessSetting = useMemo(() => setting === 'business', [setting]);

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      if (!isBusinessSetting) return;
      setLoading(true);
      setStatus({ type: '', message: '' });
      try {
        const response = await api.get('/api/business-settings');
        if (response.data?.data) {
          const record = response.data.data;
          setBusinessForm((prev) => ({
            ...prev,
            ...record,
          }));
        }
      } catch (error) {
        console.error('Failed to load business settings', error);
        setStatus({ type: 'error', message: 'Failed to load business settings' });
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessSettings();
  }, [isBusinessSetting]);

  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    setBusinessForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await api.put('/api/business-settings', businessForm);
      if (response.data?.data) {
        setBusinessForm((prev) => ({
          ...prev,
          ...response.data.data,
        }));
      }
      setStatus({ type: 'success', message: 'Business settings saved' });
    } catch (error) {
      console.error('Failed to save business settings', error);
      setStatus({ type: 'error', message: error?.response?.data?.error || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (!detail) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <p>Unknown setting.</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 12px',
            marginTop: '12px',
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
      </div>
    );
  }

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
      <h1 style={{ marginBottom: '10px' }}>{detail.title}</h1>
      <p style={{ marginBottom: '10px' }}>{detail.description}</p>
      {setting === 'payroll' && detail.children ? (
        <ul style={{ marginTop: '12px', paddingLeft: '16px', lineHeight: '1.8' }}>
          {detail.children.map((item) => (
            <li key={item.key} style={{ marginBottom: '6px' }}>
              <button
                onClick={() => navigate(`/administration/settings/${setting}/${item.key}`)}
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
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : isBusinessSetting ? (
        <div className="setting-grid">
          {status.message ? (
            <div className={`setting-status ${status.type === 'error' ? 'error' : 'success'}`}>
              {status.message}
            </div>
          ) : null}
          {businessSections.map((section) => (
            <div key={section.title} className="setting-card">
              <div className="setting-card-header">
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
              <div className="setting-fields">
                {section.fields.map((field) => (
                  <label key={field.name} className="setting-field">
                    <span>{field.label}</span>
                    <input
                      type={field.type || 'text'}
                      name={field.name}
                      value={businessForm[field.name] || ''}
                      onChange={handleBusinessChange}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      disabled={loading || saving}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="setting-actions">
            <button
              className="setting-save-button"
              onClick={handleSaveBusiness}
              disabled={loading || saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#f8fafc' }}>
          <p style={{ margin: 0, color: '#334155' }}>Setting details go here.</p>
        </div>
      )}
    </div>
  );
};

export default AdministrationSettingDetail;
