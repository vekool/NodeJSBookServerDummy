/**
 * Enhanced Book Routes
 * Additional book endpoints for v2 features
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireLibrarian, optionalAuth } = require('../middleware/auth.middleware');

/**
 * GET /api/books/detailed
 * Get all books with full details (including stock info)
 */
router.get('/detailed', optionalAuth, async (req, res) => {
  try {
    const books = await db.getAllBooks();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});
/**
 * GET /api/books/detailed/:id
 * Search book with a specified id
 */
router.get('/detailed/:id', optionalAuth, async(req, res) =>{
  try{
    const book = await db.getBookById(req.params.id);
    if(!book){
      return res.status(404).json({error: "Unable to find book with id: " + req.params.id });
    }
    res.json(book);
  }
  catch(error){
    res.status(500).json({error: error.message || "Unable to find book with id: " + req.params.id });
  }
});

/**
 * 
 * async function getBookById(id) {
   const books = await getAllBooks();
   return books.find(book => book.id === parseInt(id));
 }
 * GET /api/books/search
 * Search books by query
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const books = await db.searchBooks(q);
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search books' });
  }
});

/**
 * GET /api/books/category/:category
 * Get books by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const books = await db.getAllBooks();
    const filtered = books.filter(book => 
      book.category.toLowerCase() === req.params.category.toLowerCase()
    );
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books by category' });
  }
});

/**
 * GET /api/books/available
 * Get only available books (availableCopies > 0)
 */
router.get('/available', async (req, res) => {
  try {
    const books = await db.getAllBooks();
    const available = books.filter(book => book.availableCopies > 0);
    
    res.json(available);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available books' });
  }
});

/**
 * GET /api/books/:id/availability
 * Get detailed availability info for a book
 */
router.get('/:id/availability', async (req, res) => {
  try {
    const book = await db.getBookById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    const activeIssues = await db.getIssuesByBook(req.params.id);
    const currentIssues = activeIssues.filter(issue => issue.status !== 'returned');
    
    res.json({
      bookId: book.id,
      title: book.title,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      issuedCopies: book.issuedCopies,
      isAvailable: book.availableCopies > 0,
      currentlyBorrowedBy: currentIssues.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

/**
 * GET /api/books/categories/list
 * Get list of all unique categories
 */
router.get('/categories/list', async (req, res) => {
  try {
    const books = await db.getAllBooks();
    const categories = [...new Set(books.map(book => book.category))];
    
    res.json(categories.sort());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/**
 * POST /api/books/create
 * Create a new book (Librarian only)
 */
router.post('/create', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const { title, body, isbn, category, publishedYear, totalCopies, coverImage } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    const bookData = {
      title,
      body,
      isbn,
      category,
      publishedYear,
      totalCopies: totalCopies || 1,
      coverImage,
      addedBy: req.user.username
    };
    
    const newBook = await db.createBook(bookData);
    
    res.status(201).json({
      message: 'Book created successfully',
      book: newBook
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create book' });
  }
});

/**
 * PUT /api/books/:id/update
 * Update book details (Librarian only)
 */
router.put('/:id/update', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const { title, body, category, publishedYear, totalCopies, coverImage } = req.body;
    
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (body !== undefined) updates.body = body;
    if (category !== undefined) updates.category = category;
    if (publishedYear !== undefined) updates.publishedYear = publishedYear;
    if (coverImage !== undefined) updates.coverImage = coverImage;
    
    // Handle totalCopies update carefully
    if (totalCopies !== undefined) {
      const book = await db.getBookById(req.params.id);
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      
      const newTotal = parseInt(totalCopies);
      if (newTotal < book.issuedCopies) {
        return res.status(400).json({ 
          error: `Cannot reduce total copies below issued copies (${book.issuedCopies})` 
        });
      }
      
      updates.totalCopies = newTotal;
      updates.availableCopies = newTotal - book.issuedCopies;
    }
    
    const updatedBook = await db.updateBook(req.params.id, updates);
    
    res.json({
      message: 'Book updated successfully',
      book: updatedBook
    });
  } catch (error) {
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(500).json({ error: 'Failed to update book' });
  }
});

/**
 * DELETE /api/books/:id/delete
 * Delete book (Librarian only, only if no active issues)
 */
router.delete('/:id/delete', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    const deletedBook = await db.deleteBook(req.params.id);
    
    res.json({
      message: 'Book deleted successfully',
      book: deletedBook
    });
  } catch (error) {
    if (error.message.includes('active issues')) {
      return res.status(400).json({ error: 'Cannot delete book with active issues' });
    }
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

module.exports = router;
