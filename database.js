/**
 * Database Service Layer - JSON File-based Database
 * Provides abstraction for all CRUD operations on JSON files
 * We will use TypeORM in this layer - when we learn Node.JS
 */

const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');
const { addDays, differenceInDays, parseISO } = require('date-fns');

// Database file paths
const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
  books: path.join(DATA_DIR, 'books.json'),
  users: path.join(DATA_DIR, 'users.json'),
  issues: path.join(DATA_DIR, 'issues.json'),
  config: path.join(DATA_DIR, 'config.json')
};

/**
 * Initialize database - Create data folder and files if they don't exist
 */
async function initializeDatabase() {
  try {
    // Create data directory if it doesn't exist
    await fs.ensureDir(DATA_DIR);

    // Initialize each file with default data if it doesn't exist
    const initialData = {
      books: { books: [], nextId: 11 },
      users: { users: [], nextId: 100 },
      issues: { issues: [], nextId: 1000 },
      config: getDefaultConfig()
    };

    for (const [key, filePath] of Object.entries(FILES)) {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        await fs.writeJson(filePath, initialData[key], { spaces: 2 });
        console.log(`✓ Created ${key}.json with default data`);
      }
    }

    console.log('✓ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('✗ Database initialization failed:', error.message);
    throw error;
  }
}

/**
 * Default system configuration
 */
function getDefaultConfig() {
  return {
    library: {
      name: "City Central Library",
      maxBooksPerUser: 3,
      issueDurationDays: 14,
      maxRenewals: 2,
      renewalExtensionDays: 7
    },
    fines: {
      enabled: true,
      perDayRate: 0.50,
      maxFinePerBook: 20.00,
      gracePeriodDays: 1
    },
    roles: {
      user: {
        permissions: ["view_books", "borrow_books", "view_own_history", "pay_fines"]
      },
      librarian: {
        permissions: ["*"]
      }
    }
  };
}

// ==================== GENERIC FILE OPERATIONS ====================

/**
 * Read data from JSON file
 */
async function readData(fileName) {
  try {
    const filePath = FILES[fileName];
    const data = await fs.readJson(filePath);
    return data;
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error.message);
    throw new Error(`Failed to read ${fileName}`);
  }
}

/**
 * Write data to JSON file (atomic operation)
 */
async function writeData(fileName, data) {
  try {
    const filePath = FILES[fileName];
    const tempPath = filePath + '.tmp';
    
    // Write to temp file first
    await fs.writeJson(tempPath, data, { spaces: 2 });
    
    // Atomic rename
    await fs.move(tempPath, filePath, { overwrite: true });
    
    return true;
  } catch (error) {
    console.error(`Error writing ${fileName}:`, error.message);
    throw new Error(`Failed to write ${fileName}`);
  }
}

/**
 * Get next auto-increment ID
 */
async function getNextId(fileName) {
  const data = await readData(fileName);
  const currentId = data.nextId;
  data.nextId = currentId + 1;
  await writeData(fileName, data);
  return currentId;
}

// ==================== BOOKS OPERATIONS ====================

/**
 * Get all books
 */
async function getAllBooks() {
  const data = await readData('books');
  return data.books;
}

/**
 * Get book by ID
 */
async function getBookById(id) {
  const books = await getAllBooks();
  return books.find(book => book.id === parseInt(id));
}

/**
 * Create new book (Librarian only)
 */
async function createBook(bookData) {
  const data = await readData('books');
  const newId = data.nextId;
  
  const newBook = {
    id: newId,
    userId: bookData.userId || 1, // Compatibility
    title: bookData.title,
    body: bookData.body || bookData.description,
    isbn: bookData.isbn || `ISBN-${newId}-${Date.now()}`,
    category: bookData.category || 'General',
    publishedYear: bookData.publishedYear || new Date().getFullYear(),
    totalCopies: bookData.totalCopies || 1,
    availableCopies: bookData.totalCopies || 1,
    issuedCopies: 0,
    coverImage: bookData.coverImage || '',
    addedBy: bookData.addedBy || 'admin',
    addedDate: new Date().toISOString()
  };
  
  data.books.push(newBook);
  data.nextId = newId + 1;
  await writeData('books', data);
  
  return newBook;
}

