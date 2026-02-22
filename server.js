const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const RxJSSocketServer = require('./rxjs-socket-server');
const { router: rxjsRoutes, setSocketServer } = require('./rxjs-demo-routes');
const helpRoutes = require('./help-routes');

// Import database and new routes
const db = require('./database');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const issueRoutes = require('./routes/issue.routes');
const fineRoutes = require('./routes/fine.routes');
const bookRoutes = require('./routes/book.routes');
const statsRoutes = require('./routes/stats.routes');
const { clearAllTokens, authenticateToken, requireLibrarian } = require('./middleware/auth.middleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = 3001;
const SECRET_KEY = 'your-secret-key-for-jwt';

// Initialize database
db.initializeDatabase().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

// Initialize RxJS Socket Server
const rxjsSocketServer = new RxJSSocketServer(io);
setSocketServer(rxjsSocketServer);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS)
app.use(express.static(__dirname));

// ==================== API v2 ROUTES ====================

// Mount v2 API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/stats', statsRoutes);

// ==================== HELPER FUNCTIONS ====================

// Simulate network delay
const simulateDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// ==================== ROOT ENDPOINT ====================

// Serve API documentation as default page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/api-documentation.html');
});

// ==================== RXJS DEMO ROUTES ====================

// Mount RxJS demo routes under /rxjs prefix
app.use('/rxjs', rxjsRoutes);

// ==================== HELP ENDPOINTS ====================

