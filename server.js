const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const RxJSSocketServer = require('./rxjs-socket-server');
const { router: rxjsRoutes, setSocketServer } = require('./rxjs-demo-routes');
const helpRoutes = require('./help-routes');

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

// Initialize RxJS Socket Server
const rxjsSocketServer = new RxJSSocketServer(io);
setSocketServer(rxjsSocketServer);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS)
app.use(express.static(__dirname));

// Mock data - Initial books (simulating JSONPlaceholder posts format)
//WHERE IS THIS USED, WHY IS IT HERE, WHAT WILL HAPPEN IF REMOVED
//WHAT ROLE DOES IT PLAY IN THE OVERALL PROJECT
let books = [
  {
    userId: 1,
    id: 1,
    title: "The Great Gatsby",
    body: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream."
  },
  {
    userId: 2,
    id: 2,
    title: "To Kill a Mockingbird",
    body: "A gripping tale of racial injustice and childhood innocence in the American South during the 1930s."
  },
  {
    userId: 1,
    id: 3,
    title: "1984",
    body: "A dystopian social science fiction novel exploring surveillance, propaganda, and totalitarianism."
  },
  {
    userId: 3,
    id: 4,
    title: "Pride and Prejudice",
    body: "A romantic novel of manners exploring issues of morality, education, and marriage in British society."
  },
  {
    userId: 2,
    id: 5,
    title: "The Catcher in the Rye",
    body: "A story about teenage rebellion and alienation, narrated by the iconic character Holden Caulfield."
  },
  {
    userId: 4,
    id: 6,
    title: "The Hobbit",
    body: "A fantasy novel following the quest of Bilbo Baggins, a hobbit who embarks on an epic adventure."
  },
  {
    userId: 3,
    id: 7,
    title: "Harry Potter and the Philosopher's Stone",
    body: "The beginning of a magical journey following a young wizard discovering his true identity and destiny."
  },
  {
    userId: 1,
    id: 8,
    title: "The Lord of the Rings",
    body: "An epic high-fantasy novel following the quest to destroy the One Ring and defeat the Dark Lord Sauron."
  },
  {
    userId: 5,
    id: 9,
    title: "Animal Farm",
    body: "An allegorical novella reflecting events leading up to the Russian Revolution and the Stalinist era."
  },
  {
    userId: 2,
    id: 10,
    title: "Brave New World",
    body: "A dystopian novel exploring a futuristic society driven by technological advancement and social conditioning."
  }
];

let nextId = 11;

// Mock users for authentication
const users = [
  { username: 'admin', password: 'admin123' },
  { username: 'user', password: 'user123' }
];

// Stored tokens (for logout functionality)
let validTokens = new Set();

// ==================== HELPER FUNCTIONS ====================

// Simulate network delay
const simulateDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generate JWT token
const generateToken = (username) => {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: '2h' });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null;
  }
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!validTokens.has(token)) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  req.user = decoded;
  next();
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

// ==================== AUTHENTICATION ENDPOINTS ====================

// Login endpoint
app.post('/auth/login', async (req, res) => {
  await simulateDelay(300);
  
  const { username, password } = req.body;

  // For testing purposes, accept any username/password
  // In production, you would verify against the users array
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const token = generateToken(username);
  validTokens.add(token);

  res.json({
    message: 'Login successful',
    token,
    user: { username }
  });
});

// Logout endpoint
app.post('/auth/logout', authenticateToken, async (req, res) => {
  await simulateDelay(200);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    validTokens.delete(token);
  }

  res.json({ message: 'Logout successful' });
});