/**
 * Update book
 */
async function updateBook(id, updates) {
  const data = await readData('books');
  const index = data.books.findIndex(book => book.id === parseInt(id));
  
  if (index === -1) {
    throw new Error('Book not found');
  }
  
  // Preserve stock integrity
  const book = data.books[index];
  data.books[index] = {
    ...book,
    ...updates,
    id: book.id, // Never change ID
    availableCopies: book.availableCopies, // Managed separately
    issuedCopies: book.issuedCopies // Managed separately
  };
  
  await writeData('books', data);
  return data.books[index];
}

/**
 * Delete book (only if no active issues)
 */
async function deleteBook(id) {
  // Check for active issues
  const issues = await getAllIssues();
  const activeIssues = issues.filter(issue => 
    issue.bookId === parseInt(id) && issue.status !== 'returned'
  );
  
  if (activeIssues.length > 0) {
    throw new Error('Cannot delete book with active issues');
  }
  
  const data = await readData('books');
  const index = data.books.findIndex(book => book.id === parseInt(id));
  
  if (index === -1) {
    throw new Error('Book not found');
  }
  
  const deletedBook = data.books.splice(index, 1)[0];
  await writeData('books', data);
  
  return deletedBook;
}

/**
 * Update book stock (called during issue/return)
 */
async function updateBookStock(bookId, change) {
  const data = await readData('books');
  const book = data.books.find(b => b.id === parseInt(bookId));
  
  if (!book) {
    throw new Error('Book not found');
  }
  
  book.availableCopies += change;
  book.issuedCopies -= change;
  
  // Validate stock integrity
  if (book.availableCopies < 0) {
    throw new Error('Invalid stock: available copies cannot be negative');
  }
  
  if (book.availableCopies + book.issuedCopies !== book.totalCopies) {
    throw new Error('Stock integrity violation');
  }
  
  await writeData('books', data);
  return book;
}

/**
 * Search books by title, author, ISBN, or category
 */
async function searchBooks(query) {
  const books = await getAllBooks();
  const lowerQuery = query.toLowerCase();
  
  return books.filter(book => 
    book.title.toLowerCase().includes(lowerQuery) ||
    book.body.toLowerCase().includes(lowerQuery) ||
    book.isbn.toLowerCase().includes(lowerQuery) ||
    book.category.toLowerCase().includes(lowerQuery)
  );
}

// ==================== USERS OPERATIONS ====================

/**
 * Get all users
 */
async function getAllUsers() {
  const data = await readData('users');
  return data.users;
}

/**
 * Get user by ID
 */
async function getUserById(id) {
  const users = await getAllUsers();
  return users.find(user => user.id === parseInt(id));
}

/**
 * Get user by username
 */
async function getUserByUsername(username) {
  const users = await getAllUsers();
  return users.find(user => user.username === username);
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const users = await getAllUsers();
  return users.find(user => user.email === email);
}

/**
 * Create new user (Registration)
 */
