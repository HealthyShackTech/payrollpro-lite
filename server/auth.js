// Authentication module for user registration and login
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

// JWT secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Get database and collection
const getUsersCollection = (db) => db.collection('users');

/**
 * Register a new user
 */
async function registerUser(db, userData) {
  const { email, password, firstName, lastName, companyName } = userData;

  // Validate required fields
  if (!email || !password || !firstName || !lastName) {
    throw new Error('Missing required fields: email, password, firstName, lastName');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength (minimum 6 characters)
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const usersCollection = getUsersCollection(db);

  // Check if user already exists
  const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user document
  const newUser = {
    email: email.toLowerCase(),
    password: hashedPassword,
    firstName,
    lastName,
    companyName: companyName || '',
    role: 'admin', // Default role for registered users
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
  };

  // Insert user
  const result = await usersCollection.insertOne(newUser);
  
  // Return user without password
  const user = await usersCollection.findOne({ _id: result.insertedId });
  delete user.password;

  return user;
}

/**
 * Authenticate user and generate JWT token
 */
async function loginUser(db, email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const usersCollection = getUsersCollection(db);

  // Find user by email
  const user = await usersCollection.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error('Account is deactivated. Please contact support.');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await usersCollection.updateOne(
    { _id: user._id },
    { $set: { lastLogin: new Date(), updatedAt: new Date() } }
  );

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Return user without password
  const userResponse = { ...user };
  delete userResponse.password;

  return {
    user: userResponse,
    token,
  };
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user by ID
 */
async function getUserById(db, userId) {
  const usersCollection = getUsersCollection(db);
  
  if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (user) {
    delete user.password;
  }
  return user;
}

/**
 * Update user profile
 */
async function updateUserProfile(db, userId, updateData) {
  const usersCollection = getUsersCollection(db);

  if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  // Remove sensitive fields from update
  const { password, email, role, ...safeUpdateData } = updateData;

  const updatedUser = await usersCollection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    {
      $set: {
        ...safeUpdateData,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  if (updatedUser.value) {
    delete updatedUser.value.password;
    return updatedUser.value;
  }

  throw new Error('User not found');
}

/**
 * Change user password
 */
async function changePassword(db, userId, currentPassword, newPassword) {
  const usersCollection = getUsersCollection(db);

  if (!ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  // Validate new password
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }

  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    }
  );

  return { message: 'Password changed successfully' };
}

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  getUserById,
  updateUserProfile,
  changePassword,
  JWT_SECRET,
};

