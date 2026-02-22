/**
 * User Management Routes
 * Librarian-only routes for managing users
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireLibrarian } = require('../middleware/auth.middleware');

// All user management routes require librarian role
router.use(authenticateToken);
router.use(requireLibrarian);

/**
 * GET /api/users
 * Get all users (Librarian only)
 */
router.get('/', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    
    // Remove passwords
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (Librarian only)
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/users/:id
 * Update user (Librarian only)
 */
router.put('/:id', async (req, res) => {
  try {
    const { fullName, email, phone, address, role, isActive, maxBooksAllowed } = req.body;
    
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (maxBooksAllowed !== undefined) updates.maxBooksAllowed = maxBooksAllowed;
    
    const updatedUser = await db.updateUser(req.params.id, updates);
    
    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Deactivate user (Librarian only)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Don't actually delete, just deactivate
    const updatedUser = await db.updateUser(req.params.id, { isActive: false });
    
    res.json({
      message: 'User deactivated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

/**
 * GET /api/users/:id/issues
 * Get user's borrowing history (Librarian only)
 */
router.get('/:id/issues', async (req, res) => {
  try {
    const issues = await db.getIssueHistory(req.params.id);
    
    // Enrich with book details
    const enrichedIssues = await Promise.all(
      issues.map(async (issue) => {
        const book = await db.getBookById(issue.bookId);
        return {
          ...issue,
          book: book ? {
            id: book.id,
            title: book.title,
            author: `Author ${book.userId}`,
            isbn: book.isbn
          } : null
        };
      })
    );
    
    res.json(enrichedIssues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user issues' });
  }
});

/**
 * GET /api/users/:id/stats
 * Get user statistics (Librarian only)
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const allIssues = await db.getIssueHistory(req.params.id);
    const activeIssues = allIssues.filter(i => i.status !== 'returned');
    const returnedIssues = allIssues.filter(i => i.status === 'returned');
    const overdueIssues = allIssues.filter(i => i.status === 'overdue');
    
    res.json({
      totalBorrowed: allIssues.length,
      currentlyBorrowed: activeIssues.length,
      returned: returnedIssues.length,
      overdue: overdueIssues.length,
      totalFines: user.totalFines,
      paidFines: user.paidFines
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;
