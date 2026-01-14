// src/components/SingleTouchPayroll.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

const tabs = [
  { key: 'stp-reports', label: 'STP reports' },
  { key: 'employee-terminations', label: 'Employee terminations' },
  { key: 'eofy-finalisation', label: 'EOFY finalisation' },
  { key: 'ato-settings', label: 'ATO settings' },
];

const SingleTouchPayroll = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stp-reports');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [stpRows, setStpRows] = useState([]);
  const [forms, setForms] = useState({
    'stp-reports': {
      payrollYear: '2025/26',
    },
    'employee-terminations': {
      defaultType: 'Normal termination',
      includeLumpSumA: true,
      includeLumpSumB: false,
      showReason: true,
      payoutLeaveType: 'ETP',
      notifyTerminated: true,
    },
    'eofy-finalisation': {
      financialYear: '2025/26',
      includeRfba: false,
    },
    'ato-settings': {
      businessName: 'HEALTHY SHACK TECH',
      abn: '11 624 672 279',
      gstBranch: '1',
      addressLine1: '42 Murray St Hobart',
      addressLine2: '',
      suburb: '42 Murray St Hobart',
      state: 'TAS',
      postcode: '7000',
      contactFirst: 'Junkai',
      contactLast: 'Ding',
      contactEmail: 'kevin.ding@healthyshack.tech',
      contactPhone: '0450975766',
      softwareId: '9115945835',
      stpAbn: '11 624 672 279',
    },
  });
  const [terminationRows, setTerminationRows] = useState([]);
  const [eofySummary, setEofySummary] = useState({ employees: 0, grossYtd: 0, paygYtd: 0 });
  const [eofyRows, setEofyRows] = useState([]);
  const [loading, setLoading] = useState({ settings: false, reports: false, terminations: false, eofy: false });

  const containerStyle = {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    color: '#0f172a',
  };

  const cardStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    background: '#ffffff',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
  };

  const tabBarStyle = {
    display: 'flex',
    gap: '20px',
    marginBottom: '12px',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '4px',
  };

  const tabButtonStyle = (isActive) => ({
    border: 'none',
    background: 'transparent',
    color: isActive ? '#1f2937' : '#475569',
    padding: '10px 0',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '18px',
    position: 'relative',
    borderBottom: isActive ? '4px solid #2563eb' : '4px solid transparent',
    transition: 'color 0.15s ease, border-color 0.2s ease',
    borderRadius: '0',
  });

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '14px',
    marginTop: '12px',
  };

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '10px',
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
  };

  const inputStyle = {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    background: '#ffffff',
  };

  const handleChange = (tabKey, field, value) => {
    setForms((prev) => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        [field]: value,
      },
    }));
  };

  const loadSettings = async () => {
    setLoading((prev) => ({ ...prev, settings: true }));
    try {
      const response = await api.get('/api/stp/settings');
      const record = response.data?.data;
      if (record) {
        setForms((prev) => ({
          ...prev,
          ...(record.stpReports ? { 'stp-reports': { ...prev['stp-reports'], ...record.stpReports } } : {}),
          ...(record.employeeTerminations
            ? { 'employee-terminations': { ...prev['employee-terminations'], ...record.employeeTerminations } }
            : {}),
          ...(record.eofyFinalisation ? { 'eofy-finalisation': { ...prev['eofy-finalisation'], ...record.eofyFinalisation } } : {}),
          ...(record.atoSettings ? { 'ato-settings': { ...prev['ato-settings'], ...record.atoSettings } } : {}),
        }));
      }
    } catch (error) {
      console.error('Failed to load STP settings', error);
      setStatus({ type: 'error', message: 'Failed to load STP settings' });
    } finally {
      setLoading((prev) => ({ ...prev, settings: false }));
    }
  };

  const fetchReports = async () => {
    setLoading((prev) => ({ ...prev, reports: true }));
    try {
      const response = await api.get('/api/stp/reports', {
        params: { year: forms['stp-reports'].payrollYear },
      });
      setStpRows(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load STP reports', error);
      setStatus({ type: 'error', message: 'Failed to load STP reports' });
    } finally {
      setLoading((prev) => ({ ...prev, reports: false }));
    }
  };

  const fetchTerminations = async () => {
    setLoading((prev) => ({ ...prev, terminations: true }));
    try {
      const response = await api.get('/api/stp/terminations', {
        params: { year: forms['stp-reports'].payrollYear },
      });
      setTerminationRows(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load STP terminations', error);
      setStatus({ type: 'error', message: 'Failed to load terminations' });
    } finally {
      setLoading((prev) => ({ ...prev, terminations: false }));
    }
  };

  const fetchEofy = async () => {
    setLoading((prev) => ({ ...prev, eofy: true }));
    try {
      const response = await api.get('/api/stp/eofy', {
        params: { year: forms['eofy-finalisation'].financialYear },
      });
      const data = response.data?.data || {};
      setEofySummary(data.summary || { employees: 0, grossYtd: 0, paygYtd: 0 });
      setEofyRows(data.rows || []);
    } catch (error) {
      console.error('Failed to load EOFY data', error);
      setStatus({ type: 'error', message: 'Failed to load EOFY data' });
    } finally {
      setLoading((prev) => ({ ...prev, eofy: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const payload = {
        stpReports: forms['stp-reports'],
        employeeTerminations: forms['employee-terminations'],
        eofyFinalisation: forms['eofy-finalisation'],
        atoSettings: forms['ato-settings'],
      };
      await api.put('/api/stp/settings', payload);
      setStatus({ type: 'success', message: `Saved ${tabs.find((t) => t.key === activeTab)?.label || 'settings'}.` });
    } catch (error) {
      console.error('Failed to save STP settings', error);
      setStatus({ type: 'error', message: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    fetchReports();
    fetchTerminations();
  }, [forms['stp-reports'].payrollYear]);

  useEffect(() => {
    fetchEofy();
  }, [forms['eofy-finalisation'].financialYear]);

  const renderSTPReports = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ ...fieldStyle, background: '#fff' }}>
        <span style={{ ...labelStyle, fontSize: '18px', color: '#1f2937' }}>Payroll year</span>
        <select
          value={forms['stp-reports'].payrollYear}
          onChange={(e) => handleChange('stp-reports', 'payrollYear', e.target.value)}
          style={{ ...inputStyle, maxWidth: '220px' }}
        >
          <option>2025/26</option>
          <option>2024/25</option>
          <option>2023/24</option>
        </select>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '14px 16px',
          background: '#ffffff',
        }}
      >
        <button
          style={{
            backgroundColor: '#0f9d58',
            color: '#ffffff',
            border: 'none',
            padding: '12px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 18px rgba(16, 185, 129, 0.25)',
          }}
        >
          Send update event
        </button>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: '#0ea5e9',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '18px' }}>ⓘ</span> About update events
        </button>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: '#ffffff' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 1.4fr 1fr 1.3fr 1.3fr 1.1fr',
            padding: '14px 16px',
            background: '#f8fafc',
            fontWeight: 800,
            color: '#0f172a',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <span>Pay period</span>
          <span>Date of payment</span>
          <span>Date recorded</span>
          <span>Employees</span>
          <span>Gross payments ($)</span>
          <span>PAYG Withholding ($)</span>
          <span>Status</span>
        </div>
        {loading.reports ? (
          <div style={{ padding: '18px 16px', fontWeight: 600, color: '#475569' }}>Loading STP reports…</div>
        ) : stpRows.length === 0 ? (
          <div style={{ padding: '18px 16px', fontWeight: 600, color: '#475569' }}>
            No STP reports found for this payroll year.
          </div>
        ) : (
          stpRows.map((row, idx) => (
            <div
              key={`${row.payrunId || row.payPeriod}-${idx}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.2fr 1.4fr 1fr 1.3fr 1.3fr 1.1fr',
                padding: '14px 16px',
                background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                alignItems: 'center',
                borderBottom: idx === stpRows.length - 1 ? 'none' : '1px solid #e2e8f0',
                color: '#0f172a',
                fontWeight: 600,
              }}
            >
              <span>{row.payPeriod || '—'}</span>
              <span>{row.paymentDate || '—'}</span>
              <span>{row.recordedAt || '—'}</span>
              <span>{row.employees ?? '—'}</span>
              <span>{row.grossPayments?.toLocaleString?.('en-AU', { minimumFractionDigits: 2 }) ?? '—'}</span>
              <span>{row.paygWithholding?.toLocaleString?.('en-AU', { minimumFractionDigits: 2 }) ?? '—'}</span>
              <span>
                <span
                  style={{
                    backgroundColor: '#d1fae5',
                    color: '#15803d',
                    padding: '6px 10px',
                    borderRadius: '999px',
                    fontWeight: 700,
                  }}
                >
                  {row.status || 'Pending'}
                </span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTerminations = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ ...fieldStyle, background: '#fff', maxWidth: '260px', margin: 0 }}>
          <span style={{ ...labelStyle, fontSize: '18px', color: '#1f2937' }}>Payroll year</span>
          <select
            value={forms['stp-reports'].payrollYear}
            onChange={(e) => handleChange('stp-reports', 'payrollYear', e.target.value)}
            style={{ ...inputStyle }}
          >
            <option>2025/26</option>
            <option>2024/25</option>
            <option>2023/24</option>
          </select>
        </div>
        <button
          style={{
            backgroundColor: '#0f9d58',
            color: '#ffffff',
            border: 'none',
            padding: '12px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 18px rgba(16, 185, 129, 0.25)',
            height: '48px',
          }}
        >
          Add Termination
        </button>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: '#ffffff' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1.6fr 1fr 1.2fr 1.8fr',
            padding: '14px 16px',
            background: '#f8fafc',
            fontWeight: 800,
            color: '#0f172a',
            borderBottom: '1px solid #e2e8f0',
            alignItems: 'center',
          }}
        >
          <span>First name</span>
          <span>Surname or family name</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            ETP <span style={{ fontSize: '18px' }}>ⓘ</span>
          </span>
          <span>Termination date</span>
          <span>Termination reason</span>
        </div>

        {loading.terminations ? (
          <div
            style={{
              padding: '24px 16px',
              color: '#475569',
              fontWeight: 600,
            }}
          >
            Loading terminations…
          </div>
        ) : terminationRows.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              color: '#475569',
              fontWeight: 600,
            }}
          >
            No terminations recorded for this payroll year.
          </div>
        ) : (
          terminationRows.map((row, idx) => (
            <div
              key={`${row._id || row.firstName || idx}-${idx}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.6fr 1fr 1.2fr 1.8fr',
                padding: '14px 16px',
                background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                alignItems: 'center',
                borderBottom: idx === terminationRows.length - 1 ? 'none' : '1px solid #e2e8f0',
                color: '#0f172a',
                fontWeight: 600,
              }}
            >
              <span>{row.firstName || '—'}</span>
              <span>{row.lastName || '—'}</span>
              <span>{row.etp || '—'}</span>
              <span>{row.terminationDate || '—'}</span>
              <span>{row.reason || '—'}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderEOFY = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ ...fieldStyle, background: '#fff', maxWidth: '260px', margin: 0 }}>
          <span style={{ ...labelStyle, fontSize: '18px', color: '#1f2937' }}>Payroll year</span>
          <select
            value={forms['eofy-finalisation'].financialYear}
            onChange={(e) => handleChange('eofy-finalisation', 'financialYear', e.target.value)}
            style={{ ...inputStyle }}
          >
            <option>2025/26</option>
            <option>2024/25</option>
            <option>2023/24</option>
          </select>
        </div>
        <div style={{ textAlign: 'right', minWidth: '240px', color: '#0f172a', fontWeight: 700 }}>
          <div style={{ marginBottom: '4px' }}>
            Employees <span style={{ fontWeight: 800 }}>{eofySummary.employees ?? 0}</span>
          </div>
          <div style={{ marginBottom: '4px' }}>
            Gross payments YTD <span style={{ fontWeight: 800 }}>{(eofySummary.grossYtd ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ marginBottom: '8px' }}>
            PAYG withholding YTD <span style={{ fontWeight: 800 }}>{(eofySummary.paygYtd ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
          </div>
          <label style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <input
              type="checkbox"
              checked={forms['eofy-finalisation'].includeRfba}
              onChange={(e) => handleChange('eofy-finalisation', 'includeRfba', e.target.checked)}
            />
            Reportable fringe benefit amounts (RFBA)
            <span style={{ fontSize: '18px' }}>ⓘ</span>
          </label>
        </div>
      </div>

      <button
        style={{
          background: 'transparent',
          border: 'none',
          color: '#7c3aed',
          fontWeight: 800,
          cursor: 'pointer',
          padding: 0,
          fontSize: '16px',
          textDecoration: 'underline',
          width: 'fit-content',
        }}
      >
        View YTD verification report (PDF)
      </button>

      <div
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          background: '#ffffff',
          padding: '14px 16px',
          color: '#475569',
          fontWeight: 700,
        }}
      >
        Select an employee from the list to finalise or remove a finalisation. <span style={{ fontSize: '18px' }}>ⓘ</span>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', background: '#ffffff' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '0.6fr 1.4fr 1.6fr 1.4fr 1.3fr 1.5fr 0.6fr',
            padding: '14px 16px',
            background: '#f8fafc',
            fontWeight: 800,
            color: '#0f172a',
            borderBottom: '1px solid #e2e8f0',
            alignItems: 'center',
            columnGap: '10px',
          }}
        >
          <span></span>
          <span>First name ▲</span>
          <span>Surname or family name ▼</span>
          <span>Employment end date</span>
          <span>Gross YTD ($)</span>
          <span>PAYG withholding YTD ($)</span>
          <span>Final indicator</span>
        </div>

        {loading.eofy ? (
          <div style={{ padding: '18px 16px', fontWeight: 600, color: '#475569' }}>Loading EOFY data…</div>
        ) : eofyRows.length === 0 ? (
          <div style={{ padding: '18px 16px', fontWeight: 600, color: '#475569' }}>No employees to finalise for this year.</div>
        ) : (
          eofyRows.map((row, idx) => (
            <div
              key={`${row.employeeId || idx}-${idx}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '0.6fr 1.4fr 1.6fr 1.4fr 1.3fr 1.5fr 0.6fr',
                padding: '14px 16px',
                background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                alignItems: 'center',
                borderBottom: idx === eofyRows.length - 1 ? 'none' : '1px solid #e2e8f0',
                color: '#0f172a',
                fontWeight: 600,
                columnGap: '10px',
              }}
            >
              <input type="checkbox" />
              <span>{row.firstName || '—'}</span>
              <span>{row.lastName || '—'}</span>
              <span>{row.endDate || '—'}</span>
              <span>{(row.grossYtd ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
              <span>{(row.paygYtd ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
              <span style={{ textAlign: 'center' }}>⋯</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderATOSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Business details for the ATO</div>
        <div style={{ color: '#475569', marginBottom: '12px', fontWeight: 600 }}>
          These are the details the ATO has for your business, keep this up to date.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>Business Name*</span>
            <input
              type="text"
              value={forms['ato-settings'].businessName}
              onChange={(e) => handleChange('ato-settings', 'businessName', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>ABN*</span>
            <input
              type="text"
              value={forms['ato-settings'].abn}
              onChange={(e) => handleChange('ato-settings', 'abn', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>GST branch number</span>
            <input
              type="text"
              value={forms['ato-settings'].gstBranch}
              onChange={(e) => handleChange('ato-settings', 'gstBranch', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div style={fieldStyle}>
              <span style={labelStyle}>Address*</span>
              <input
                type="text"
                value={forms['ato-settings'].addressLine1}
                onChange={(e) => handleChange('ato-settings', 'addressLine1', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Address line 2</span>
              <input
                type="text"
                value={forms['ato-settings'].addressLine2}
                onChange={(e) => handleChange('ato-settings', 'addressLine2', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Suburb/town/locality*</span>
              <input
                type="text"
                value={forms['ato-settings'].suburb}
                onChange={(e) => handleChange('ato-settings', 'suburb', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>State/territory*</span>
              <select
                value={forms['ato-settings'].state}
                onChange={(e) => handleChange('ato-settings', 'state', e.target.value)}
                style={inputStyle}
              >
                <option value="ACT">ACT</option>
                <option value="NSW">NSW</option>
                <option value="NT">NT</option>
                <option value="QLD">QLD</option>
                <option value="SA">SA</option>
                <option value="TAS">TAS</option>
                <option value="VIC">VIC</option>
                <option value="WA">WA</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <span style={labelStyle}>Postcode*</span>
              <input
                type="text"
                value={forms['ato-settings'].postcode}
                onChange={(e) => handleChange('ato-settings', 'postcode', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            style={{
              backgroundColor: '#0f9d58',
              color: '#ffffff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 18px rgba(16, 185, 129, 0.25)',
            }}
          >
            Update business details
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Business contact details for the ATO</div>
        <div style={{ color: '#475569', marginBottom: '12px', fontWeight: 600 }}>
          The ATO will use these details if they need to get in contact with someone from the business.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>First name*</span>
            <input
              type="text"
              value={forms['ato-settings'].contactFirst}
              onChange={(e) => handleChange('ato-settings', 'contactFirst', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Surname or family name*</span>
            <input
              type="text"
              value={forms['ato-settings'].contactLast}
              onChange={(e) => handleChange('ato-settings', 'contactLast', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Email*</span>
            <input
              type="email"
              value={forms['ato-settings'].contactEmail}
              onChange={(e) => handleChange('ato-settings', 'contactEmail', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Phone*</span>
            <input
              type="tel"
              value={forms['ato-settings'].contactPhone}
              onChange={(e) => handleChange('ato-settings', 'contactPhone', e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button
            style={{
              backgroundColor: '#0f9d58',
              color: '#ffffff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 18px rgba(16, 185, 129, 0.25)',
            }}
          >
            Update contact details
          </button>
        </div>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', background: '#ffffff' }}>
        <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Business ABN connected to the ATO</div>
        <div style={{ color: '#475569', marginBottom: '12px', fontWeight: 600 }}>
          Below is the ABN connected to the ATO. If you’ve had issues sending data to the ATO, the ABN might be wrong.
        </div>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: '#7c3aed',
            fontWeight: 800,
            cursor: 'pointer',
            padding: 0,
            marginBottom: '12px',
            width: 'fit-content',
            textDecoration: 'underline',
          }}
        >
          Edit STP business details
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={fieldStyle}>
            <span style={labelStyle}>ABN</span>
            <input type="text" value={forms['ato-settings'].stpAbn} disabled style={{ ...inputStyle, background: '#f8fafc' }} />
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Software ID</span>
            <input
              type="text"
              value={forms['ato-settings'].softwareId}
              disabled
              style={{ ...inputStyle, background: '#f8fafc' }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const content = useMemo(() => {
    switch (activeTab) {
      case 'employee-terminations':
        return renderTerminations();
      case 'eofy-finalisation':
        return renderEOFY();
      case 'ato-settings':
        return renderATOSettings();
      default:
        return renderSTPReports();
    }
  }, [activeTab, forms, stpRows, terminationRows, eofyRows, eofySummary, loading]);

  return (
    <div style={containerStyle}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0' }}>Single Touch Payroll</h1>
          <p style={{ margin: 0, color: '#475569' }}>Configure lodgement, termination and ATO details for STP.</p>
        </div>
        <div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)',
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={tabBarStyle}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={tabButtonStyle(activeTab === tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>{content}</div>

        {status.message ? (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecdd3'}`,
              backgroundColor: status.type === 'success' ? '#ecfdf3' : '#fef2f2',
              color: status.type === 'success' ? '#15803d' : '#b91c1c',
              fontWeight: 600,
            }}
          >
            {status.message}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SingleTouchPayroll;
