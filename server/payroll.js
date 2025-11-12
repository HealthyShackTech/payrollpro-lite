// payroll.js

// Required imports
const mongoose = require('mongoose');
const atoTaxCalculator = require('./ato-tax-calculator');
const auditTrail = require('./audit-trail');
require('dotenv').config({ path: './.env' }); // Load environment variables from .env file

// Get the app instance from the parent module
// Use a function to avoid circular dependency issues
let app;
try {
  app = require('./server.js').app;
} catch (error) {
  // If server.js hasn't loaded yet, we'll get app later
  console.warn('Server app not available yet, will be set later');
}

// MongoDB connection setup using Mongoose
const mongoURI = process.env.MONGO_URI; // MongoDB connection string from .env file

// Connecting to MongoDB using Mongoose
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define the Payroll History Schema
const payrollHistorySchema = new mongoose.Schema({
  payrunId: { type: String, required: true },
  orderNumber: { type: String, required: true },
  paymentDate: { type: String, required: true },
  wage: { type: Number, required: true },
  tax: { type: Number, required: true },
  super: { type: Number, required: true },
  netPay: { type: Number, required: true },
  stpFiling: { type: String, required: true }
});

// Create a Model from the Schema
const PayrollHistory = mongoose.model('PayrollHistory', payrollHistorySchema);

const payslipSchema = new mongoose.Schema({
  employeeId: String,
  payrunId: { type: String, required: true },  // 这里修正了 payrunId 的声明
  payslipId: String,
  salary: Number,
  position: String,
  payDate: Date,
  employeeFirstName: String,
  employeeSurname: String,
  earnings: Number,
  taxAmount: Number,
  superannuationAmount: Number,
  hoursWorked: Number,
  salaryRate: Number,
});

const Payslip = mongoose.model('payslips', payslipSchema);

// GET Endpoint: Fetch all payroll history data
// app.get('/api/payroll-history', async (req, res) => {
//   try {
//     const payrollData = await PayrollHistory.find();
//     res.json(payrollData);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching payroll history', error: error.message });
//   }
// });

// GET Endpoint: Fetch a specific payrun by ID
app.get('/api/payrun/:payrunId', async (req, res) => {
  const { payrunId } = req.params;
  try {
    const payrun = await PayrollHistory.findOne({ payrunId });
    if (!payrun) {
      return res.status(404).json({ message: 'Payrun not found' });
    }
    res.json(payrun);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payrun details', error: error.message });
  }
});

