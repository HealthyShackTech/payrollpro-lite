// Required imports
require('dotenv').config({ path: '../.env' }); // 放最前，确保 env 可用
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const axios = require('axios');

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
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process if the connection fails
  }
}
connectToMongoDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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

// Google OAuth configuration (optional)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
} else {
  console.log('Google OAuth not configured. Skipping Google authentication setup.');
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
}

// Simple pages
app.get('/', (_req, res) => {
  res.send('PayrollPro API Server is running. <a href="/health">Health Check</a>');
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
