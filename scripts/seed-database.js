/**
 * Database Initialization Script
 * Seeds the database with initial data for testing
 */

const db = require('../database');
const bcrypt = require('bcryptjs');

// Initial books data (keeping existing structure + new fields)
const initialBooks = [
  {
    userId: 1,
    id: 1,
    title: "The Great Gatsby",
    body: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.",
    isbn: "978-0-7432-7356-5",
    category: "Fiction",
    publishedYear: 1925,
    totalCopies: 5,
    availableCopies: 5,
    issuedCopies: 0,
    coverImage: "",
    addedBy: "admin",
    addedDate: new Date().toISOString()
  },
  {
    userId: 2,
    id: 2,
    title: "To Kill a Mockingbird",
    body: "A gripping tale of racial injustice and childhood innocence in the American South during the 1930s.",
    isbn: "978-0-06-112008-4",
    category: "Fiction",
    publishedYear: 1960,
    totalCopies: 4,
    availableCopies: 4,
    issuedCopies: 0,
    coverImage: "",
    addedBy: "admin",
    addedDate: new Date().toISOString()
  },
  {
    userId: 1,
    id: 3,
    title: "1984",
    body: "A dystopian social science fiction novel exploring surveillance, propaganda, and totalitarianism.",
    isbn: "978-0-452-28423-4",
    category: "Science Fiction",
    publishedYear: 1949,
    totalCopies: 6,
    availableCopies: 6,
    issuedCopies: 0,
    coverImage: "",
    addedBy: "admin",
    addedDate: new Date().toISOString()
  },
  {
    userId: 3,
    id: 4,
    title: "Pride and Prejudice",
    body: "A romantic novel of manners exploring issues of morality, education, and marriage in British society.",
    isbn: "978-0-14-143951-8",
    category: "Romance",
    publishedYear: 1813,
    totalCopies: 3,
    availableCopies: 3,
    issuedCopies: 0,
    coverImage: "",
    addedBy: "admin",
    addedDate: new Date().toISOString()
  },
  {
    userId: 2,
    id: 5,
    title: "The Catcher in the Rye",
    body: "A story about teenage rebellion and alienation, narrated by the iconic character Holden Caulfield.",
    isbn: "978-0-316-76948-0",
    category: "Fiction",
    publishedYear: 1951,
    totalCopies: 4,
    availableCopies: 4,
    issuedCopies: 0,
    coverImage: "",
    addedBy: "admin",
    addedDate: new Date().toISOString()
  },
  {
    userId: 4,
    id: 6,
    title: "The Hobbit",
    body: "A fantasy novel following the quest of Bilbo Baggins, a hobbit who embarks on an epic adventure.",
    isbn: "978-0-547-92822-7",
    category: "Fantasy",
    publishedYear: 1937,
    totalCopies: 5,
    availableCopies: 5,
    issuedCopies: 0,
    coverImage: "",
    addedBy: "admin",
    addedDate: new Date().toISOString()
  },
  {
    userId: 3,
    id: 7,
    title: "Harry Potter and the Philosopher's Stone",
    body: "The beginning of a magical journey following a young wizard discovering his true identity and destiny.",
    isbn: "978-0-439-70818-8",
    category: "Fantasy",
    publishedYear: 1997,
    totalCopies: 7,
    availableCopies: 7,
    issuedCopies: 0,
    coverImage: "",
    addedBy: "admin",
    addedDate: new Date().toISOString()
  },
  {
    userId: 1,
    id: 8,
    title: "The Lord of the Rings",
    body: "An epic high-fantasy novel following the quest to destroy the One Ring and defeat the Dark Lord Sauron.",
    isbn: "978-0-618-64561-5",
    category: "Fantasy",
    publishedYear: 1954,
    totalCopies: 4,
    availableCopies: 4,
    issuedCopies: 0,
    coverImage: "",
    addedBy: "admin",
    addedDate: new Date().toISOString()
  },
  {
    userId: 5,
    id: 9,
    title: "Animal Farm",
    body: "An allegorical novella reflecting events leading up to the Russian Revolution and the Stalinist era.",
    isbn: "978-0-452-28424-1",
    category: "Political Fiction",
    publishedYear: 1945,
    totalCopies: 5,
    availableCopies: 5,
    issuedCopies: 0,
    coverImage: "",
    addedBy: "admin",
    addedDate: new Date().toISOString()
  },
  {
    userId: 2,
    id: 10,
    title: "Brave New World",
    body: "A dystopian novel exploring a futuristic society driven by technological advancement and social conditioning.",
    isbn: "978-0-06-085052-4",
    category: "Science Fiction",
    publishedYear: 1932,
    totalCopies: 4,
    availableCopies: 4,
    issuedCopies: 0,
    coverImage: "",
    addedBy: "admin",
    addedDate: new Date().toISOString()
  }
];