async function createUser(userData) {
  const data = await readData('users');
  
  // Check for existing username or email
  const existingUser = data.users.find(u => 
    u.username === userData.username || u.email === userData.email
  );
  
  if (existingUser) {
    throw new Error('Username or email already exists');
  }
  
  const newId = data.nextId;
  
  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const config = await getConfig();
  
  const newUser = {
    id: newId,
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    fullName: userData.fullName || userData.username,
    role: userData.role || 'user', // Default to regular user
    phone: userData.phone || '',
    address: userData.address || '',
    joinDate: new Date().toISOString(),
    isActive: true,
    maxBooksAllowed: config.library.maxBooksPerUser,
    currentBooksCount: 0,
    totalFines: 0,
    paidFines: 0,
    membershipExpiry: addDays(new Date(), 365).toISOString() // 1 year
  };
  
  data.users.push(newUser);
  data.nextId = newId + 1;
  await writeData('users', data);
  
  // Return user without password
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Update user
 */
async function updateUser(id, updates) {
  const data = await readData('users');
  const index = data.users.findIndex(user => user.id === parseInt(id));
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  // If updating password, hash it
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }
  
  const user = data.users[index];
  data.users[index] = {
    ...user,
    ...updates,
    id: user.id, // Never change ID
    joinDate: user.joinDate // Never change join date
  };
  
  await writeData('users', data);
  
  const { password, ...userWithoutPassword } = data.users[index];
  return userWithoutPassword;
}

/**
 * Validate password
 */
async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Increment user's book count
 */
async function incrementUserBookCount(userId) {
  const data = await readData('users');
  const user = data.users.find(u => u.id === parseInt(userId));
  
  if (!user) {
    throw new Error('User not found');
  }
  
  user.currentBooksCount += 1;
  await writeData('users', data);
  
  return user.currentBooksCount;
}

/**
 * Decrement user's book count
 */
async function decrementUserBookCount(userId) {
  const data = await readData('users');
  const user = data.users.find(u => u.id === parseInt(userId));
  
  if (!user) {
    throw new Error('User not found');
  }
  
  user.currentBooksCount = Math.max(0, user.currentBooksCount - 1);
  await writeData('users', data);
  
  return user.currentBooksCount;
}

/**
 * Add fine to user's total
 */
async function addFineToUser(userId, amount) {
  const data = await readData('users');
  const user = data.users.find(u => u.id === parseInt(userId));
  
  if (!user) {
    throw new Error('User not found');
  }
  
  user.totalFines += amount;
  await writeData('users', data);
  
  return user.totalFines;
}

/**
 * Pay user's fines
 */
async function payUserFine(userId, amount) {
  const data = await readData('users');
  const user = data.users.find(u => u.id === parseInt(userId));
  
  if (!user) {
    throw new Error('User not found');
  }
  
  const paymentAmount = Math.min(amount, user.totalFines);
  user.totalFines -= paymentAmount;
  user.paidFines += paymentAmount;
  
  await writeData('users', data);
  
  return { remaining: user.totalFines, paid: paymentAmount };
}

// ==================== ISSUES OPERATIONS ====================

/**
 * Get all issues
 */
async function getAllIssues() {
  const data = await readData('issues');
  return data.issues;
}

/**
 * Get issue by ID
 */
async function getIssueById(id) {
  const issues = await getAllIssues();
  return issues.find(issue => issue.id === parseInt(id));
}

/**
 * Get active issues by user
 */
async function getActiveIssuesByUser(userId) {
  const issues = await getAllIssues();
  return issues.filter(issue => 
    issue.userId === parseInt(userId) && 
    issue.status !== 'returned'
  );
}

/**
 * Get issue history by user
 */
async function getIssueHistory(userId) {
  const issues = await getAllIssues();
  return issues.filter(issue => issue.userId === parseInt(userId));
}

/**
 * Get issues by book
 */
async function getIssuesByBook(bookId) {
  const issues = await getAllIssues();
  return issues.filter(issue => issue.bookId === parseInt(bookId));
}

/**
 * Get overdue issues
 */
async function getOverdueIssues() {
  const issues = await getAllIssues();
  const now = new Date();
  
  return issues.filter(issue => {
    if (issue.status === 'returned') return false;
    const dueDate = parseISO(issue.dueDate);
    return now > dueDate;
  });
}

/**
 * Create new issue (Borrow book)
 */
