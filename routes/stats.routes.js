/**
 * Statistics & Reports Routes
 * Dashboard and reporting endpoints (Librarian only)
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireLibrarian } = require('../middleware/auth.middleware');

// All stats routes require librarian role
router.use(authenticateToken);
router.use(requireLibrarian);

/**
 * GET /api/stats/dashboard
 * Get dashboard overview statistics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const books = await db.getAllBooks();
    const users = await db.getAllUsers();
    const issues = await db.getAllIssues();
    
    // Book statistics
    const totalBooks = books.reduce((sum, book) => sum + book.totalCopies, 0);
    const availableBooks = books.reduce((sum, book) => sum + book.availableCopies, 0);
    const issuedBooks = books.reduce((sum, book) => sum + book.issuedCopies, 0);
    
    // User statistics
    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = users.filter(u => !u.isActive).length;
    
    // Issue statistics
    const activeIssues = issues.filter(i => i.status !== 'returned').length;
    const overdueIssues = issues.filter(i => i.status === 'overdue').length;
    const totalIssued = issues.length;
    const returnedIssues = issues.filter(i => i.status === 'returned').length;
    
    // Fine statistics
    const totalUnpaidFines = users.reduce((sum, user) => sum + user.totalFines, 0);
    const totalPaidFines = users.reduce((sum, user) => sum + user.paidFines, 0);
    
    res.json({
      books: {
        totalBooks,
        uniqueTitles: books.length,
        availableBooks,
        issuedBooks,
        utilizationRate: ((issuedBooks / totalBooks) * 100).toFixed(1)
      },
      users: {
        totalUsers: users.length,
        activeUsers,
        inactiveUsers,
        usersWithBooks: users.filter(u => u.currentBooksCount > 0).length
      },
      issues: {
        totalIssued,
        activeIssues,
        overdueIssues,
        returnedIssues,
        overdueRate: totalIssued > 0 ? ((overdueIssues / totalIssued) * 100).toFixed(1) : 0
      },
      fines: {
        totalUnpaidFines: totalUnpaidFines.toFixed(2),
        totalPaidFines: totalPaidFines.toFixed(2),
        usersWithFines: users.filter(u => u.totalFines > 0).length
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

/**
 * GET /api/stats/books
 * Get detailed book statistics
 */
