/**
 * Fine Management Routes
 * Handles fine calculations and payments
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireLibrarian } = require('../middleware/auth.middleware');

/**
 * GET /api/fines/user/:userId
 * Get user's fine summary
 */
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check access: user can only see own fines
    if (req.user.role !== 'librarian' && userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get all issues with fines
    const allIssues = await db.getIssueHistory(userId);
    const issuesWithFines = allIssues.filter(issue => issue.fineAmount > 0);
    const unpaidIssues = issuesWithFines.filter(issue => !issue.finePaid);
    
    res.json({
      totalFines: user.totalFines,
      paidFines: user.paidFines,
      unpaidFines: user.totalFines,
      unpaidIssuesCount: unpaidIssues.length,
      issuesWithFines: await Promise.all(
        unpaidIssues.map(async (issue) => {
          const book = await db.getBookById(issue.bookId);
          return {
            issueId: issue.id,
            bookTitle: book ? book.title : 'Unknown',
            fineAmount: issue.fineAmount,
            finePaid: issue.finePaid
          };
        })
      )
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fines' });
  }
});

/**
 * POST /api/fines/:issueId/pay
 * Pay fine for specific issue
 */
router.post('/:issueId/pay', authenticateToken, async (req, res) => {
  try {
    const issueId = parseInt(req.params.issueId);
    const issue = await db.getIssueById(issueId);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Check access: user can only pay own fines
    if (req.user.role !== 'librarian' && issue.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (issue.fineAmount === 0) {
      return res.status(400).json({ error: 'No fine to pay for this issue' });
    }
    
    if (issue.finePaid) {
      return res.status(400).json({ error: 'Fine already paid' });
    }
    
    // Mark fine as paid
    await db.updateIssue(issueId, { finePaid: true });
    
    // Deduct from user's total fines
    const paymentResult = await db.payUserFine(issue.userId, issue.fineAmount);
    
    res.json({
      message: 'Fine paid successfully',
      amountPaid: issue.fineAmount,
      remainingFines: paymentResult.remaining
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

/**
 * POST /api/fines/user/:userId/pay-all
 * Pay all unpaid fines for user
 */
router.post('/user/:userId/pay-all', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Check access: user can only pay own fines
    if (req.user.role !== 'librarian' && userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.totalFines === 0) {
      return res.status(400).json({ error: 'No outstanding fines' });
    }
    
    // Get all unpaid issues
    const allIssues = await db.getIssueHistory(userId);
    const unpaidIssues = allIssues.filter(issue => 
      issue.fineAmount > 0 && !issue.finePaid
    );
    
    // Mark all as paid
    for (const issue of unpaidIssues) {
      await db.updateIssue(issue.id, { finePaid: true });
    }
    
    // Pay all fines
    const totalAmount = user.totalFines;
    const paymentResult = await db.payUserFine(userId, totalAmount);
    
    res.json({
      message: 'All fines paid successfully',
      amountPaid: totalAmount,
      issuesPaid: unpaidIssues.length,
      remainingFines: paymentResult.remaining
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

/**
 * GET /api/fines/calculate/:issueId
 * Calculate fine for an issue (preview)
 */
router.get('/calculate/:issueId', authenticateToken, async (req, res) => {
  try {
    const issueId = parseInt(req.params.issueId);
    const issue = await db.getIssueById(issueId);
    
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    
    // Check access: user can only see own fines
    if (req.user.role !== 'librarian' && issue.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const fine = await db.calculateFine(issueId);
    const config = await db.getConfig();
    
    // Calculate overdue days
    const now = new Date();
    const dueDate = new Date(issue.dueDate);
    const gracePeriod = config.fines.gracePeriodDays;
    const effectiveDueDate = new Date(dueDate);
    effectiveDueDate.setDate(effectiveDueDate.getDate() + gracePeriod);
    
    let overdueDays = 0;
    if (now > effectiveDueDate) {
      overdueDays = Math.ceil((now - effectiveDueDate) / (1000 * 60 * 60 * 24));
    }
    
    res.json({
      issueId: issue.id,
      dueDate: issue.dueDate,
      gracePeriodDays: gracePeriod,
      overdueDays: Math.max(0, overdueDays),
      finePerDay: config.fines.perDayRate,
      calculatedFine: fine,
      maxFinePerBook: config.fines.maxFinePerBook,
      isOverdue: fine > 0,
      status: issue.status
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate fine' });
  }
});

/**
 * GET /api/fines/report
 * Get fines report (Librarian only)
 */
router.get('/report', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const allIssues = await db.getAllIssues();
    
    const usersWithFines = [];
    let totalUnpaidFines = 0;
    let totalPaidFines = 0;
    
    for (const user of users) {
      if (user.totalFines > 0 || user.paidFines > 0) {
        const userIssues = allIssues.filter(i => i.userId === user.id);
        const unpaidIssues = userIssues.filter(i => i.fineAmount > 0 && !i.finePaid);
        
        usersWithFines.push({
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          unpaidFines: user.totalFines,
          paidFines: user.paidFines,
          unpaidIssuesCount: unpaidIssues.length
        });
        
        totalUnpaidFines += user.totalFines;
        totalPaidFines += user.paidFines;
      }
    }
    
    res.json({
      summary: {
        totalUnpaidFines,
        totalPaidFines,
        usersWithUnpaidFines: usersWithFines.filter(u => u.unpaidFines > 0).length,
        totalUsersWithFines: usersWithFines.length
      },
      users: usersWithFines
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate fines report' });
  }
});

module.exports = router;
