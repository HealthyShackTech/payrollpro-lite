import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import './PersonalDetails.css';

const PersonalDetails = ({ onUpdateEmployee = async () => {} }) => { // Fallback function added
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [editableFields, setEditableFields] = useState({
    firstName: '',
    middleName: '',
    surname: '',
    jobTitle: '',
    gender: '',
    dateOfBirth: '',
    salary: '',
    address: '',
    suburb: '',
    state: '',
    country: '',
    postcode: '',
    mobileNumber: '',
    phoneNumber: '',
    email: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: '',
      email: '',
    },
  });

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const response = await api.get(`/api/employees/${id}`);
        if (!response.data) throw new Error('Employee not found');
        setEmployee(response.data);
        
        // Create a clean copy of the employee data without certain fields
        const cleanEmployeeData = { ...response.data };
        delete cleanEmployeeData._id; // Remove _id as it's not editable
        delete cleanEmployeeData.employmentStatus;
        delete cleanEmployeeData.startDate;
        delete cleanEmployeeData.awardsClassification;
        
        // Sync normalRate to salary if salary is empty but normalRate exists
        if (!cleanEmployeeData.salary && cleanEmployeeData.normalRate) {
          cleanEmployeeData.salary = cleanEmployeeData.normalRate;
        }
        // Or sync salary to normalRate if normalRate is empty but salary exists
        else if (!cleanEmployeeData.normalRate && cleanEmployeeData.salary) {
          cleanEmployeeData.normalRate = cleanEmployeeData.salary;
        }
        
        // Ensure emergencyContact object exists and has proper structure
        if (!cleanEmployeeData.emergencyContact) {
          cleanEmployeeData.emergencyContact = {
            name: '',
            relationship: '',
            phoneNumber: '',
            email: ''
          };
        }
        
        setEditableFields(cleanEmployeeData);
      } catch (error) {
        console.error('Error fetching employee details:', error);
        setError('Employee not found');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetails();
  }, [id]);

  const handleInputChange = (field, value) => {
    setEditableFields((prevFields) => ({ ...prevFields, [field]: value }));
  };

  const handleEmergencyInputChange = (field, value) => {
    setEditableFields((prevFields) => ({
      ...prevFields,
      emergencyContact: { ...prevFields.emergencyContact, [field]: value },
    }));
  };

  const handleUpdate = async () => {
    try {
      // Sync salary to normalRate when updating personal details
      const updateData = {
        ...editableFields,
        normalRate: editableFields.salary // Sync salary to normalRate
      };
      await api.put(`/api/employees/${employee._id}`, updateData);
      setUpdateSuccess(true);
      setError('');
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating employee:', error);
      setError(`Error updating employee: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error || !employee) return <div>{error || 'Employee not found'}</div>;

  return (
    <div className="personal-details">
      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate('/employee-management')}>Back</button>
      </div>

      <h2>Personal Details for {employee.firstName} {employee.surname}</h2>
      <div className="staff-id-display">
        <strong>Staff ID:</strong> 
        <span className="staff-id-value">{employee._id?.toString().padStart(8, '0')}</span>
        <span className="read-only-badge">(Read Only)</span>
      </div>

      {editableFields && Object.keys(editableFields).filter(key => key !== 'emergencyContact' && key !== 'employmentStatus' && key !== 'startDate' && key !== 'awardsClassification' && key !== 'taxFileNumber' && key !== '_id' && key !== 'normalRate').map((key) => (
        <label key={key}>
          {key === 'salary' ? 'Salary (Normal Rate $/hour):' : key.charAt(0).toUpperCase() + key.slice(1)}:
          {key === 'gender' ? (
            <select
              value={editableFields[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          ) : (
            <input
              type={key === 'dateOfBirth' ? 'date' : key === 'salary' ? 'number' : 'text'}
              step={key === 'salary' ? '0.01' : undefined}
              value={editableFields[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={key === 'salary' ? 'Enter hourly rate (same as Normal Rate in Employment Details)' : ''}
            />
          )}
        </label>
      ))}

      <h3>Emergency Contact</h3>
      {editableFields && editableFields.emergencyContact && Object.keys(editableFields.emergencyContact).length > 0 ? (
        Object.keys(editableFields.emergencyContact).map((key) => (
          <label key={key}>
            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}:
            <input
              type="text"
              value={editableFields.emergencyContact[key] || ''}
              onChange={(e) => handleEmergencyInputChange(key, e.target.value)}
              placeholder={`Enter ${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim().toLowerCase()}`}
            />
          </label>
        ))
      ) : (
        <div className="emergency-contact-fallback">
          <label>
            Name:
            <input
              type="text"
              value={editableFields?.emergencyContact?.name || ''}
              onChange={(e) => handleEmergencyInputChange('name', e.target.value)}
              placeholder="Enter emergency contact name"
            />
          </label>
          <label>
            Relationship:
            <input
              type="text"
              value={editableFields?.emergencyContact?.relationship || ''}
              onChange={(e) => handleEmergencyInputChange('relationship', e.target.value)}
              placeholder="Enter relationship"
            />
          </label>
          <label>
            Phone Number:
            <input
              type="text"
              value={editableFields?.emergencyContact?.phoneNumber || ''}
              onChange={(e) => handleEmergencyInputChange('phoneNumber', e.target.value)}
              placeholder="Enter phone number"
            />
          </label>
          <label>
            Email:
            <input
              type="text"
              value={editableFields?.emergencyContact?.email || ''}
              onChange={(e) => handleEmergencyInputChange('email', e.target.value)}
              placeholder="Enter email"
            />
          </label>
        </div>
      )}

      <button onClick={handleUpdate}>Update</button>
      {updateSuccess && <p className="success-message">Update successfully!</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default PersonalDetails;
