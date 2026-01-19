// Required imports
require('dotenv').config({ path: '../.env' }); // 放最前，确保 env 可用
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const axios = require('axios');
const { authenticateToken } = require('./auth-middleware');

const app = express();

// Export app for use in other modules
module.exports.app = app;
const PORT = process.env.PORT || 5001;



// MongoDB connection setup
const uri = process.env.MONGO_URI; // MongoDB connection string from .env file
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Successfully connected to MongoDB!');
    
    // Make database accessible to routes
    const database = client.db(process.env.DB_NAME || 'payrollpro');
    app.locals.db = database;
    app.locals.client = client;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.warn('⚠️  Server will continue running, but database features will be unavailable.');
    console.warn('⚠️  Please check your MongoDB connection string in .env file.');
    // Don't exit - allow server to run without database
    // process.exit(1); // Exit the process if the connection fails
  }
}
connectToMongoDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Allow both localhost and 127.0.0.1 by default. If CORS_ORIGIN is set, merge it with defaults.
const corsDefaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...corsDefaults, ...envOrigins]));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl) and configured origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_me_in_env',
    resave: false,
    saveUninitialized: true,
    cookie: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:5001/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Routes for Google OAuth
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

// Simple pages
app.get('/', (_req, res) => {
  res.send('Home Page. <a href="/auth/google">Login with Google</a>');
});