router.get('/books', async (req, res) => {
  try {
    const books = await db.getAllBooks();
    const issues = await db.getAllIssues();
    
    // Calculate statistics for each book
    const bookStats = await Promise.all(
      books.map(async (book) => {
        const bookIssues = issues.filter(i => i.bookId === book.id);
        const activeIssues = bookIssues.filter(i => i.status !== 'returned');
        
        return {
          id: book.id,
          title: book.title,
          category: book.category,
          totalCopies: book.totalCopies,
          availableCopies: book.availableCopies,
          issuedCopies: book.issuedCopies,
          timesIssued: bookIssues.length,
          currentlyIssued: activeIssues.length
        };
      })
    );
    
    // Sort by most issued
    bookStats.sort((a, b) => b.timesIssued - a.timesIssued);
    
    // Category breakdown
    const categories = {};
    books.forEach(book => {
      if (!categories[book.category]) {
        categories[book.category] = {
          count: 0,
          totalCopies: 0,
          available: 0
        };
      }
      categories[book.category].count++;
      categories[book.category].totalCopies += book.totalCopies;
      categories[book.category].available += book.availableCopies;
    });
    
    res.json({
      summary: {
        totalTitles: books.length,
        totalCopies: books.reduce((sum, b) => sum + b.totalCopies, 0),
        totalAvailable: books.reduce((sum, b) => sum + b.availableCopies, 0),
        totalIssued: books.reduce((sum, b) => sum + b.issuedCopies, 0)
      },
      byCategory: categories,
      mostPopular: bookStats.slice(0, 10),
      leastPopular: bookStats.slice(-10).reverse()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch book statistics' });
  }
});

/**
 * GET /api/stats/users
 * Get detailed user statistics
 */
router.get('/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    const issues = await db.getAllIssues();
    
    // Calculate statistics for each user
    const userStats = users.map(user => {
      const userIssues = issues.filter(i => i.userId === user.id);
      const activeIssues = userIssues.filter(i => i.status !== 'returned');
      const overdueIssues = userIssues.filter(i => i.status === 'overdue');
      
      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        currentBooksCount: user.currentBooksCount,
        totalBorrowed: userIssues.length,
        activeIssues: activeIssues.length,
        overdueIssues: overdueIssues.length,
        totalFines: user.totalFines
      };
    });
    
    // Sort by most active
    userStats.sort((a, b) => b.totalBorrowed - a.totalBorrowed);
    
    res.json({
      summary: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        usersWithBooks: users.filter(u => u.currentBooksCount > 0).length,
        usersWithFines: users.filter(u => u.totalFines > 0).length
      },
      mostActiveUsers: userStats.slice(0, 10),
      usersWithOverdue: userStats.filter(u => u.overdueIssues > 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

/**
 * GET /api/stats/issues
 * Get issue statistics
 */
router.get('/issues', async (req, res) => {
  try {
    const issues = await db.getAllIssues();
    
    // Status breakdown
    const statusCounts = {
      issued: issues.filter(i => i.status === 'issued').length,
      overdue: issues.filter(i => i.status === 'overdue').length,
      returned: issues.filter(i => i.status === 'returned').length
    };
    
    // Issues over time (by month)
    const issuesByMonth = {};
    issues.forEach(issue => {
      const month = issue.issueDate.substring(0, 7); // YYYY-MM
      issuesByMonth[month] = (issuesByMonth[month] || 0) + 1;
    });
    
    // Average issue duration for returned books
    const returnedIssues = issues.filter(i => i.returnDate);
    let avgDuration = 0;
    if (returnedIssues.length > 0) {
      const totalDuration = returnedIssues.reduce((sum, issue) => {
        const issueDate = new Date(issue.issueDate);
        const returnDate = new Date(issue.returnDate);
        const days = Math.ceil((returnDate - issueDate) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgDuration = (totalDuration / returnedIssues.length).toFixed(1);
    }
    
    res.json({
      summary: {
        totalIssues: issues.length,
        activeIssues: statusCounts.issued,
        overdueIssues: statusCounts.overdue,
        returnedIssues: statusCounts.returned,
        overdueRate: ((statusCounts.overdue / issues.length) * 100).toFixed(1),
        averageDurationDays: avgDuration
      },
      byStatus: statusCounts,
      byMonth: issuesByMonth
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch issue statistics' });
  }
});

/**
 * GET /api/reports/overdue
 * Get detailed overdue books report
 */
router.get('/reports/overdue', async (req, res) => {
  try {
    await db.updateOverdueStatus();
    const overdueIssues = await db.getOverdueIssues();
    
    const report = await Promise.all(
      overdueIssues.map(async (issue) => {
        const book = await db.getBookById(issue.bookId);
        const user = await db.getUserById(issue.userId);
        const fine = await db.calculateFine(issue.id);
        
        const dueDate = new Date(issue.dueDate);
        const now = new Date();
        const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
        
        return {
          issueId: issue.id,
          book: {
            id: book.id,
            title: book.title,
            isbn: book.isbn
          },
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone
          },
          issueDate: issue.issueDate,
          dueDate: issue.dueDate,
          daysOverdue,
          currentFine: fine,
          finePaid: issue.finePaid
        };
      })
    );
    
    report.sort((a, b) => b.daysOverdue - a.daysOverdue);
    
    res.json({
      summary: {
        totalOverdue: report.length,
        totalFinesAccrued: report.reduce((sum, r) => sum + r.currentFine, 0).toFixed(2),
        unpaidFinesCount: report.filter(r => !r.finePaid).length
      },
      overdueIssues: report
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate overdue report' });
  }
});

/**
 * GET /api/reports/popular
 * Get most popular books report
 */
router.get('/reports/popular', async (req, res) => {
  try {
    const books = await db.getAllBooks();
    const issues = await db.getAllIssues();
    
    const popularity = await Promise.all(
      books.map(async (book) => {
        const bookIssues = issues.filter(i => i.bookId === book.id);
        
        return {
          id: book.id,
          title: book.title,
          author: `Author ${book.userId}`,
          category: book.category,
          timesIssued: bookIssues.length,
          currentlyIssued: book.issuedCopies,
          availableCopies: book.availableCopies,
          totalCopies: book.totalCopies
        };
      })
    );
    
    popularity.sort((a, b) => b.timesIssued - a.timesIssued);
    
    res.json({
      mostPopular: popularity.slice(0, 20),
      leastPopular: popularity.filter(b => b.timesIssued === 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate popularity report' });
  }
});

module.exports = router;
