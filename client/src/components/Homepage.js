import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Homepage.css';

const Homepage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <h2>Welcome to the Payroll Management System</h2>
      {user && (
        <p className="welcome-message">
          Welcome back, {user.firstName} {user.lastName}!
          {user.companyName && ` (${user.companyName})`}
        </p>
      )}
      <p>
        Streamline your payroll process with ease. Manage employee data, process payroll, and generate reports with our intuitive interface.
      </p>
      <div className="homepage-buttons">
        <h3>Get Started:</h3>
        <div className="button-container">
          <button 
            onClick={() => navigate('/payroll')} 
            className="button"
          >
            Payroll Processing
          </button>
          <button 
            onClick={() => navigate('/employee-management')} 
            className="button"
          >
            Employee Management
          </button>
          <button 
            onClick={() => navigate('/administration')} 
            className="button"
          >
            Administration
          </button>
          <button 
            onClick={() => navigate('/report')} 
            className="button"
          >
            Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