async function createIssue(issueData) {
  const data = await readData('issues');
  const config = await getConfig();
  const newId = data.nextId;
  
  const issueDate = new Date();
  const dueDate = addDays(issueDate, config.library.issueDurationDays);
  
  const newIssue = {
    id: newId,
    bookId: issueData.bookId,
    userId: issueData.userId,
    issueDate: issueDate.toISOString(),
    dueDate: dueDate.toISOString(),
    returnDate: null,
    status: 'issued',
    issuedBy: issueData.issuedBy || 'system',
    returnedTo: null,
    fineAmount: 0,
    finePaid: false,
    renewalCount: 0,
    maxRenewals: config.library.maxRenewals,
    notes: issueData.notes || ''
  };
  
  data.issues.push(newIssue);
  data.nextId = newId + 1;
  await writeData('issues', data);
  
  return newIssue;
}

/**
 * Update issue
 */
async function updateIssue(id, updates) {
  const data = await readData('issues');
  const index = data.issues.findIndex(issue => issue.id === parseInt(id));
  
  if (index === -1) {
    throw new Error('Issue not found');
  }
  
  const issue = data.issues[index];
  data.issues[index] = {
    ...issue,
    ...updates,
    id: issue.id // Never change ID
  };
  
  await writeData('issues', data);
  return data.issues[index];
}

/**
 * Calculate fine for an issue
 */
async function calculateFine(issueId) {
  const issue = await getIssueById(issueId);
  
  if (!issue) {
    throw new Error('Issue not found');
  }
  
  if (issue.status === 'returned') {
    return issue.fineAmount; // Already calculated
  }
  
  const config = await getConfig();
  
  if (!config.fines.enabled) {
    return 0;
  }
  
  const now = new Date();
  const dueDate = parseISO(issue.dueDate);
  const gracePeriod = config.fines.gracePeriodDays;
  
  // Add grace period to due date
  const effectiveDueDate = addDays(dueDate, gracePeriod);
  
  if (now <= effectiveDueDate) {
    return 0; // Not overdue yet
  }
  
  const overdueDays = differenceInDays(now, effectiveDueDate);
  let fine = overdueDays * config.fines.perDayRate;
  
  // Cap at max fine
  fine = Math.min(fine, config.fines.maxFinePerBook);
  
  return parseFloat(fine.toFixed(2));
}

// ==================== BUSINESS LOGIC ====================

/**
 * Check if user can borrow a book
 */
async function canUserBorrowBook(userId, bookId) {
  const user = await getUserById(userId);
  const book = await getBookById(bookId);
  const config = await getConfig();
  
  const errors = [];
  
  // Check user exists and is active
  if (!user) {
    errors.push('User not found');
    return { canBorrow: false, errors };
  }
  
  if (!user.isActive) {
    errors.push('User account is not active');
  }
  
  // Check book exists and is available
  if (!book) {
    errors.push('Book not found');
    return { canBorrow: false, errors };
  }
  
  if (book.availableCopies <= 0) {
    errors.push('Book is not available');
  }
  
  // Check user hasn't exceeded max books
  if (user.currentBooksCount >= user.maxBooksAllowed) {
    errors.push(`Maximum ${user.maxBooksAllowed} books allowed`);
  }
  
  // Check user doesn't have unpaid fines over limit
  if (user.totalFines > 10) {
    errors.push('Please pay outstanding fines before borrowing');
  }
  
  // Check user doesn't already have this book issued
  const activeIssues = await getActiveIssuesByUser(userId);
  const alreadyIssued = activeIssues.some(issue => issue.bookId === bookId);
  
  if (alreadyIssued) {
    errors.push('You already have this book borrowed');
  }
  
  return { canBorrow: errors.length === 0, errors };
}

/**
 * Process book issue (complete workflow)
 */
