import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Payslip.css';

const Payslip = () => {
  const { payrunId, employeeId } = useParams();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState('');
  const moment = require('moment-timezone');

  const SUPERANNUATION_RATE = 11.5; // ATO compliant rate from July 2024

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/employees/${employeeId}`);
        if (!response.data) {
          throw new Error('Employee not found');
        }
        setEmployee({
          ...response.data,
          hours: response.data.hours || 0,
        });
      } catch (error) {
        console.error('Error fetching employee details:', error);
        setError('Employee not found');
      }
    };
    const fetchPayslip = async () => {
  try {
    const encodedEmployeeId = encodeURIComponent(employeeId);
    const encodedPayrunId = encodeURIComponent(payrunId);
    const url = `http://localhost:5001/api/employees/${encodedEmployeeId}/payslips/${encodedPayrunId}`;
    console.log('Fetching payslip from URL:', url);

    const response = await axios.get(url);
    setPayslip(response.data);
  } catch (error) {
    console.error('Error fetching payslip details:', error);
    setError('Payslip not found');
  }
};

    

    fetchEmployee();
    fetchPayslip();
  }, [employeeId, payrunId]);

  const calculateTotalEarnings = (rate, hours) => rate * hours;
  const calculateTaxAmount = (earnings, taxRate) => (earnings * taxRate) / 100;
  const calculateSuperannuation = (earnings) => (earnings * SUPERANNUATION_RATE) / 100;

  // ATO-compliant tax calculation
  // eslint-disable-next-line no-unused-vars
  const calculateATOTax = async (grossAmount, payFrequency = 'weekly', employeeDetails = {}) => {
    try {
      const response = await axios.post('http://localhost:5001/api/calculate-payg', {
        grossAmount,
        payFrequency,
        employeeDetails
      });
      return response.data.calculation;
    } catch (error) {
      console.error('Error calculating ATO tax:', error);
      return {
        taxWithheld: 0,
        medicareLevy: 0,
        netPay: grossAmount,
        breakdown: {
          grossAmount,
          taxWithheld: 0,
          medicareLevy: 0,
          netPay: grossAmount
        }
      };
    }
  };

  const handleHoursChange = (e) => {
    const updatedHours = e.target.value ? parseInt(e.target.value, 10) : 0;
    setPayslip((prevDetails) => ({
      ...prevDetails,
      hoursWorked: updatedHours,
    }));
  };

  const totalEarnings = employee ? calculateTotalEarnings(employee?.salary, payslip?.hoursWorked || 0 ) : 0;
  const taxAmount = employee?.tax ? calculateTaxAmount(totalEarnings, employee.tax.rate) : 0;
  const superannuationAmount = calculateSuperannuation(totalEarnings);

  const handleSavePayslip = async () => {
    let payslipData; // Declare payslipData here, outside of the try block
      // 计算总收入、税额和养老金
      // const totalEarnings = calculateTotalEarnings(employee.salary, employee.hours);
      // const taxAmount = employee?.tax ? calculateTaxAmount(totalEarnings, employee.tax.rate) : 0;
      // const superannuationAmount = calculateSuperannuation(totalEarnings);
  
      // 定义 payslipData
      payslipData = {
        payrunId,
        employeeId,
        salary: employee.salary,
        position: employee.position || 'N/A',
        payDate: moment(moment().tz('Australia/Hobart').format('DD/MM/YYYY'), 'DD/MM/YYYY').toDate(),
        employeeFirstName: employee.firstName,
        employeeSurname: employee.surname,
        earnings: totalEarnings,
        taxAmount: 0,
        superannuationAmount,
        hoursWorked: payslip?.hoursWorked || 0,
        salaryRate: employee.salaryRate,
      };
  
      try{
        await axios.post(
          `http://localhost:5001/api/employees/${employeeId}/payslips/${payrunId}`,
          payslipData
        );
        // setPayslip(updatedPayslipResponse.data); // 更新状态
        navigate(0);
      }
     catch (error) {
      // 如果工资单不存在，创建新的工资单
      // if (error.response && error.response.status === 404) {
      //   const createdPayslipResponse = await axios.post(
      //     `http://localhost:5002/api/employees/${employeeId}/payslips`,
      //     payslipData
      //   );
      //   setPayslip(createdPayslipResponse.data); // 更新状态
      //   console.log('工资单创建成功:', createdPayslipResponse.data);
      // } else {
      //   console.error('保存工资单时发生错误:', error);
      // }
      console.error('保存工资单时发生错误:', error);
    }
  };
  

  return (
    <div className="payslip-container">
      <button onClick={() => navigate('/payroll/payrun')} className="back-button">
        &larr; Back to Payroll
      </button>
      <h2 className="payslip-title">Employee Payslip</h2>
      {error && <p className="error-message">{error}</p>}

      <table className="payslip-table">
        <thead>
          <tr>
            <th>Payslip ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Employee ID</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{payslip?.payslipId || 'N/A'}</td>
            <td>{employee?.firstName || 'N/A'}</td>
            <td>{employee?.surname || 'N/A'}</td>
            <td>{employeeId}</td>
          </tr>
        </tbody>
      </table>

      <h3 className="earnings-title">Earnings Information</h3>
      <table className="earnings-table">
        <thead>
          <tr>
            <th>Rate</th>
            <th>Hours Worked</th>
            <th>Total Earnings</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${employee?.salary || 'N/A'}</td>
            <td>
              <input
                type="number"
                value={payslip?.hoursWorked || 0}
                onChange={handleHoursChange}
                min="0"
                className="hours-input"
              />
            </td>
            <td>${totalEarnings.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <h3 className="tax-title">Tax Information</h3>
      <table className="tax-table">
        <thead>
          <tr>
            <th>Tax ID</th>
            <th>Tax Rate (%)</th>
            <th>Tax Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{employee?.tax?.taxId || 'N/A'}</td>
            <td>{employee?.tax?.rate || 'N/A'}%</td>
            <td>${taxAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <h3 className="superannuation-title">Superannuation Information</h3>
      <table className="superannuation-table">
        <thead>
          <tr>
            <th>Superannuation Fund</th>
            <th>Contribution Rate (%)</th>
            <th>Contribution Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{employee?.superannuation?.fund || 'N/A'}</td>
            <td>{SUPERANNUATION_RATE}%</td>
            <td>${superannuationAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {payslip && (
        <div className="payslip-info">
          <h3>Payslip Information</h3>
          <p><strong>Payslip ID:</strong> {payslip.payslipId}</p>
          <p><strong>Salary:</strong> ${payslip.salary}</p>
          <p><strong>Pay Date:</strong> {payslip.payDate}</p>
        </div>
      )}

      <button onClick={handleSavePayslip} className="save-button">
        Save Payslip
      </button>
    </div>
  );
};

export default Payslip;
