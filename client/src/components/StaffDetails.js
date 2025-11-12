import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StaffDetails.css';

const StaffDetails = () => {
  const { id } = useParams();  // Extracting the ID from the URL
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch employee details by ID
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/employees/${id}`);
        if (!response.data) {
          throw new Error('Employee not found');
        }
        setEmployee(response.data);
      } catch (error) {
        console.error('Error fetching employee details:', error);
        setError('Employee not found');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetails();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !employee) {
    return <div>{error || 'Employee not found'}</div>;
  }

  const formattedId = employee._id ? employee._id.toString().padStart(8, '0') : 'N/A';  // Ensuring ID is formatted

  return (
    <div className="staff-details">
      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate('/employee-management')}>Back</button>
      </div>

      <h2>Staff Details for {employee.firstName} {employee.surname}</h2>
      <p><strong>Staff ID:</strong> {formattedId}</p>
      <p><strong>First Name:</strong> {employee.firstName}</p>
      <p><strong>Middle Name:</strong> {employee.middleName || 'N/A'}</p>
      <p><strong>Surname:</strong> {employee.surname}</p>
      <p><strong>Salary:</strong> ${employee.salary}</p>

      <div className="section-buttons">
        
        <button className="section-button" onClick={() => navigate(`/employee-management/personal-details/${employee._id}`)}>Personal Details</button>
        <button className="section-button" onClick={() => navigate(`/employee-management/employment/${employee._id}`)}>Employment</button>
        <button className="section-button" onClick={() => navigate(`/employee-management/taxes/${employee._id}`)}>Taxes</button>
        <button className="section-button" onClick={() => navigate(`/employee-management/bank-account/${employee._id}`)}>Bank Account</button>
        <button className="section-button" onClick={() => navigate(`/employee-management/payslip-history/${employee._id}`)}>Payslip History</button>
      </div>
    </div>
  );
};

export default StaffDetails;