async function processBookIssue(userId, bookId, issuedBy = 'system') {
  // Validate
  const validation = await canUserBorrowBook(userId, bookId);
  
  if (!validation.canBorrow) {
    throw new Error(validation.errors.join(', '));
  }
  
  // Create issue
  const issue = await createIssue({ userId, bookId, issuedBy });
  
  // Update book stock
  await updateBookStock(bookId, -1);
  
  // Update user book count
  await incrementUserBookCount(userId);
  
  return issue;
}

/**
 * Process book return (complete workflow)
 */
async function processBookReturn(issueId, returnedTo = 'system') {
  const issue = await getIssueById(issueId);
  
  if (!issue) {
    throw new Error('Issue not found');
  }
  
  if (issue.status === 'returned') {
    throw new Error('Book already returned');
  }
  
  // Calculate fine
  const fine = await calculateFine(issueId);
  
  // Update issue
  await updateIssue(issueId, {
    returnDate: new Date().toISOString(),
    status: 'returned',
    returnedTo,
    fineAmount: fine
  });
  
  // Update book stock
  await updateBookStock(issue.bookId, 1);
  
  // Update user book count
  await decrementUserBookCount(issue.userId);
  
  // Add fine to user if any
  if (fine > 0) {
    await addFineToUser(issue.userId, fine);
  }
  
  return { issue, fine };
}

/**
 * Renew a book
 */
async function renewBook(issueId) {
  const issue = await getIssueById(issueId);
  
  if (!issue) {
    throw new Error('Issue not found');
  }
  
  if (issue.status === 'returned') {
    throw new Error('Cannot renew returned book');
  }
  
  if (issue.renewalCount >= issue.maxRenewals) {
    throw new Error('Maximum renewals reached');
  }
  
  // Check for fines
  const fine = await calculateFine(issueId);
  if (fine > 0) {
    throw new Error('Please pay fines before renewing');
  }
  
  const config = await getConfig();
  const currentDueDate = parseISO(issue.dueDate);
  const newDueDate = addDays(currentDueDate, config.library.renewalExtensionDays);
  
  await updateIssue(issueId, {
    dueDate: newDueDate.toISOString(),
    renewalCount: issue.renewalCount + 1
  });
  
  const updatedIssue = await getIssueById(issueId);
  return updatedIssue;
}

/**
 * Update overdue status for all issues
 */
async function updateOverdueStatus() {
  const issues = await getAllIssues();
  const now = new Date();
  let updated = 0;
  
  for (const issue of issues) {
    if (issue.status === 'returned') continue;
    
    const dueDate = parseISO(issue.dueDate);
    
    if (now > dueDate && issue.status !== 'overdue') {
      await updateIssue(issue.id, { status: 'overdue' });
      updated++;
    }
  }
  
  return updated;
}

// ==================== CONFIG OPERATIONS ====================

/**
 * Get configuration
 */
async function getConfig() {
  return await readData('config');
}

/**
 * Update configuration (Librarian only)
 */
async function updateConfig(updates) {
  const config = await getConfig();
  const updatedConfig = {
    ...config,
    ...updates
  };
  
  await writeData('config', updatedConfig);
  return updatedConfig;
}

// ==================== EXPORTS ====================

module.exports = {
  // Initialization
  initializeDatabase,
  
  // Generic operations
  readData,
  writeData,
  getNextId,
  
  // Books
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateBookStock,
  searchBooks,
  
  // Users
  getAllUsers,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  createUser,
  updateUser,
  validatePassword,
  incrementUserBookCount,
  decrementUserBookCount,
  addFineToUser,
  payUserFine,
  
  // Issues
  getAllIssues,
  getIssueById,
  getActiveIssuesByUser,
  getIssueHistory,
  getIssuesByBook,
  getOverdueIssues,
  createIssue,
  updateIssue,
  calculateFine,
  updateOverdueStatus,
  
  // Business Logic
  canUserBorrowBook,
  processBookIssue,
  processBookReturn,
  renewBook,
  
  // Config
  getConfig,
  updateConfig
};
