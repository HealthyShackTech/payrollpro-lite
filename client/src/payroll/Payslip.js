import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../utils/axiosConfig';
import './Payslip.css';

const EARNING_TYPES = [
  { key: 'normal', label: 'Normal', rateField: 'normalRate', usesHours: true },
  { key: 'saturday', label: 'Saturday', rateField: 'saturdayRate', usesHours: true },
  { key: 'sunday', label: 'Sunday', rateField: 'sundayRate', usesHours: true },
  { key: 'directorFee', label: 'Direct Fee', rateField: 'directorFee', usesHours: true },
  { key: 'custom', label: 'Custom', rateField: 'customRate', usesHours: true },
  { key: 'allowance', label: 'Allowance', rateField: null, usesHours: false }
];

const Payslip = () => {
  const { payrunId, employeeId } = useParams();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [superRate, setSuperRate] = useState(null);
  const [earningLines, setEarningLines] = useState([]);
  const [selectedLineType, setSelectedLineType] = useState('');
  const [hasInitializedLines, setHasInitializedLines] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employeeLoaded, setEmployeeLoaded] = useState(false);
  const [payslipLoaded, setPayslipLoaded] = useState(false);
  const [error, setError] = useState('');
  const moment = require('moment-timezone');

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/api/employees/${employeeId}`);
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
      } finally {
        setEmployeeLoaded(true);
      }
    };
    const fetchPayslip = async () => {
      try {
        const encodedEmployeeId = encodeURIComponent(employeeId);
        const encodedPayrunId = encodeURIComponent(payrunId);
        const url = `/api/employees/${encodedEmployeeId}/payslips/${encodedPayrunId}`;
        console.log('Fetching payslip from URL:', url);

        const response = await api.get(url);
        setPayslip(response.data);
      } catch (error) {
        console.error('Error fetching payslip details:', error);
        setError((prev) => prev || 'Payslip not found');
      } finally {
        setPayslipLoaded(true);
      }
    };

    const fetchPayrollSettings = async () => {
      try {
        const response = await api.get('/api/payroll-settings');
        if (response.data?.data && response.data.data.superRate !== undefined) {
          setSuperRate(response.data.data.superRate);
        }
      } catch (error) {
        console.error('Error fetching payroll settings:', error);
      }
    };

    

    const loadData = async () => {
      setLoading(true);
      setError('');
      setEmployeeLoaded(false);
      setPayslipLoaded(false);
      await Promise.all([fetchEmployee(), fetchPayslip(), fetchPayrollSettings()]);
      setLoading(false);
    };

    loadData();
  }, [employeeId, payrunId]);

  const calculateTaxAmount = (earnings, taxRate) => (earnings * taxRate) / 100;
  const effectiveSuperRate = Number.isFinite(Number(superRate)) ? Number(superRate) : 0;
  const calculateSuperannuation = (earnings) => (earnings * effectiveSuperRate) / 100;

  useEffect(() => {
    setHasInitializedLines(false);
  }, [employeeId, payrunId]);

  useEffect(() => {
    if (!employeeLoaded || !payslipLoaded || !employee || hasInitializedLines) {
      return;
    }

    const normalizeLines = (lines) => {
      return lines
        .filter((line) => EARNING_TYPES.some((type) => type.key === line.type))
        .map((line) => ({
          type: line.type,
          rate: Number(line.rate) || 0,
          hours: Number(line.hours) || 0
        }));
    };

    const buildDefaultLines = () => {
      const defaults = [];
      const savedEarnings = Number(payslip?.earnings) || 0;
      const savedHours = Number(payslip?.hoursWorked) || 0;
      let normalRate = Number(
        employee?.normalRate ??
        employee?.salaryRate ??
        employee?.salary ??
        0
      ) || 0;
      let normalHours = savedHours;

      if (savedEarnings > 0) {
        if (savedHours > 0) {
          normalRate = savedEarnings / savedHours;
        } else {
          normalRate = savedEarnings;
          normalHours = 1;
        }
      }

      defaults.push({
        type: 'normal',
        rate: normalRate,
        hours: normalHours
      });

      EARNING_TYPES.forEach((type) => {
        if (type.key === 'normal') {
          return;
        }
        if (!type.rateField) {
          return;
        }
        const rateValue = Number(employee?.[type.rateField]) || 0;
        if (rateValue > 0) {
          defaults.push({ type: type.key, rate: rateValue, hours: 0 });
        }
      });

      return defaults;
    };

    if (payslip?.earningLines?.length) {
      setEarningLines(normalizeLines(payslip.earningLines));
    } else {
      setEarningLines(buildDefaultLines());
    }
    setHasInitializedLines(true);
  }, [employee, payslip, hasInitializedLines]);

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

  const getEarningType = (typeKey) => EARNING_TYPES.find((type) => type.key === typeKey);

  const calculateLineTotal = (line) => {
    const type = getEarningType(line.type);
    const rate = Number(line.rate) || 0;
    if (!type || !type.usesHours) {
      return rate;
    }
    const hours = Number(line.hours) || 0;
    return rate * hours;
  };

  const totalEarnings = earningLines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  const totalHoursWorked = earningLines.reduce((sum, line) => {
    const type = getEarningType(line.type);
    if (!type || !type.usesHours) {
      return sum;
    }
    return sum + (Number(line.hours) || 0);
  }, 0);
  const taxAmount = employee?.tax ? calculateTaxAmount(totalEarnings, employee.tax.rate) : 0;
  const superannuationAmount = calculateSuperannuation(totalEarnings);

  const handleLineValueChange = (index, field, value) => {
    setEarningLines((prevLines) =>
      prevLines.map((line, lineIndex) => {
        if (lineIndex !== index) {
          return line;
        }
        return {
          ...line,
          [field]: value
        };
      })
    );
  };

  const handleAddLine = () => {
    if (!selectedLineType) {
      return;
    }
    const typeConfig = getEarningType(selectedLineType);
    const defaultRate = typeConfig?.rateField ? Number(employee?.[typeConfig.rateField]) || 0 : 0;
    setEarningLines((prevLines) => [
      ...prevLines,
      { type: selectedLineType, rate: defaultRate, hours: 0 }
    ]);
    setSelectedLineType('');
  };

  const handleRemoveLine = (index) => {
    setEarningLines((prevLines) => prevLines.filter((_, lineIndex) => lineIndex !== index));
  };

  const availableLineTypes = EARNING_TYPES.filter(
    (type) => !earningLines.some((line) => line.type === type.key)
  );

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
        taxAmount,
        superannuationAmount,
        hoursWorked: totalHoursWorked,
        salaryRate: employee.salaryRate,
        earningLines: earningLines.map((line) => ({
          type: line.type,
          rate: Number(line.rate) || 0,
          hours: Number(line.hours) || 0
        }))
      };
  
      try{
        const response = await api.post(`/api/employees/${employeeId}/payslips/${payrunId}`, payslipData);
        if (response.data?.data) {
          setPayslip(response.data.data);
        } else if (response.data) {
          setPayslip(response.data);
        }
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
  

  if (loading) {
    return (
      <div className="payslip-container">
        <p>Loading payslip...</p>
      </div>
    );
  }

  return (
    <div className="payslip-container">
      <button onClick={() => navigate(`/payroll/payrun/${payrunId}`)} className="back-button">
        &larr; Back to Pay Run
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
      <div className="earnings-controls">
        <select
          value={selectedLineType}
          onChange={(e) => setSelectedLineType(e.target.value)}
          className="earnings-select"
        >
          <option value="">Add earnings row…</option>
          {availableLineTypes.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAddLine}
          className="btn-add-row"
          disabled={!selectedLineType}
        >
          Add Row
        </button>
      </div>
      <table className="earnings-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Rate / Amount</th>
            <th>Hours Worked</th>
            <th>Total Earnings</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {earningLines.length === 0 ? (
            <tr>
              <td colSpan="5">No earnings rows yet. Add one above.</td>
            </tr>
          ) : (
            earningLines.map((line, index) => {
              const type = getEarningType(line.type);
              const lineTotal = calculateLineTotal(line);
              return (
                <tr key={`${line.type}-${index}`}>
                  <td>{type?.label || 'Unknown'}</td>
                  <td>
                    <input
                      type="number"
                      value={line.rate}
                      onChange={(e) => handleLineValueChange(index, 'rate', e.target.value)}
                      min="0"
                      step="0.01"
                      className="rate-input"
                    />
                  </td>
                  <td>
                    {type?.usesHours ? (
                      <input
                        type="number"
                        value={line.hours}
                        onChange={(e) => handleLineValueChange(index, 'hours', e.target.value)}
                        min="0"
                        className="hours-input"
                      />
                    ) : (
                      <input
                        type="number"
                        value={0}
                        className="hours-input"
                        disabled
                      />
                    )}
                  </td>
                  <td>${lineTotal.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(index)}
                      className="btn-remove-row"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })
          )}
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
            <td>
              {Number.isFinite(Number(superRate)) ? `${superRate}%` : 'N/A'}
            </td>
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
