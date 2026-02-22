/**
 * Authentication Middleware
 * Verifies JWT tokens and checks user status
 */

const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET_KEY = 'your-secret-key-for-jwt';

// Store for valid tokens (in-memory for simplicity)
const validTokens = new Set();

/**
 * Generate JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };
  
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Add token to valid tokens set
 */
function addToken(token) {
  validTokens.add(token);
}

/**
 * Remove token from valid tokens set (logout)
 */
function removeToken(token) {
  validTokens.delete(token);
}

/**
 * Clear all tokens (for reset)
 */
function clearAllTokens() {
  validTokens.clear();
}

/**
 * Check if token is valid
 */
function isTokenValid(token) {
  return validTokens.has(token);
}

/**
 * Middleware: Authenticate Token
 * Verifies token and attaches user info to request
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Validate token signature and expiry via JWT `exp` claim
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Check if token has been invalidated server-side (e.g. after logout)
  if (!isTokenValid(token)) {
    return res.status(403).json({ error: 'Token has been invalidated. Please log in again.' });
  }

  // Get full user data from database
  try {
    const user = await db.getUserById(decoded.id);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'User account is inactive' });
    }
    
    // Attach user to request (without password)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Middleware: Require Librarian Role
 * Must be used after authenticateToken
 */
function requireLibrarian(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'librarian') {
    return res.status(403).json({ error: 'Librarian access required' });
  }
  
  next();
}

/**
 * Middleware: Require Active User
 * Must be used after authenticateToken
 */
function requireActive(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.isActive) {
    return res.status(403).json({ error: 'Account is not active' });
  }
  
  next();
}

/**
 * Middleware: Optional Authentication
 * Attaches user if token is valid, but doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  const decoded = verifyToken(token);
  if (decoded) {
    try {
      const user = await db.getUserById(decoded.id);
      if (user && user.isActive) {
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }
    } catch (error) {
      // Silently fail, continue without user
    }
  }

  next();
}

module.exports = {
  generateToken,
  verifyToken,
  addToken,
  removeToken,
  clearAllTokens,
  isTokenValid,
  authenticateToken,
  requireLibrarian,
  requireActive,
  optionalAuth
};