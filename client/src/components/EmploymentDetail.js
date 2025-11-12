import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import './EmploymentDetail.css';

const EmploymentDetail = () => { 
  const { id } = useParams();
  const navigate = useNavigate();
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [awardsClassification, setAwardsClassification] = useState('');
  const [normalRate, setNormalRate] = useState('');
  const [saturdayRate, setSaturdayRate] = useState('');
  const [sundayRate, setSundayRate] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [directorFee, setDirectorFee] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch current employment details
    const fetchEmploymentDetails = async () => {
      try {
        const response = await api.get(`/api/employees/${id}`);
        const data = response.data;
        setEmploymentStatus(data.employmentStatus || '');
        setStartDate(data.startDate || '');
        setAwardsClassification(data.awardsClassification || '');
        // If normalRate exists, use it; otherwise use salary as fallback
        setNormalRate(data.normalRate || data.salary || '');
        setSaturdayRate(data.saturdayRate || '');
        setSundayRate(data.sundayRate || '');
        setCustomRate(data.customRate || '');
        setDirectorFee(data.directorFee || '');
      } catch (error) {
        console.error('Error fetching employment details:', error);
      }
    };

    fetchEmploymentDetails();
  }, [id]);

  const handleUpdate = async () => {
    try {
      // PUT request to update employment details
      // Also sync normalRate to salary field
      const response = await api.put(`/api/employees/${id}`, {
        employmentStatus,
        startDate,
        awardsClassification,
        normalRate,
        saturdayRate,
        sundayRate,
        customRate,
        directorFee,
        salary: normalRate // Sync normalRate to salary
      });
      setMessage('Employment details updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating employment details:', error);
      setMessage('Error updating employment details');
    }
  };

  return (
    <div className="employment-details">
      <h2>Employment Details for Employee ID: {id}</h2>
      <button className="back-button" onClick={() => navigate(`/employee-management/${id}`)}>
        ← Back to Staff Details
      </button>

      <label>
        Employment Status:
        <select value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)}>
          <option value="">Select Employment Status</option>
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
          <option value="Casual">Casual</option>
        </select>
      </label>

      <label>
        Start Date:
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>

      <label>
        Awards Classification:
        <input
          type="text"
          value={awardsClassification}
          onChange={(e) => setAwardsClassification(e.target.value)}
          placeholder="Enter Awards Classification"
        />
      </label>

      <div className="rate-section">
        <h3>Rate Information</h3>
        <div className="rate-grid">
          <div className="rate-field">
            <label>
              Normal Rate ($/hour):
              <input
                type="number"
                step="0.01"
                value={normalRate}
                onChange={(e) => setNormalRate(e.target.value)}
                placeholder="Enter normal hourly rate"
              />
            </label>
          </div>

          <div className="rate-field">
            <label>
              Saturday Rate ($/hour):
              <input
                type="number"
                step="0.01"
                value={saturdayRate}
                onChange={(e) => setSaturdayRate(e.target.value)}
                placeholder="Enter Saturday hourly rate"
              />
            </label>
          </div>

          <div className="rate-field">
            <label>
              Sunday Rate ($/hour):
              <input
                type="number"
                step="0.01"
                value={sundayRate}
                onChange={(e) => setSundayRate(e.target.value)}
                placeholder="Enter Sunday hourly rate"
              />
            </label>
          </div>

          <div className="rate-field">
            <label>
              Custom Rate ($/hour):
              <input
                type="number"
                step="0.01"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="Enter custom hourly rate"
              />
            </label>
          </div>

          <div className="rate-field">
            <label>
              Director Fee ($):
              <input
                type="number"
                step="0.01"
                value={directorFee}
                onChange={(e) => setDirectorFee(e.target.value)}
                placeholder="Enter director fee amount"
              />
            </label>
          </div>
        </div>
      </div>

      <button onClick={handleUpdate}>Update Employment Details</button>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default EmploymentDetail;
