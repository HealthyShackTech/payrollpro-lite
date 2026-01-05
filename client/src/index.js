import React, { useState } from 'react';
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
import AdministrationSettings from './components/AdministrationSettings';
import AdministrationSettingDetail from './components/AdministrationSettingDetail';
import Report from './components/Report';
import PayrollSummary from './components/PayrollSummary';
import PayrunHistory from './components/PayrunHistory';
import PayItems from './components/PayItems';
import SuperPayments from './components/SuperPayments';
import SingleTouchPayroll from './components/SingleTouchPayroll';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import './styles.css';
import PayRun from './payroll/payrun';
import Payslip from './payroll/Payslip';


const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <img
        src="https://sfzqwfxosihfgdhwakgm.supabase.co/storage/v1/object/public/media/0.6888386299658281.svg"
        alt="Company Logo"
        className="logo"
      />
      <h1 className="app-title">Payroll Management System</h1>
      {isAuthenticated ? (
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/payroll">Payroll Processing</Link>
          <Link to="/employee-management">Employee Management</Link>
          <Link to="/report">Reports</Link>
          <Link to="/administration">Administration</Link>
          <div className="user-menu">
            <button
              className="user-menu-button"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {user?.firstName} {user?.lastName}
            </button>
            {menuOpen && (
              <div className="user-menu-dropdown">
                <button
                  className="user-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/account');
                  }}
                >
                  <div className="user-menu-title">My Account</div>
                  <div className="user-menu-desc">
                    Manage your details, billing and account information
                  </div>
                </button>
                <button
                  className="user-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/switch-business');
                  }}
                >
                  <div className="user-menu-title">Switch Business</div>
                </button>
                <button
                  className="user-menu-item danger"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <div className="user-menu-title">Log out</div>
                </button>
              </div>
            )}
          </div>
        </nav>
      ) : null}
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
        path="/administration/settings"
        element={
          <ProtectedRoute>
            <AdministrationSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/administration/settings/:setting"
        element={
          <ProtectedRoute>
            <AdministrationSettingDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/administration/settings/payroll/pay-items"
        element={
          <ProtectedRoute>
            <PayItems />
          </ProtectedRoute>
        }
      />
      <Route
        path="/administration/settings/payroll/superannuation-payments"
        element={
          <ProtectedRoute>
            <SuperPayments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/administration/settings/payroll/single-touch-payroll"
        element={
          <ProtectedRoute>
            <SingleTouchPayroll />
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
        path="/report/payroll-summary"
        element={
          <ProtectedRoute>
            <PayrollSummary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report/payrun-history"
        element={
          <ProtectedRoute>
            <PayrunHistory />
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