app.get('/api/payroll-history', async (req, res) => {
  try {
    // Fetch all PayrollHistory records
    const payrollHistories = await PayrollHistory.find()
    console.log('payrollHistories:',payrollHistories)

    // Prepare an array to hold PayrollHistory with aggregated values
    const payrollDataWithAggregates = await Promise.all(
      payrollHistories.map(async (payrun) => {
        // Find all payslips associated with the current payrunId
        console.log('payrun:',payrun)
        const payslips = await Payslip.find({ payrunId: payrun.payrunId });

        // Aggregate values for earnings, taxAmount, and superannuationAmount
        const aggregatedValues = payslips.reduce(
          (totals, payslip) => {
            totals.earnings += payslip.earnings || 0;
            totals.taxAmount += payslip.taxAmount || 0;
            totals.superannuationAmount += payslip.superannuationAmount || 0;
            return totals;
          },
          { earnings: 0, taxAmount: 0, superannuationAmount: 0 }
        );

        // Return the PayrollHistory record with the aggregated values
        return {
          ...payrun.toObject(),
          totalEarnings: aggregatedValues.earnings,
          totalTax: aggregatedValues.taxAmount,
          totalSuperannuation: aggregatedValues.superannuationAmount
        };
      })
    );

    // Send the response with all payroll data and their aggregated values
    res.json(payrollDataWithAggregates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payroll data', error: error.message });
  }
});


// POST Endpoint: Add new payroll history data
app.post('/api/payroll-history', async (req, res) => {
  const newPayrollEntry = new PayrollHistory(req.body);
  try {
    const savedEntry = await newPayrollEntry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(500).json({ message: 'Error saving payroll entry', error: error.message });
  }
});

// PUT Endpoint: Update payroll entry by payrunId
app.put('/api/payroll-history/:payrunId', async (req, res) => {
  const { payrunId } = req.params;
  const updatedData = req.body;
  try {
    const updatedPayroll = await PayrollHistory.findOneAndUpdate({ payrunId }, updatedData, { new: true });
    if (!updatedPayroll) {
      return res.status(404).json({ message: 'Payroll entry not found' });
    }
    res.json(updatedPayroll);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payroll entry', error: error.message });
  }
});

// DELETE Endpoint: Delete payroll entry by payrunId
app.delete('/api/payroll-history/:payrunId', async (req, res) => {
  const { payrunId } = req.params;

  try {
    const deletedPayrun = await PayrollHistory.findOneAndDelete({ payrunId });

    if (!deletedPayrun) {
      return res.status(404).json({ message: 'Payrun not found' });
    }

    res.status(200).json({ message: 'Payrun deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payrun', error: error.message });
  }
});



app.get('/api/employees/:employeeId/payslips/:payrunId', async (req, res) => {
  const { employeeId, payrunId } = req.params;
  console.log(`Fetching payslip for Employee ID: ${employeeId} and Payrun ID: ${payrunId}`);

  try {
    const payslip = await Payslip.findOne({ employeeId, payrunId });
    if (payslip) {
      return res.json(payslip);
    } else {
      return res.status(404).send('Payslip not found');
    }
  } catch (error) {
    console.error('Error fetching payslip:', error);
    return res.status(500).send('Server error');
  }
});



app.put('/api/employees/:employeeId/payslips/:payrunId', async (req, res) => {
  const { employeeId, payrunId } = req.params;
  const {salary, position, payDate, employeeFirstName, employeeSurname, earnings, taxAmount, superannuationAmount, hoursWorked, salaryRate } = req.body;

  try {
    // Check if a payslip already exists for this employee and payrun
    let existingPayslip = await Payslip.findOne({ employeeId: employeeId, payrunId: payrunId });
    console.log('existingPayslip :', existingPayslip )

    if (existingPayslip) {
      // Update existing payslip
      existingPayslip.salary = salary;
      existingPayslip.position = position;
      existingPayslip.employeeFirstName = employeeFirstName;
      existingPayslip.employeeSurname = employeeSurname;
      existingPayslip.earnings = earnings;
      existingPayslip.taxAmount = taxAmount;
      existingPayslip.superannuationAmount = superannuationAmount;
      existingPayslip.hoursWorked = hoursWorked;
      existingPayslip.salaryRate = salaryRate;

      await existingPayslip.save();
      return res.status(200).json(existingPayslip); // Respond with the updated payslip
    }
  } catch (error) {
    console.error('Error creating or updating payslip:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/employees/:employeeId/payslips/:payrunId', async (req, res) => {
  const { employeeId, payrunId } = req.params;
  const {
    salary,
    position = 'N/A',
    payDate,
    employeeFirstName,
    employeeSurname,
    earnings,
    taxAmount,
    superannuationAmount,
    hoursWorked,
    salaryRate,
  } = req.body;

  try {
    // Check if a payslip already exists for this employee and payrun
    let payslip = await Payslip.findOne({ employeeId, payrunId });

    if (payslip) {
      // If found, update existing payslip
      payslip.salary = salary;
      payslip.position = position;
      payslip.payDate = payDate;
      payslip.employeeFirstName = employeeFirstName;
      payslip.employeeSurname = employeeSurname;
      payslip.earnings = earnings;
      payslip.taxAmount = taxAmount;
      payslip.superannuationAmount = superannuationAmount;
      payslip.hoursWorked = hoursWorked;
      payslip.salaryRate = salaryRate;

      await payslip.save(); // Save updated payslip
      return res.status(200).json({ message: 'Payslip updated successfully', data: payslip });
    } else {
      // If not found, create a new payslip
      payslip = new Payslip({
        employeeId,
        payslipId: new mongoose.Types.ObjectId().toString(),
        payrunId,
        salary,
        position,
        payDate,
        employeeFirstName,
        employeeSurname,
        earnings,
        taxAmount,
        superannuationAmount,
        hoursWorked,
        salaryRate,
      });

      await payslip.save(); // Save new payslip
      return res.status(201).json({ message: 'Payslip created successfully', data: payslip });
    }
  } catch (error) {
    console.error('Error saving or updating payslip:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/payruns/:payrunId/employees', async (req, res) => {
  const { payrunId } = req.params;

  try {
    // 根据 payrunId 查找所有相关的 payslip 记录
    const payslips = await Payslip.find({ payrunId });

    if (!payslips || payslips.length === 0) {
      return res.status(404).json({ error: 'No employees found for this payrun' });
    }

    // 提取员工的相关信息，假设每个 Payslip 都包含了 employeeId
    const employeeData = payslips.map(payslip => ({
      employeeId: payslip.employeeId,
      employeeFirstName: payslip.employeeFirstName,
      employeeSurname: payslip.employeeSurname,
      salary: payslip.salary,
      position: payslip.position,
      earnings: payslip.earnings,
      taxAmount: payslip.taxAmount,
      superannuationAmount: payslip.superannuationAmount,
      hoursWorked: payslip.hoursWorked,
      salaryRate: payslip.salaryRate,
      payDate: payslip.payDate,
    }));

    // 返回员工信息
    res.status(200).json(employeeData);
  } catch (error) {
    console.error('Error fetching employees for payrun:', error);
    res.status(500).json({ error: 'An error occurred while fetching employees for this payrun' });
  }
});


// Route to get pay history by employeeId
app.get('/api/employees/:employeeId/pay-history', async (req, res) => {
  const { employeeId } = req.params;
  console.log('employee:',employeeId)

  try {
    // Fetch the pay history for the given employeeId
    const payHistory = await Payslip.find({ employeeId }).sort({ payDate: -1 }); // Sort by payDate descending
    
    if (!payHistory || payHistory.length === 0) {
      return res.status(404).json({ error: 'No pay history found for this employee' });
    }

    // Return the pay history
    res.status(200).json(payHistory);
  } catch (error) {
    console.error('Error fetching pay history:', error);
    res.status(500).json({ error: 'An error occurred while fetching pay history' });
  }
});

// ATO Tax Calculation Endpoints

// Calculate PAYG withholding for an employee
app.post('/api/calculate-payg', async (req, res) => {
  try {
    const { grossAmount, payFrequency, employeeDetails } = req.body;
    
    if (!grossAmount || !payFrequency) {
      return res.status(400).json({ 
        error: 'Gross amount and pay frequency are required' 
      });
    }

    const taxCalculation = atoTaxCalculator.calculatePAYGWithholding(
      grossAmount, 
      payFrequency, 
      employeeDetails
    );

    res.json({
      success: true,
      calculation: taxCalculation,
      superannuation: atoTaxCalculator.calculateSuperannuationGuarantee(grossAmount)
    });
  } catch (error) {
    console.error('Error calculating PAYG:', error);
    res.status(500).json({ error: 'Error calculating PAYG withholding' });
  }
});

// Validate TFN
app.post('/api/validate-tfn', async (req, res) => {
  try {
    const { tfn } = req.body;
    const isValid = atoTaxCalculator.validateTFN(tfn);
    
    res.json({
      success: true,
      isValid,
      message: isValid ? 'Valid TFN format' : 'Invalid TFN format'
    });
  } catch (error) {
    console.error('Error validating TFN:', error);
    res.status(500).json({ error: 'Error validating TFN' });
  }
});

// Generate payment summary for an employee
app.get('/api/employees/:employeeId/payment-summary/:financialYear', async (req, res) => {
  try {
    const { employeeId, financialYear } = req.params;
    
    // Fetch employee data
    const employeeResponse = await fetch(`http://localhost:5001/api/employees/${employeeId}`);
    if (!employeeResponse.ok) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    const employeeData = await employeeResponse.json();
    
    // Fetch payroll data for the financial year
    const payrollData = await Payslip.find({ 
      employeeId,
      payDate: {
        $gte: new Date(`${financialYear}-07-01`),
        $lt: new Date(`${parseInt(financialYear) + 1}-07-01`)
      }
    });
    
    const paymentSummary = atoTaxCalculator.generatePaymentSummary(employeeData, payrollData);
    
    res.json({
      success: true,
      paymentSummary
    });
  } catch (error) {
    console.error('Error generating payment summary:', error);
    res.status(500).json({ error: 'Error generating payment summary' });
  }
});

// Generate STP data for ATO reporting
app.get('/api/payruns/:payrunId/stp-data', async (req, res) => {
  try {
    const { payrunId } = req.params;
    
    // Fetch payrun data
    const payrun = await PayrollHistory.findOne({ payrunId });
    if (!payrun) {
      return res.status(404).json({ error: 'Payrun not found' });
    }
    
    // Fetch all payslips for this payrun
    const payslips = await Payslip.find({ payrunId });
    
    const stpData = atoTaxCalculator.generateSTPData({
      businessId: 'BUSINESS_ID', // This should come from business settings
      payrunId,
      payDate: payrun.paymentDate,
      employees: payslips.map(payslip => ({
        employeeId: payslip.employeeId,
        taxFileNumber: 'TFN_PLACEHOLDER', // This should be fetched from employee data
        grossAmount: payslip.earnings,
        taxWithheld: payslip.taxAmount,
        superannuation: payslip.superannuationAmount,
        netPay: payslip.earnings - payslip.taxAmount
      }))
    });
    
    res.json({
      success: true,
      stpData
    });
  } catch (error) {
    console.error('Error generating STP data:', error);
    res.status(500).json({ error: 'Error generating STP data' });
  }
});

// Update payslip with ATO-compliant calculations
app.put('/api/employees/:employeeId/payslips/:payrunId/ato-calculate', async (req, res) => {
  try {
    const { employeeId, payrunId } = req.params;
    const { grossAmount, payFrequency, employeeDetails } = req.body;
    
    // Calculate ATO-compliant tax and superannuation
    const taxCalculation = atoTaxCalculator.calculatePAYGWithholding(
      grossAmount, 
      payFrequency || 'weekly', 
      employeeDetails
    );
    
    const superannuationAmount = atoTaxCalculator.calculateSuperannuationGuarantee(grossAmount);
    
    // Update payslip with ATO calculations
    const payslip = await Payslip.findOne({ employeeId, payrunId });
    if (payslip) {
      payslip.earnings = grossAmount;
      payslip.taxAmount = taxCalculation.taxWithheld;
      payslip.superannuationAmount = superannuationAmount;
      payslip.netPay = taxCalculation.netPay;
      
      await payslip.save();
      
      res.json({
        success: true,
        message: 'Payslip updated with ATO-compliant calculations',
        data: payslip,
        calculations: {
          taxCalculation,
          superannuationAmount
        }
      });
    } else {
      res.status(404).json({ error: 'Payslip not found' });
    }
  } catch (error) {
    console.error('Error updating payslip with ATO calculations:', error);
    res.status(500).json({ error: 'Error updating payslip' });
  }
});

// Audit Trail Endpoints

// Get audit trail for an entity
app.get('/api/audit-trail/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { startDate, endDate, action, limit = 100, skip = 0 } = req.query;
    
    const auditEntries = await auditTrail.getAuditTrail(entityType, entityId, {
      startDate,
      endDate,
      action,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
    
    res.json({
      success: true,
      data: auditEntries,
      count: auditEntries.length
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Error fetching audit trail' });
  }
});

// Get compliance report
app.get('/api/compliance-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }
    
    const report = await auditTrail.getComplianceReport(startDate, endDate);
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Error generating compliance report' });
  }
});

// Export audit trail for ATO compliance
app.get('/api/audit-trail/export', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }
    
    const auditData = await auditTrail.exportAuditTrail(startDate, endDate);
    
    res.json({
      success: true,
      data: auditData,
      count: auditData.length,
      exportDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting audit trail:', error);
    res.status(500).json({ error: 'Error exporting audit trail' });
  }
});

// The routes are already defined above using the global app
// No need to export anything as the routes are already registered