// Socket.io comprehensive guide
app.get('/help/sockets', (req, res) => {
  res.json({
    title: "WebSocket & Socket.io Guide for RxJS Teaching",
    overview: {
      description: "WebSockets provide full-duplex communication channels over a single TCP connection, enabling real-time, bidirectional data flow between client and server. Socket.io is a library that simplifies WebSocket implementation with automatic fallbacks, reconnection, and room management.",
      realTime: "Unlike HTTP's request-response pattern, WebSockets maintain an open connection, allowing the server to push data to clients instantly without polling.",
      useCase: "Perfect for teaching RxJS because socket events naturally map to Observable streams - each socket event becomes an observable that emits data over time."
    },
    
    howItWorks: {
      connection: {
        step1: "Client initiates WebSocket handshake with server via HTTP upgrade request",
        step2: "Server accepts and upgrades connection to WebSocket protocol",
        step3: "Persistent bidirectional connection established",
        step4: "Both client and server can send messages at any time"
      },
      socketIo: {
        events: "Socket.io uses named events (like 'books', 'issues') that clients can listen to",
        rooms: "Supports broadcasting to specific groups of clients (rooms/namespaces)",
        acknowledgments: "Can request confirmation that messages were received",
        reconnection: "Automatically reconnects if connection is lost",
        fallbacks: "Falls back to long-polling if WebSocket unavailable"
      }
    },
    
    rxjsIntegration: {
      concept: "Socket events are event emitters that perfectly align with Observable patterns",
      mapping: {
        socketEvent: "socket.on('books', callback)",
        observable: "fromEvent(socket, 'books')",
        explanation: "Each socket event becomes an Observable stream that emits values over time"
      },
      advantages: [
        "Real-time data streams demonstrate reactive programming naturally",
        "Async events help understand timing operators (throttle, debounce, delay)",
        "Multiple streams (books + issues) perfect for combination operators",
        "Error and completion events map directly to Observable lifecycle",
        "Backpressure handling teaches real-world stream management"
      ]
    },
    
    thisImplementation: {
      architecture: {
        server: "Express HTTP server upgraded to support Socket.io",
        streams: "Two independent data streams: 'books' and 'issues'",
        configuration: "Fully configurable emission rates, durations, error rates",
        control: "RESTful API to start/stop streams with custom settings"
      },
      
      dataFlow: {
        trigger: "HTTP POST to /rxjs/streams/start or /rxjs/presets/:name",
        emission: "Server emits data at configured intervals via Socket.io",
        reception: "Angular client receives via fromEvent or socket.on()",
        transformation: "Apply RxJS operators to transform the stream",
        display: "Subscribe and render results in UI"
      },
      
      configOptions: {
        interval: "Milliseconds between emissions (100-60000ms)",
        duration: "Total stream lifetime (0 = infinite)",
        errorRate: "Percentage chance of emitting error (0-100%)",
        duplicateRate: "Percentage chance of duplicate data (0-100%)",
        delayVariation: "Random delay variation for timing demos",
        burstMode: "Emit multiple items rapidly for throttle/debounce",
        burstSize: "Items per burst when in burst mode",
        burstInterval: "Milliseconds between bursts"
      }
    },
    
    teachingWithSockets: {
      advantages: [
        "Students see real-time data flowing - more engaging than static examples",
        "Can pause, resume, and reconfigure streams to demonstrate different scenarios",
        "Two correlated streams (books + issues) show real-world relationships",
        "Error injection teaches error handling without breaking code",
        "Variable timing demonstrates race conditions and async complexity",
        "Visual feedback helps understand operator behavior instantly"
      ],
      
      lessonPlan: {
        beginner: "Start with basic stream, use map/filter/tap to transform data",
        intermediate: "Introduce throttle/debounce with burst mode, show practical differences",
        advanced: "Combine both streams with combineLatest/merge/switchMap to join data",
        expert: "Add error handling, retry logic, and backpressure management"
      }
    },
    
    angularExample: {
      service: `
// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { fromEvent, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3001');
  }

  // Convert socket event to Observable
  on<T>(eventName: string): Observable<T> {
    return fromEvent(this.socket, eventName);
  }

  // Emit event to server
  emit(eventName: string, data: any): void {
    this.socket.emit(eventName, data);
  }
}`,
      
      component: `
// rxjs-demo.component.ts  
import { Component, OnInit } from '@angular/core';
import { SocketService } from './socket.service';
import { map, filter, throttleTime, combineLatest } from 'rxjs/operators';

@Component({...})
export class RxjsDemoComponent implements OnInit {
  books$ = this.socket.on<Book>('books');
  issues$ = this.socket.on<Issue>('issues');

  constructor(private socket: SocketService) {}

  ngOnInit() {
    // Example 1: Basic transformation
    this.books$.pipe(
      map(book => ({ ...book, titleUpper: book.title.toUpperCase() }))
    ).subscribe(book => console.log(book));

    // Example 2: Filtering
    this.books$.pipe(
      filter(book => book.available)
    ).subscribe(book => console.log('Available:', book));

    // Example 3: Throttling
    this.books$.pipe(
      throttleTime(2000)
    ).subscribe(book => console.log('Throttled:', book));

    // Example 4: Combining streams
    combineLatest([this.books$, this.issues$]).pipe(
      map(([book, issue]) => ({ book, issue }))
    ).subscribe(combined => console.log(combined));
  }
}`,
      
      http: `
// Start a stream from Angular
this.http.post('http://localhost:3001/rxjs/presets/basic', {}).subscribe();

// Stop all streams
this.http.post('http://localhost:3001/rxjs/streams/stop-all', {}).subscribe();`
    },
    
    commonPatterns: {
      pattern1: {
        name: "Transform incoming data",
        operator: "map",
        example: "books$.pipe(map(book => book.title))"
      },
      pattern2: {
        name: "Filter specific events",
        operator: "filter",
        example: "books$.pipe(filter(book => book.category === 'Fiction'))"
      },
      pattern3: {
        name: "Rate limiting",
        operator: "throttleTime / debounceTime",
        example: "books$.pipe(throttleTime(1000))"
      },
      pattern4: {
        name: "Combine multiple streams",
        operator: "combineLatest",
        example: "combineLatest([books$, issues$])"
      },
      pattern5: {
        name: "Fetch related data",
        operator: "switchMap",
        example: "issues$.pipe(switchMap(issue => this.http.get(`/books/${issue.bookId}`)))"
      },
      pattern6: {
        name: "Error handling",
        operator: "catchError / retry",
        example: "books$.pipe(catchError(err => of({ error: true })))"
      },
      pattern7: {
        name: "Accumulate state",
        operator: "scan",
        example: "books$.pipe(scan((acc, book) => [...acc, book], []))"
      }
    },
    
    troubleshooting: {
      cors: "If connection fails from Angular, ensure CORS is enabled (already configured)",
      port: "Default port is 3001 - ensure it's not blocked by firewall",
      reconnection: "Socket.io auto-reconnects - watch browser console for connection status",
      multipleListen: "Don't subscribe multiple times to same socket event - use share() or shareReplay()",
      memoryLeaks: "Always unsubscribe in ngOnDestroy to prevent memory leaks"
    },
    
    resources: {
      socketIo: "https://socket.io/docs/",
      rxjs: "https://rxjs.dev/guide/overview",
      rxjsOperators: "https://rxjs.dev/guide/operators",
      angular: "https://angular.io/guide/observables"
    }
  });
});

// Mount help routes under /help prefix
app.use('/help', helpRoutes);

// ==================== LEGACY ENDPOINTS (Backward Compatibility) ====================

// These endpoints maintain the original API contract for existing student projects
// New projects should use /api/* endpoints

// ==================== AUTHENTICATION ENDPOINTS (Legacy) ====================

