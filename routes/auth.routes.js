/**
 * Authentication Routes
 * Handles user registration, login, logout, and token verification
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { 
  generateToken, 
  addToken, 
  removeToken, 
  authenticateToken 
} = require('../middleware/auth.middleware');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, phone, address } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }
    
    // Create user
    const newUser = await db.createUser({
      username,
      email,
      password,
      fullName: fullName || username,
      phone: phone || '',
      address: address || '',
      role: 'user' // Default role
    });
    
    // Generate token
    const token = generateToken(newUser);
    addToken(token);
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: newUser
    });
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login with username/email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }
    
    // Find user by username or email
    let user = await db.getUserByUsername(username);
    if (!user) {
      user = await db.getUserByEmail(username); // Try email
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Account is inactive. Please contact administrator.' 
      });
    }
    
    // Validate password
    const isValidPassword = await db.validatePassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    // Generate token
    const token = generateToken(userWithoutPassword);
    addToken(token);
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate token
 */
router.post('/logout', authenticateToken, (req, res) => {
  try {
    removeToken(req.token);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * GET /api/auth/verify
 * Verify if token is still valid
 */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authenticateToken, (req, res) => {
  res.json(req.user);
});

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, phone, address, password } = req.body;
    
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (password) {
      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters' 
        });
      }
      updates.password = password;
    }
    
    const updatedUser = await db.updateUser(req.user.id, updates);
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router;
