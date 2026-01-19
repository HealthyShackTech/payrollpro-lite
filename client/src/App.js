import React, { useEffect, useState } from 'react';
import api from './utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import './App.css';

const App = () => {
  const [employees, setEmployees] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [salary, setSalary] = useState('');
  const navigate = useNavigate();

  // Fetching employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/api/employees');
        setEmployees(response.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    fetchEmployees();
  }, []);          

  // Add new employee
  const addEmployee = async (e) => {
    e.preventDefault();
    try {
      const newEmployee = { 
        firstName, 
        middleName, 
        surname, 
        salary
      };
      const response = await api.post('/api/employees', newEmployee);
      setEmployees([...employees, response.data]);
      resetForm();
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setSurname('');
    setSalary('');
  };

  // Delete employee
  const deleteEmployee = async (id) => {
    console.log('Attempting to delete employee with ID:', id);
    if (!id) {
      console.error('Error: Employee ID is undefined');
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this employee?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/api/employees/${id}`);
      setEmployees(employees.filter((emp) => emp._id !== id));
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  return (
    <div className="app-container">
      <div className="content-container">
        <h2>Employee List</h2>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>First Name</th>
              <th>Middle Name</th>
              <th>Surname</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, index) => (
              <tr 
                key={emp._id}
                onClick={() => navigate(`/employee-management/${emp._id}`)}
              >
                <td>{index + 1}</td>
                <td>{emp.firstName || 'Unnamed'}</td>
                <td>{emp.middleName || 'N/A'}</td>
                <td>{emp.surname || 'Unnamed'}</td>
                <td>${emp.salary || '0'}</td>
                <td>
                  <button 
                    className="delete-button" 
                    onClick={(e) => {  
                      e.stopPropagation(); 
                      deleteEmployee(emp._id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form className="employee-form" onSubmit={addEmployee}>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            required
          />
          <input
            type="text"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            placeholder="Middle Name"
          />
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="Surname"
            required
          />
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="Salary"
            required
          />
          <button type="submit" className="add-button">Add Employee</button>
        </form>
      </div>
    </div>
  );
};

export default App;