app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Hello, ${req.user.displayName}`);
  } else {
    res.redirect('/');
  }
});

// Simple health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Authentication routes (must be before other routes)
const authRoutes = require('./auth-routes');
app.use('/api/auth', authRoutes);

// Collections
// Note: database is now set in app.locals.db in connectToMongoDB()
// For backward compatibility, we'll also set it here
const database = client.db(process.env.DB_NAME || 'payrollpro'); // configurable DB name
const employeesCollection = database.collection('employees');

const getDb = (req) => {
  if (req.app?.locals?.db) {
    return req.app.locals.db;
  }
  return database;
};

// ---- Employees CRUD ----

// Get all employees
app.get('/api/employees', async (_req, res) => {
  try {
    const employees = await employeesCollection.find().toArray();
    res.json(employees);
  } catch (err) {
    console.error('Error retrieving employees:', err);
    res
      .status(500)
      .send({ message: 'Error retrieving employees', error: err?.message });
  }
});

// Get one employee by ID
app.get('/api/employees/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    if (!ObjectId.isValid(employeeId)) {
      return res.status(400).send({ message: 'Invalid employee ID' });
    }
    const employee = await employeesCollection.findOne({
      _id: new ObjectId(employeeId),
    });
    if (!employee) {
      return res.status(404).send({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    console.error('Error retrieving employee:', err);
    res
      .status(500)
      .send({ message: 'Error retrieving employee', error: err?.message });
  }
});

// Create employee
app.post('/api/employees', async (req, res) => {
  try {
    const newEmployee = req.body || {};
    const result = await employeesCollection.insertOne(newEmployee);
    const createdEmployee = await employeesCollection.findOne({
      _id: result.insertedId,
    });
    res.status(201).json(createdEmployee);
  } catch (err) {
    console.error('Error creating employee:', err);
    res
      .status(400)
      .send({ message: 'Error creating employee', error: err?.message });
  }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    if (!ObjectId.isValid(employeeId)) {
      return res.status(400).send({ message: 'Invalid employee ID' });
    }
    
    const { _id, __v, ...updateData } = req.body; // Remove _id and __v from update data
    
    const updated = await employeesCollection.findOneAndUpdate(
      { _id: new ObjectId(employeeId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).send({ message: 'Employee not found' });
    }
  } catch (err) {
    console.error('Error in update employee:', err);
    res
      .status(400)
      .send({ message: 'Error updating employee', error: err?.message });
  }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    if (!ObjectId.isValid(employeeId)) {
      return res.status(400).send({ message: 'Invalid employee ID' });
    }
    const result = await employeesCollection.deleteOne({
      _id: new ObjectId(employeeId),
    });
    if (result.deletedCount) {
      res.status(204).send();
    } else {
      res.status(404).send({ message: 'Employee not found' });
    }
  } catch (err) {
    console.error('Error deleting employee:', err);
    res
      .status(500)
      .send({ message: 'Error deleting employee', error: err?.message });
  }
});

// Update employee TFN
app.put('/api/employees/:id/update-tax', async (req, res) => {
  try {
    const employeeId = req.params.id;
    if (!ObjectId.isValid(employeeId)) {
      return res.status(400).send({ message: 'Invalid employee ID' });
    }
    const { taxFileNumber } = req.body;
    const updated = await employeesCollection.findOneAndUpdate(
      { _id: new ObjectId(employeeId) },
      { $set: { taxFileNumber } },
      { returnDocument: 'after' }
    );
    res.json({
      message: 'Tax File Number updated successfully',
      employee: updated.value,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update bank account
app.put('/api/employees/:id/update-bank-account', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { bankAccount } = req.body;
    if (!ObjectId.isValid(employeeId)) {
      return res.status(400).send({ message: 'Invalid employee ID' });
    }
    const updated = await employeesCollection.findOneAndUpdate(
      { _id: new ObjectId(employeeId) },
      { $set: { bankAccount } },
      { returnDocument: 'after' }
    );
    res.json({
      message: 'Bank account details updated successfully',
      employee: updated.value,
    });
  } catch (error) {
    console.error('Error:', error);
    res
      .status(500)
      .json({ message: 'An error occurred while updating bank account details' });
  }
});

// ---- Business Settings ----

// Get business settings for the authenticated user
app.get('/api/business-settings', authenticateToken, async (req, res) => {
  try {
    const db = getDb(req);
    const userId = req.user?.userId;

    const record = await db.collection('business_settings').findOne({ userId });
    res.json({ success: true, data: record || null });
  } catch (err) {
    console.error('Error fetching business settings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business settings',
      details: err?.message,
    });
  }
});

// Upsert business settings for the authenticated user
app.put('/api/business-settings', authenticateToken, async (req, res) => {
  try {
    const db = getDb(req);
    const userId = req.user?.userId;

    const {
      businessName = '',
      tradingName = '',
      abn = '',
      acn = '',
      businessIndustry = '',
      specificIndustryCode = '',
      address = '',
      website = '',
      email = '',
      phone = '',
      fax = '',
    } = req.body || {};

    const updateDoc = {
      businessName,
      tradingName,
      abn,
      acn,
      businessIndustry,
      specificIndustryCode,
      address,
      website,
      email,
      phone,
      fax,
      updatedAt: new Date(),
    };

    const result = await db.collection('business_settings').findOneAndUpdate(
      { userId },
      { $set: updateDoc, $setOnInsert: { userId, createdAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({
      success: true,
      data: result.value,
      message: 'Business settings saved',
    });
  } catch (err) {
    console.error('Error saving business settings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to save business settings',
      details: err?.message,
    });
  }
});

// Payroll settings (e.g., super rate)
app.get('/api/payroll-settings', authenticateToken, async (req, res) => {
  try {
    const db = getDb(req);
    const userId = req.user?.userId;
    const record = await db.collection('payroll_settings').findOne({ userId });
    res.json({ success: true, data: record || null });
  } catch (err) {
    console.error('Error fetching payroll settings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payroll settings',
      details: err?.message,
    });
  }
});

app.put('/api/payroll-settings', authenticateToken, async (req, res) => {
  try {
    const db = getDb(req);
    const userId = req.user?.userId;
    const { superRate = 0 } = req.body || {};

    const numericRate = Number(superRate);
    if (Number.isNaN(numericRate) || numericRate < 0) {
      return res.status(400).json({ success: false, error: 'Super rate must be a non-negative number' });
    }

    const updateDoc = {
      superRate: numericRate,
      updatedAt: new Date(),
    };

    const result = await db.collection('payroll_settings').findOneAndUpdate(
      { userId },
      { $set: updateDoc, $setOnInsert: { userId, createdAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({
      success: true,
      data: result.value,
      message: 'Payroll settings saved',
    });
  } catch (err) {
    console.error('Error saving payroll settings:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to save payroll settings',
      details: err?.message,
    });
  }
});

// ---- STP Settings & Data ----
app.get('/api/stp/settings', authenticateToken, async (req, res) => {
  try {
    const db = getDb(req);
    const userId = req.user?.userId;
    const record = await db.collection('stp_settings').findOne({ userId });
    res.json({ success: true, data: record || null });
  } catch (err) {
    console.error('Error fetching STP settings:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch STP settings', details: err?.message });
  }
});

app.put('/api/stp/settings', authenticateToken, async (req, res) => {
  try {
    const db = getDb(req);
    const userId = req.user?.userId;
    const payload = req.body || {};

    const result = await db.collection('stp_settings').findOneAndUpdate(
      { userId },
      { $set: { ...payload, updatedAt: new Date() }, $setOnInsert: { userId, createdAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ success: true, data: result.value, message: 'STP settings saved' });
  } catch (err) {
    console.error('Error saving STP settings:', err);
    res.status(500).json({ success: false, error: 'Failed to save STP settings', details: err?.message });
  }
});

app.get('/api/stp/reports', authenticateToken, async (req, res) => {
  try {
    const db = getDb(req);
    const payrollYear = req.query.year || '';
    const payruns = await db.collection('payrollhistories').find().toArray();
    const payslips = await db.collection('payslips').find().toArray();

    const slipsByPayrun = payslips.reduce((acc, slip) => {
      const payrunId = slip.payrunId;
      if (!payrunId) return acc;
      if (!acc[payrunId]) {
        acc[payrunId] = { employees: new Set(), gross: 0, payg: 0 };
      }
      acc[payrunId].employees.add(String(slip.employeeId || ''));
      acc[payrunId].gross += slip.earnings || slip.salary || 0;
      acc[payrunId].payg += slip.taxAmount || 0;
      return acc;
    }, {});

    const rows = payruns.map((payrun) => {
      const bucket = slipsByPayrun[payrun.payrunId] || { employees: new Set(), gross: payrun.wage || 0, payg: payrun.tax || 0 };
      return {
        payrunId: payrun.payrunId,
        payrollYear,
        payPeriod: payrun.orderNumber || payrun.payrunId || 'N/A',
        paymentDate: payrun.paymentDate || '',
        recordedAt: payrun.updatedAt || payrun.createdAt || '',
        employees: Array.isArray(bucket.employees) ? bucket.employees.length : bucket.employees.size,
        grossPayments: Number((bucket.gross || 0).toFixed(2)),
        paygWithholding: Number((bucket.payg || 0).toFixed(2)),
        status: payrun.stpFiling || 'Pending',
      };
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching STP reports:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch STP reports', details: err?.message });
  }
});

app.get('/api/stp/terminations', authenticateToken, async (req, res) => {
  try {
    const db = getDb(req);
    const userId = req.user?.userId;
    const payrollYear = req.query.year || '';
    const filter = { userId };
    if (payrollYear) {
      filter.payrollYear = payrollYear;
    }
    const rows = await db.collection('stp_terminations').find(filter).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching STP terminations:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch STP terminations', details: err?.message });
  }
});

app.post('/api/stp/terminations', authenticateToken, async (req, res) => {
  try {
    const db = getDb(req);
    const userId = req.user?.userId;
    const doc = {
      userId,
      payrollYear: req.body?.payrollYear || '',
      firstName: req.body?.firstName || '',
      lastName: req.body?.lastName || '',
      etp: req.body?.etp || '',
      terminationDate: req.body?.terminationDate || '',
      reason: req.body?.reason || '',
      createdAt: new Date(),
    };
    const result = await db.collection('stp_terminations').insertOne(doc);
    const created = await db.collection('stp_terminations').findOne({ _id: result.insertedId });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('Error saving STP termination:', err);
    res.status(500).json({ success: false, error: 'Failed to save termination', details: err?.message });
  }
});

app.get('/api/stp/eofy', authenticateToken, async (req, res) => {
  try {
    const db = getDb(req);
    const payrollYear = req.query.year || '';
    const employees = await db.collection('employees').find().toArray();
    const payslips = await db.collection('payslips').find().toArray();

    const totals = { gross: 0, payg: 0 };
    const byEmployee = payslips.reduce((acc, slip) => {
      const empId = String(slip.employeeId || '');
      if (!acc[empId]) {
        acc[empId] = { gross: 0, payg: 0 };
      }
      acc[empId].gross += slip.earnings || slip.salary || 0;
      acc[empId].payg += slip.taxAmount || 0;
      totals.gross += slip.earnings || slip.salary || 0;
      totals.payg += slip.taxAmount || 0;
      return acc;
    }, {});

    const rows = employees.map((emp) => {
      const empId = String(emp._id);
      const bucket = byEmployee[empId] || { gross: 0, payg: 0 };
      return {
        employeeId: empId,
        payrollYear,
        firstName: emp.firstName || emp.first_name || '',
        lastName: emp.surname || emp.lastName || emp.last_name || '',
        endDate: emp.endDate || emp.terminationDate || '',
        grossYtd: Number((bucket.gross || 0).toFixed(2)),
        paygYtd: Number((bucket.payg || 0).toFixed(2)),
        finalIndicator: emp.finalIndicator || false,
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          employees: employees.length,
          grossYtd: Number((totals.gross || 0).toFixed(2)),
          paygYtd: Number((totals.payg || 0).toFixed(2)),
        },
        rows,
      },
    });
  } catch (err) {
    console.error('Error fetching EOFY data:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch EOFY data', details: err?.message });
  }
});

// Verify BSB
app.post('/api/verify-bsb', async (req, res) => {
  try {
    const { bsbcode, bsb } = req.body;
    const code = bsbcode || bsb;
    
    if (!code) {
      return res.status(400).json({ 
        success: false,
        message: 'BSB code is required' 
      });
    }

    // Validate BSB format (should be XXX-XXX or XXXXXX)
    const cleanCode = code.replace(/[^0-9]/g, '');
    if (cleanCode.length !== 6) {
      return res.status(400).json({ 
        success: false,
        message: 'BSB code must be 6 digits' 
      });
    }

    // Format as XXX-XXX if not already formatted
    const formattedCode = cleanCode.includes('-') ? code : `${cleanCode.slice(0, 3)}-${cleanCode.slice(3)}`;

    // Check if API key is configured
    if (!process.env.BSB_API_KEY) {
      console.error('BSB_API_KEY is not configured in environment variables');
      return res.status(500).json({ 
        success: false,
        message: 'BSB API key not configured. Please contact administrator.' 
      });
    }

    // Use the new BSBQuery-V2 API endpoint
    const response = await axios.post(
      'https://auspaynet-bicbsb-api-prod.azure-api.net/bsbquery-v2/manual/paths/invoke',
      { bsbcode: formattedCode },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.BSB_API_KEY,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        timeout: 10000,
      }
    );

    // Handle new API response format: { status, message, timestamp, requestId, data }
    if (response.data && response.data.status === 'success') {
      // Return the response in our standard format
      res.json({
        success: true,
        data: response.data.data || [],
        metadata: {
          message: response.data.message,
          timestamp: response.data.timestamp,
          requestId: response.data.requestId
        }
      });
    } else {
      // Handle error response from new API
      res.status(400).json({
        success: false,
        message: response.data?.message || 'BSB verification failed'
      });
    }
  } catch (err) {
    console.error('BSB verify error:', err?.response?.data || err?.message);
    
    // Provide more detailed error messages
    let errorMessage = 'BSB verification failed';
    let statusCode = 502;

    if (err.response) {
      // API responded with error
      if (err.response.status === 401 || err.response.status === 403) {
        errorMessage = 'BSB API authentication failed';
        statusCode = 401;
      } else if (err.response.status === 404) {
        errorMessage = 'BSB code not found';
        statusCode = 404;
      } else {
        errorMessage = err.response.data?.message || `BSB API returned error: ${err.response.status}`;
        statusCode = err.response.status;
      }
    } else if (err.request) {
      // Request made but no response
      errorMessage = 'BSB service unavailable. Unable to connect to BSB API. Please check your internet connection and API endpoint.';
      statusCode = 503;
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      // Network/DNS errors
      errorMessage = 'Cannot reach BSB API server. Please check your network connection.';
      statusCode = 503;
    } else {
      // Error setting up request
      errorMessage = err.message || 'Error setting up BSB verification request';
      statusCode = 500;
    }

    res.status(statusCode).json({ 
      success: false,
      message: errorMessage 
    });
  }
});

// Import payroll routes (after app is fully initialized)
// This ensures app is available when payroll.js requires it
require('./payroll.js');

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});
