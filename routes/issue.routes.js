/**
 * Issue Management Routes
 * Handles book borrowing, returning, and renewal
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireLibrarian, optionalAuth } = require('../middleware/auth.middleware');

/**
 * POST /api/issues
 * Issue a book (borrow)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { bookId, userId } = req.body;
    
    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }
    
    // Determine target user: librarian can issue for others, user can only issue for self
    let targetUserId = userId;
    if (req.user.role !== 'librarian') {
      targetUserId = req.user.id; // Regular users can only issue for themselves
    }
    
    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Process book issue with full validation
    const issue = await db.processBookIssue(
      targetUserId, 
      bookId, 
      req.user.username
    );
    
    // Get book details
    const book = await db.getBookById(bookId);
    
    res.status(201).json({
      message: 'Book issued successfully',
      issue,
      book: {
        id: book.id,
        title: book.title,
        author: `Author ${book.userId}`
      }
    });
    
  } catch (error) {
    // Handle validation errors
    if (error.message.includes('cannot') || 
        error.message.includes('Maximum') ||
        error.message.includes('fines') ||
        error.message.includes('already') ||
        error.message.includes('not available')) {
      return res.status(400).json({ error: error.message });
    }
    
    console.error('Issue creation error:', error);
    res.status(500).json({ error: 'Failed to issue book' });
  }
});

/**
 * GET /api/issues
 * Get all issues (librarian sees all, user sees own)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    let issues;
    
    if (req.user.role === 'librarian') {
      issues = await db.getAllIssues();
    } else {
      issues = await db.getIssueHistory(req.user.id);
    }
    
    // Enrich with book and user details
    const enrichedIssues = await Promise.all(
      issues.map(async (issue) => {
        const book = await db.getBookById(issue.bookId);
        const user = await db.getUserById(issue.userId);
        
        return {
          ...issue,
          book: book ? {
            id: book.id,
            title: book.title,
            author: `Author ${book.userId}`,
            isbn: book.isbn
          } : null,
          user: user ? {
            id: user.id,
            username: user.username,
            fullName: user.fullName
          } : null
        };
      })
    );
    
    res.json(enrichedIssues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

/**
 * GET /api/issues/:id
 * Get issue details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const issue = await db.getIssueById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Check access: user can only see own issues
    if (req.user.role !== 'librarian' && issue.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Enrich with book details
    const book = await db.getBookById(issue.bookId);
    const user = await db.getUserById(issue.userId);
    
    res.json({
      ...issue,
      book: book ? {
        id: book.id,
        title: book.title,
        author: `Author ${book.userId}`,
        isbn: book.isbn
      } : null,
      user: user ? {
        id: user.id,
        username: user.username,
        fullName: user.fullName
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

/**
 * PUT /api/issues/:id/return
 * Return a book
 */
router.put('/:id/return', authenticateToken, async (req, res) => {
  try {
    const issue = await db.getIssueById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Check access: user can only return own books
    if (req.user.role !== 'librarian' && issue.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Process return
    const result = await db.processBookReturn(req.params.id, req.user.username);
    
    res.json({
      message: 'Book returned successfully',
      issue: result.issue,
      fine: result.fine,
      hasFine: result.fine > 0
    });
    
  } catch (error) {
    if (error.message === 'Issue not found') {
      return res.status(404).json({ error: 'Issue not found' });
    }
    if (error.message.includes('already returned')) {
      return res.status(400).json({ error: error.message });
    }
    
    console.error('Return error:', error);
    res.status(500).json({ error: 'Failed to return book' });
  }
});

/**
 * PUT /api/issues/:id/renew
 * Renew a book
 */
router.put('/:id/renew', authenticateToken, async (req, res) => {
  try {
    const issue = await db.getIssueById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Check access: user can only renew own books
    if (req.user.role !== 'librarian' && issue.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Renew book
    const renewedIssue = await db.renewBook(req.params.id);
    
    res.json({
      message: 'Book renewed successfully',
      issue: renewedIssue,
      newDueDate: renewedIssue.dueDate,
      renewalsRemaining: renewedIssue.maxRenewals - renewedIssue.renewalCount
    });
    
  } catch (error) {
    if (error.message.includes('Maximum renewals') || 
        error.message.includes('Cannot renew') ||
        error.message.includes('fines')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to renew book' });
  }
});

/**
 * GET /api/issues/user/:userId
 * Get user's current issues
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check access: user can only see own issues
    if (req.user.role !== 'librarian' && userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const issues = await db.getActiveIssuesByUser(userId);
    
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
            isbn: book.isbn,
            category: book.category
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
 * GET /api/issues/book/:bookId
 * Get book's issue history (Librarian only)
 */
router.get('/book/:bookId', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const issues = await db.getIssuesByBook(req.params.bookId);
    
    // Enrich with user details
    const enrichedIssues = await Promise.all(
      issues.map(async (issue) => {
        const user = await db.getUserById(issue.userId);
        return {
          ...issue,
          user: user ? {
            id: user.id,
            username: user.username,
            fullName: user.fullName
          } : null
        };
      })
    );
    
    res.json(enrichedIssues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch book issues' });
  }
});

/**
 * GET /api/issues/overdue/all
 * Get all overdue issues (Librarian only)
 */
router.get('/overdue/all', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    // Update overdue status first
    await db.updateOverdueStatus();
    
    const overdueIssues = await db.getOverdueIssues();
    
    // Enrich with book and user details
    const enrichedIssues = await Promise.all(
      overdueIssues.map(async (issue) => {
        const book = await db.getBookById(issue.bookId);
        const user = await db.getUserById(issue.userId);
        const fine = await db.calculateFine(issue.id);
        
        return {
          ...issue,
          currentFine: fine,
          book: book ? {
            id: book.id,
            title: book.title,
            author: `Author ${book.userId}`
          } : null,
          user: user ? {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email
          } : null
        };
      })
    );
    
    res.json(enrichedIssues);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overdue issues' });
  }
});

module.exports = router;
