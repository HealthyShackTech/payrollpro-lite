import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import App from './App';
import StaffDetails from './components/StaffDetails';
import PersonalDetails from './components/PersonalDetails';
import Employment from './components/EmploymentDetail';
import Taxes from './components/Taxes';
import BankAccount from './components/BankAccount';
import PayslipHistory from './components/PayslipHistory';
import Homepage from './components/Homepage';
import PayrollProcessing from './payroll/PayrollProcessing';
import Administration from './components/Administration';
import Report from './components/Report';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import './styles.css';
import PayRun from './payroll/payrun';
import Payslip from './payroll/Payslip';


const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <img src="https://i0.wp.com/healthyshack.tech/wp-content/uploads/2022/02/cropped-people-leaf-logohealthy-logo-5.png?fit=244%2C107&ssl=1" alt="Business Logo" className="logo" />
      <h1 className="app-title">Payroll Management System</h1>
      {isAuthenticated ? (
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/payroll">Payroll Processing</Link>
          <Link to="/employee-management">Employee Management</Link>
          <Link to="/report">Reports</Link>
          <Link to="/administration">Administration</Link>
          <div className="user-menu">
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </nav>
      ) : (
        <nav className="nav">
          <Link to="/login">Login</Link>
          <Link to="/register">Sign Up</Link>
        </nav>
      )}
    </header>
  );
};

const AppWithHeader = () => {
  return (
    <>
      <Header />
      <AppRoutes />
    </>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Homepage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/administration"
        element={
          <ProtectedRoute>
            <Administration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute>
            <PayrollProcessing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll/payrun/:payrunId"
        element={
          <ProtectedRoute>
            <PayRun />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll/payrun/:payrunId/:employeeId"
        element={
          <ProtectedRoute>
            <Payslip />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-management/*"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-management/:id"
        element={
          <ProtectedRoute>
            <StaffDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-management/personal-details/:id"
        element={
          <ProtectedRoute>
            <PersonalDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-management/taxes/:id"
        element={
          <ProtectedRoute>
            <Taxes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-management/bank-account/:id"
        element={
          <ProtectedRoute>
            <BankAccount />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-management/employment/:id"
        element={
          <ProtectedRoute>
            <Employment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee-management/payslip-history/:id"
        element={
          <ProtectedRoute>
            <PayslipHistory />
          </ProtectedRoute>
        }
      />
      
      {/* Redirect root to login if not authenticated, or home if authenticated */}
      <Route path="*" element={<Homepage />} />
    </Routes>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <AuthProvider>
      <AppWithHeader />
    </AuthProvider>
  </Router>
);
