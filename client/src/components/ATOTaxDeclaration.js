import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ATOTaxDeclaration.css';

const ATOTaxDeclaration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    taxFileNumber: '',
    fullName: '',
    address: '',
    dateOfBirth: '',
    maritalStatus: 'single',
    hasPrivateHealthInsurance: false,
    hasSpouse: false,
    spouseName: '',
    spouseTFN: '',
    dependents: 0,
    declarationDate: new Date().toISOString().split('T')[0],
    signature: '',
    witnessName: '',
    witnessSignature: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/employees/${id}`);
        const employee = response.data;
        setFormData(prev => ({
          ...prev,
          fullName: `${employee.firstName} ${employee.surname}`,
          address: employee.address || '',
          dateOfBirth: employee.dateOfBirth || '',
          taxFileNumber: employee.taxFileNumber || ''
        }));
      } catch (error) {
        console.error('Error fetching employee data:', error);
        setError('Error fetching employee data');
      }
    };

    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateTFN = async (tfn) => {
    if (!tfn) return false;
    
    try {
      const response = await axios.post('http://localhost:5001/api/validate-tfn', { tfn });
      return response.data.isValid;
    } catch (error) {
      console.error('Error validating TFN:', error);
      return false;
    }
  };

  const handleTFNChange = async (e) => {
    const tfn = e.target.value;
    setFormData(prev => ({ ...prev, taxFileNumber: tfn }));
    
    if (tfn.length === 9) {
      setIsValidating(true);
      const isValid = await validateTFN(tfn);
      setIsValidating(false);
      
      if (!isValid) {
        setError('Invalid Tax File Number format');
      } else {
        setError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.taxFileNumber) {
      setError('Tax File Number is required');
      return;
    }

    try {
      // Validate TFN before submission
      const isValidTFN = await validateTFN(formData.taxFileNumber);
      if (!isValidTFN) {
        setError('Invalid Tax File Number format');
        return;
      }

      // Submit tax declaration
      const response = await axios.post(`http://localhost:5001/api/employees/${id}/tax-declaration`, formData);
      
      setMessage('Tax declaration submitted successfully');
      setError('');
      
      // Clear form after successful submission
      setTimeout(() => {
        setMessage('');
        navigate(-1);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting tax declaration:', error);
      const errorMessage = error.response ? error.response.data.message : 'Error submitting tax declaration';
      setError(errorMessage);
      setMessage('');
    }
  };

  return (
    <div className="ato-tax-declaration">
      <div className="declaration-header">
        <h2>ATO Tax Declaration Form</h2>
        <p className="declaration-subtitle">
          Australian Taxation Office - Tax File Number Declaration
        </p>
        <button className="back-button" onClick={() => navigate(-1)}>Back</button>
      </div>

      <form onSubmit={handleSubmit} className="declaration-form">
        <div className="form-section">
          <h3>Employee Information</h3>
          
          <div className="form-group">
            <label htmlFor="fullName">Full Name *</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth *</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="taxFileNumber">
              Tax File Number (TFN) *
              {isValidating && <span className="validating">Validating...</span>}
            </label>
            <input
              type="text"
              id="taxFileNumber"
              name="taxFileNumber"
              value={formData.taxFileNumber}
              onChange={handleTFNChange}
              required
              className="form-input"
              maxLength="9"
              placeholder="Enter 9-digit TFN"
            />
            <small className="form-help">
              Your TFN is confidential and will be used for tax purposes only
            </small>
          </div>
        </div>

        <div className="form-section">
          <h3>Tax Status</h3>
          
          <div className="form-group">
            <label htmlFor="maritalStatus">Marital Status *</label>
            <select
              id="maritalStatus"
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleInputChange}
              required
              className="form-select"
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="de_facto">De Facto</option>
              <option value="widowed">Widowed</option>
              <option value="divorced">Divorced</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasPrivateHealthInsurance"
                checked={formData.hasPrivateHealthInsurance}
                onChange={handleInputChange}
                className="form-checkbox"
              />
              I have private health insurance
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="dependents">Number of Dependents</label>
            <input
              type="number"
              id="dependents"
              name="dependents"
              value={formData.dependents}
              onChange={handleInputChange}
              min="0"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Declaration</h3>
          
          <div className="declaration-text">
            <p>
              I declare that the information provided in this form is true and correct. 
              I understand that providing false or misleading information may result in penalties.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="signature">Employee Signature *</label>
            <input
              type="text"
              id="signature"
              name="signature"
              value={formData.signature}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Type your full name to sign"
            />
          </div>

          <div className="form-group">
            <label htmlFor="declarationDate">Date of Declaration *</label>
            <input
              type="date"
              id="declarationDate"
              name="declarationDate"
              value={formData.declarationDate}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Submit Declaration
          </button>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default ATOTaxDeclaration;