// Login endpoint - redirects to v2
app.post('/auth/login', async (req, res) => {
  await simulateDelay(300);
  
  // Delegate to the auth routes handler
  const authRoutes = require('./routes/auth.routes');
  // Call the v2 login logic
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Find user by username or email
    let user = await db.getUserByUsername(username);
    if (!user) {
      user = await db.getUserByEmail(username);
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }
    
    // Validate password
    const isValidPassword = await db.validatePassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    const { generateToken, addToken } = require('./middleware/auth.middleware');
    const token = generateToken(userWithoutPassword);
    addToken(token);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        username: user.username // Legacy format
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint - redirects to v2
app.post('/auth/logout', authenticateToken, async (req, res) => {
  await simulateDelay(200);
  const { removeToken } = require('./middleware/auth.middleware');
  removeToken(req.token);
  res.json({ message: 'Logout successful' });
});

// Verify token endpoint - redirects to v2
app.get('/auth/verify', authenticateToken, async (req, res) => {
  res.json({ 
    valid: true, 
    user: { username: req.user.username } // Legacy format
  });
});

// ==================== BOOK ENDPOINTS (Legacy - Backward Compatible) ====================

// GET /books - Get all books (returns compatible format)
app.get('/books', async (req, res) => {
  await simulateDelay();
  try {
    const books = await db.getAllBooks();
    
    // Return in original format for backward compatibility
    const compatibleBooks = books.map(book => ({
      userId: book.userId,
      id: book.id,
      title: book.title,
      body: book.body
    }));
    
    res.json(compatibleBooks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET /books/:id - Get single book (returns compatible format)
app.get('/books/:id', async (req, res) => {
  await simulateDelay();
  try {
    const book = await db.getBookById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Return in original format for backward compatibility
    res.json({
      userId: book.userId,
      id: book.id,
      title: book.title,
      body: book.body
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// POST /books - Create new book (Protected)
app.post('/books', authenticateToken, async (req, res) => {
  await simulateDelay();
  try {
    const { title, body, userId } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    
    const newBook = await db.createBook({
      title,
      body,
      userId: userId || 1,
      addedBy: req.user.username
    });
    
    // Return in original format for backward compatibility
    res.status(201).json({
      userId: newBook.userId,
      id: newBook.id,
      title: newBook.title,
      body: newBook.body
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// PUT /books/:id - Update book (Protected)
app.put('/books/:id', authenticateToken, async (req, res) => {
  await simulateDelay();
  try {
    const { title, body, userId } = req.body;
    
    const updates = {};
    if (title) updates.title = title;
    if (body) updates.body = body;
    if (userId) updates.userId = userId;
    
    const updatedBook = await db.updateBook(req.params.id, updates);
    
    // Return in original format for backward compatibility
    res.json({
      userId: updatedBook.userId,
      id: updatedBook.id,
      title: updatedBook.title,
      body: updatedBook.body
    });
  } catch (error) {
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// PATCH /books/:id - Partially update book (Protected)
app.patch('/books/:id', authenticateToken, async (req, res) => {
  await simulateDelay();
  try {
    const updates = {};
    const { title, body, userId } = req.body;
    
    if (title !== undefined) updates.title = title;
    if (body !== undefined) updates.body = body;
    if (userId !== undefined) updates.userId = userId;
    
    const updatedBook = await db.updateBook(req.params.id, updates);
    
    // Return in original format for backward compatibility
    res.json({
      userId: updatedBook.userId,
      id: updatedBook.id,
      title: updatedBook.title,
      body: updatedBook.body
    });
  } catch (error) {
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE /books/:id - Delete book (Protected)
app.delete('/books/:id', authenticateToken, async (req, res) => {
  await simulateDelay();
  try {
    await db.deleteBook(req.params.id);
    res.json({ message: 'Book deleted successfully', id: parseInt(req.params.id) });
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

// ==================== TESTING ENDPOINTS ====================

// Endpoint to test 500 error
app.get('/error/500', (req, res) => {
  res.status(500).json({ error: 'Internal server error' });
});

// Endpoint to test network timeout (takes too long)
app.get('/error/timeout', async (req, res) => {
  await simulateDelay(30000); // 30 seconds
  res.json({ message: 'This should timeout' });
});

// Reset data endpoint (for testing)
app.post('/reset', authenticateToken, requireLibrarian, async (req, res) => {
  try {
    // Re-run the seed script to reset database
    const seedDatabase = require('./scripts/seed-database');
    await seedDatabase();
    
    res.json({ 
      message: 'Database reset successfully',
      info: 'All data has been reset to seed values'
    });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// ==================== SERVER START ====================

server.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('📚 Angular Book Server v2.0 - Library Management System');
  console.log('='.repeat(70));
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}`);
  console.log('');
  console.log('=== LEGACY API (Backward Compatible) ===');
  console.log('');
  console.log('Authentication:');
  console.log('  POST   /auth/login              - Login (redirects to v2)');
  console.log('  POST   /auth/logout             - Logout (requires token)');
  console.log('  GET    /auth/verify             - Verify token');
  console.log('');
  console.log('Books:');
  console.log('  GET    /books                   - Get all books (compatible format)');
  console.log('  GET    /books/:id               - Get single book');
  console.log('  POST   /books                   - Create book (protected)');
  console.log('  PUT    /books/:id               - Update book (protected)');
  console.log('  PATCH  /books/:id               - Partial update (protected)');
  console.log('  DELETE /books/:id               - Delete book (protected)');
  console.log('');
  console.log('=== V2 API (New Features) ===');
  console.log('');
  console.log('Authentication (/api/auth):');
  console.log('  POST   /api/auth/register       - Register new user');
  console.log('  POST   /api/auth/login          - Login with hashed password');
  console.log('  POST   /api/auth/logout         - Logout (protected)');
  console.log('  GET    /api/auth/profile        - Get user profile (protected)');
  console.log('  PUT    /api/auth/profile        - Update profile (protected)');
  console.log('  PUT    /api/auth/change-password - Change password (protected)');
  console.log('');
  console.log('Book Management (/api/books):');
  console.log('  GET    /api/books               - Get all books with full details');
  console.log('  GET    /api/books/search        - Search books');
  console.log('  GET    /api/books/categories    - Get categories');
  console.log('  GET    /api/books/available     - Get available books');
  console.log('  POST   /api/books/create        - Create book (librarian only)');
  console.log('  PUT    /api/books/:id           - Update book (librarian only)');
  console.log('  DELETE /api/books/:id           - Delete book (librarian only)');
  console.log('');
  console.log('Issue Management (/api/issues):');
  console.log('  GET    /api/issues              - Get all issues (librarian)');
  console.log('  GET    /api/issues/my           - Get my issues (protected)');
  console.log('  GET    /api/issues/:id          - Get issue details');
  console.log('  POST   /api/issues              - Borrow book (protected)');
  console.log('  PUT    /api/issues/:id/return   - Return book (protected)');
  console.log('  PUT    /api/issues/:id/renew    - Renew book (protected)');
  console.log('');
  console.log('Fine Management (/api/fines):');
  console.log('  GET    /api/fines/user/:userId  - Get user fines');
  console.log('  GET    /api/fines/my            - Get my fines (protected)');
  console.log('  POST   /api/fines/:issueId/pay  - Pay fine (protected)');
  console.log('');
  console.log('User Management (/api/users) - Librarian Only:');
  console.log('  GET    /api/users               - Get all users');
  console.log('  GET    /api/users/:id           - Get user details');
  console.log('  PUT    /api/users/:id/activate  - Activate user');
  console.log('  PUT    /api/users/:id/deactivate - Deactivate user');
  console.log('  DELETE /api/users/:id           - Delete user');
  console.log('');
  console.log('Statistics (/api/stats) - Librarian Only:');
  console.log('  GET    /api/stats/dashboard     - Dashboard statistics');
  console.log('  GET    /api/reports/overdue     - Overdue books report');
  console.log('  GET    /api/reports/popular     - Popular books report');
  console.log('  GET    /api/reports/user-activity - User activity report');
  console.log('');
  console.log('=== TESTING & UTILITIES ===');
  console.log('');
  console.log('  GET    /error/500               - Test 500 error');
  console.log('  GET    /error/timeout           - Test timeout');
  console.log('  POST   /reset                   - Reset database (librarian only)');
  console.log('');
  console.log('=== RxJS Teaching (WebSocket Streams) ===');
  console.log('');
  console.log('  GET    /rxjs/streams            - Get active streams');
  console.log('  POST   /rxjs/streams/start      - Start custom stream');
  console.log('  POST   /rxjs/streams/stop/:name - Stop a stream');
  console.log('  POST   /rxjs/streams/stop-all   - Stop all streams');
  console.log('  GET    /rxjs/presets            - Get preset configurations');
  console.log('  POST   /rxjs/presets/:name      - Start preset stream');
  console.log('  GET    /rxjs/operators-guide    - RxJS operators guide');
  console.log('  GET    /help/sockets            - WebSocket & Socket.io guide');
  console.log('  📺 Demo: http://localhost:' + PORT + '/rxjs-demo.html');
  console.log('');
  console.log('='.repeat(70));
  console.log('💡 Authentication:');
  console.log('   - Protected endpoints require Bearer token');
  console.log('   - Example: Authorization: Bearer <your-token>');
  console.log('');
  console.log('🔐 Default Users:');
  console.log('   - Librarian: admin / admin123');
  console.log('   - Users: user1, user2, user3 / user123');
  console.log('');
  console.log('📊 Database:');
  console.log('   - JSON files in ./data/ directory');
  console.log('   - Auto-seeded with 10 books and 4 users');
  console.log('='.repeat(70));
});
