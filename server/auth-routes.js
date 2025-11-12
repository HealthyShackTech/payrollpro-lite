// Authentication routes
const express = require('express');
const router = express.Router();
const auth = require('./auth');

// Middleware to get database from request (set by server.js)
const getDb = (req) => {
  // Try to get from app.locals first
  if (req.app.locals && req.app.locals.db) {
    return req.app.locals.db;
  }
  // Fallback: get from the client directly
  const { MongoClient } = require('mongodb');
  const client = req.app.locals.client;
  if (client) {
    return client.db(process.env.DB_NAME || 'payrollpro');
  }
  return null;
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;
    const db = getDb(req);

    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const user = await auth.registerUser(db, {
      email,
      password,
      firstName,
      lastName,
      companyName,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed',
    });
  }
});

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDb(req);

    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const result = await auth.loginUser(db, email, password);

    res.json({
      success: true,
      message: 'Login successful',
      ...result,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed',
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token and return user info
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const decoded = auth.verifyToken(token);
    const db = getDb(req);

    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const user = await auth.getUserById(db, decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Token verification failed',
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile (requires authentication)
 */
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const decoded = auth.verifyToken(token);
    const db = getDb(req);

    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const user = await auth.getUserById(db, decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Failed to get profile',
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (requires authentication)
 */
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const decoded = auth.verifyToken(token);
    const db = getDb(req);

    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const updatedUser = await auth.updateUserProfile(db, decoded.userId, req.body);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update profile',
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Change user password (requires authentication)
 */
router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const decoded = auth.verifyToken(token);
    const db = getDb(req);

    if (!db) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    const result = await auth.changePassword(db, decoded.userId, currentPassword, newPassword);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to change password',
    });
  }
});

module.exports = router;