// Verify token endpoint
app.get('/auth/verify', authenticateToken, async (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// ==================== BOOK ENDPOINTS (Public) ====================

// GET /books - Get all books
app.get('/books', async (req, res) => {
  await simulateDelay();
  res.json(books);
});

// GET /books/:id - Get single book
app.get('/books/:id', async (req, res) => {
  await simulateDelay();
  
  const id = parseInt(req.params.id);
  const book = books.find(b => b.id === id);
  
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  res.json(book);
});

// ==================== BOOK ENDPOINTS (Protected) ====================

// POST /books - Create new book (Protected)
app.post('/books', authenticateToken, async (req, res) => {
  await simulateDelay();
  
  const { title, body, userId } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }
  
  const newBook = {
    userId: userId || 1,
    id: nextId++,
    title,
    body
  };
  
  books.push(newBook);
  
  // Return 201 Created status
  res.status(201).json(newBook);
});

// PUT /books/:id - Update book (Protected)
app.put('/books/:id', authenticateToken, async (req, res) => {
  await simulateDelay();
  
  const id = parseInt(req.params.id);
  const { title, body, userId } = req.body;
  
  const bookIndex = books.findIndex(b => b.id === id);
  
  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  // Update book
  books[bookIndex] = {
    ...books[bookIndex],
    title: title || books[bookIndex].title,
    body: body || books[bookIndex].body,
    userId: userId || books[bookIndex].userId
  };
  
  res.json(books[bookIndex]);
});

// PATCH /books/:id - Partially update book (Protected)
app.patch('/books/:id', authenticateToken, async (req, res) => {
  await simulateDelay();
  
  const id = parseInt(req.params.id);
  const updates = req.body;
  
  const bookIndex = books.findIndex(b => b.id === id);
  
  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  // Partial update
  books[bookIndex] = {
    ...books[bookIndex],
    ...updates,
    id: books[bookIndex].id // Ensure id doesn't change
  };
  
  res.json(books[bookIndex]);
});

// DELETE /books/:id - Delete book (Protected)
app.delete('/books/:id', authenticateToken, async (req, res) => {
  await simulateDelay();
  
  const id = parseInt(req.params.id);
  
  const bookIndex = books.findIndex(b => b.id === id);
  
  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  books.splice(bookIndex, 1);
  
  res.json({ message: 'Book deleted successfully', id });
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
app.post('/reset', async (req, res) => {
  books = [
    {
      userId: 1,
      id: 1,
      title: "The Great Gatsby",
      body: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream."
    },
    {
      userId: 2,
      id: 2,
      title: "To Kill a Mockingbird",
      body: "A gripping tale of racial injustice and childhood innocence in the American South during the 1930s."
    },
    {
      userId: 1,
      id: 3,
      title: "1984",
      body: "A dystopian social science fiction novel exploring surveillance, propaganda, and totalitarianism."
    },
    {
      userId: 3,
      id: 4,
      title: "Pride and Prejudice",
      body: "A romantic novel of manners exploring issues of morality, education, and marriage in British society."
    },
    {
      userId: 2,
      id: 5,
      title: "The Catcher in the Rye",
      body: "A story about teenage rebellion and alienation, narrated by the iconic character Holden Caulfield."
    }
  ];
  nextId = 6;
  validTokens.clear();
  
  res.json({ message: 'Data reset successfully' });
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
  console.log('='.repeat(50));
  console.log('📚 Angular Book Server is running!');
  console.log('='.repeat(50));
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}`);
  console.log('');
  console.log('Available Endpoints:');
  console.log('');
  console.log('Documentation:');
  console.log('  GET    /                 - API Documentation (HTML)');
  console.log('');
  console.log('Authentication:');
  console.log('  POST   /auth/login       - Login (any username/password)');
  console.log('  POST   /auth/logout      - Logout (requires token)');
  console.log('  GET    /auth/verify      - Verify token');
  console.log('');
  console.log('Books (Public):');
  console.log('  GET    /books            - Get all books');
  console.log('  GET    /books/:id        - Get single book');
  console.log('');
  console.log('Books (Protected - requires Authorization header):');
  console.log('  POST   /books            - Create new book');
  console.log('  PUT    /books/:id        - Update book');
  console.log('  PATCH  /books/:id        - Partially update book');
  console.log('  DELETE /books/:id        - Delete book');
  console.log('');
  console.log('Testing:');
  console.log('  GET    /error/500        - Test 500 error');
  console.log('  GET    /error/timeout    - Test timeout');
  console.log('  POST   /reset            - Reset data to initial state');
  console.log('');
  console.log('RxJS Teaching (WebSocket Streams):');
  console.log('  GET    /rxjs/streams              - Get active streams');
  console.log('  POST   /rxjs/streams/start        - Start custom stream');
  console.log('  POST   /rxjs/streams/stop/:name   - Stop a stream');
  console.log('  POST   /rxjs/streams/stop-all     - Stop all streams');
  console.log('  GET    /rxjs/presets              - Get preset configurations');
  console.log('  POST   /rxjs/presets/:name        - Start preset stream');
  console.log('  GET    /rxjs/operators-guide      - RxJS operators guide');
  console.log('');
  console.log('Help & Documentation:');
  console.log('  GET    /help/sockets              - WebSocket & Socket.io guide');
  console.log('');
  console.log('Socket.io:');
  console.log('  📡 WebSocket Server: ws://localhost:' + PORT);
  console.log('  📺 Demo Page: http://localhost:' + PORT + '/rxjs-demo.html');
  console.log('');
  console.log('='.repeat(50));
  console.log('💡 Tip: All protected endpoints require Bearer token');
  console.log('   Example: Authorization: Bearer <your-token>');
  console.log('='.repeat(50));
});