// Initial users (with pre-hashed passwords for speed)
async function getInitialUsers() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);
  
  return [
    {
      id: 100,
      username: "admin",
      email: "admin@library.com",
      password: adminPassword,
      fullName: "Library Administrator",
      role: "librarian",
      phone: "+1-555-0100",
      address: "123 Library Street, Book City",
      joinDate: new Date().toISOString(),
      isActive: true,
      maxBooksAllowed: 10,
      currentBooksCount: 0,
      totalFines: 0,
      paidFines: 0,
      membershipExpiry: new Date('2027-12-31').toISOString()
    },
    {
      id: 101,
      username: "user1",
      email: "user1@example.com",
      password: userPassword,
      fullName: "John Smith",
      role: "user",
      phone: "+1-555-0101",
      address: "456 Reader Lane, Book City",
      joinDate: new Date().toISOString(),
      isActive: true,
      maxBooksAllowed: 3,
      currentBooksCount: 0,
      totalFines: 0,
      paidFines: 0,
      membershipExpiry: new Date('2027-12-31').toISOString()
    },
    {
      id: 102,
      username: "user2",
      email: "user2@example.com",
      password: userPassword,
      fullName: "Jane Doe",
      role: "user",
      phone: "+1-555-0102",
      address: "789 Novel Avenue, Book City",
      joinDate: new Date().toISOString(),
      isActive: true,
      maxBooksAllowed: 3,
      currentBooksCount: 0,
      totalFines: 0,
      paidFines: 0,
      membershipExpiry: new Date('2027-12-31').toISOString()
    },
    {
      id: 103,
      username: "user3",
      email: "user3@example.com",
      password: userPassword,
      fullName: "Bob Johnson",
      role: "user",
      phone: "+1-555-0103",
      address: "321 Story Boulevard, Book City",
      joinDate: new Date().toISOString(),
      isActive: true,
      maxBooksAllowed: 3,
      currentBooksCount: 0,
      totalFines: 0,
      paidFines: 0,
      membershipExpiry: new Date('2027-12-31').toISOString()
    }
  ];
}

// Initial empty issues (can be populated manually for testing)
const initialIssues = [];

/**
 * Seed the database
 */
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Initialize database structure
    await db.initializeDatabase();
    
    // Seed books
    console.log('📚 Seeding books...');
    const booksData = {
      books: initialBooks,
      nextId: 11
    };
    await db.writeData('books', booksData);
    console.log(`✓ Added ${initialBooks.length} books\n`);
    
    // Seed users
    console.log('👥 Seeding users...');
    const users = await getInitialUsers();
    const usersData = {
      users: users,
      nextId: 104
    };
    await db.writeData('users', usersData);
    console.log(`✓ Added ${users.length} users`);
    console.log('   - admin / admin123 (Librarian)');
    console.log('   - user1 / user123 (User)');
    console.log('   - user2 / user123 (User)');
    console.log('   - user3 / user123 (User)\n');
    
    // Seed issues
    console.log('📋 Seeding issues...');
    const issuesData = {
      issues: initialIssues,
      nextId: 1000
    };
    await db.writeData('issues', issuesData);
    console.log(`✓ Added ${initialIssues.length} issues (empty for now)\n`);
    
    // Config is auto-created by initializeDatabase
    const config = await db.getConfig();
    console.log('⚙️  Configuration:');
    console.log(`   - Max books per user: ${config.library.maxBooksPerUser}`);
    console.log(`   - Issue duration: ${config.library.issueDurationDays} days`);
    console.log(`   - Fine rate: $${config.fines.perDayRate}/day`);
    console.log(`   - Max fine per book: $${config.fines.maxFinePerBook}`);
    console.log(`   - Grace period: ${config.fines.gracePeriodDays} day(s)\n`);
    
    console.log('✅ Database seeded successfully!');
    console.log('\n🚀 You can now start the server with: npm start\n');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, initialBooks, getInitialUsers };
