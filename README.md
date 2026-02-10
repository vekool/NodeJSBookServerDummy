# Angular Book Server - Mock API

A comprehensive Node.js Express server for testing the Angular Library Book Manager application. This server provides all necessary endpoints for books management, authentication, and error handling scenarios.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Running the Server

```bash
# Standard mode
npm start

# Development mode with auto-reload
npm run dev
```

The server will start at: **http://localhost:3000**

## 📋 API Endpoints

### Authentication Endpoints

#### 1. Login (POST /auth/login)
Accepts any username/password combination and returns a JWT token.

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin"
  }
}
```

#### 2. Logout (POST /auth/logout)
Invalidates the current token. Requires authentication.

**Request:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

#### 3. Verify Token (GET /auth/verify)
Verifies if the token is still valid.

**Request:**
```bash
curl http://localhost:3000/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "username": "admin"
  }
}
```

---

### Book Endpoints (Public)

#### 1. Get All Books (GET /posts)
Returns all books in the library.

**Request:**
```bash
curl http://localhost:3000/posts
```

**Response:**
```json
[
  {
    "userId": 1,
    "id": 1,
    "title": "The Great Gatsby",
    "body": "A classic American novel set in the Jazz Age..."
  },
  {
    "userId": 2,
    "id": 2,
    "title": "To Kill a Mockingbird",
    "body": "A gripping tale of racial injustice..."
  }
]
```

#### 2. Get Single Book (GET /posts/:id)
Returns a specific book by ID.

**Request:**
```bash
curl http://localhost:3000/posts/1
```

**Response:**
```json
{
  "userId": 1,
  "id": 1,
  "title": "The Great Gatsby",
  "body": "A classic American novel set in the Jazz Age..."
}
```

**Error Response (404):**
```json
{
  "error": "Book not found"
}
```

---

### Book Endpoints (Protected)

All protected endpoints require an Authorization header with a valid Bearer token.

#### 1. Create Book (POST /posts)
Creates a new book. **Requires authentication.**

**Request:**
```bash
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Book Title",
    "body": "Book description goes here",
    "userId": 1
  }'
```

**Response (201 Created):**
```json
{
  "userId": 1,
  "id": 11,
  "title": "New Book Title",
  "body": "Book description goes here"
}
```

#### 2. Update Book (PUT /posts/:id)
Updates an existing book completely. **Requires authentication.**

**Request:**
```bash
curl -X PUT http://localhost:3000/posts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "body": "Updated description",
    "userId": 1
  }'
```

**Response:**
```json
{
  "userId": 1,
  "id": 1,
  "title": "Updated Title",
  "body": "Updated description"
}
```

#### 3. Partially Update Book (PATCH /posts/:id)
Updates specific fields of a book. **Requires authentication.**

**Request:**
```bash
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Title Only"
  }'
```

#### 4. Delete Book (DELETE /posts/:id)
Deletes a book. **Requires authentication.**

**Request:**
```bash
curl -X DELETE http://localhost:3000/posts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response:**
```json
{
  "message": "Book deleted successfully",
  "id": 1
}
```

---

### Testing Endpoints

#### 1. Test 500 Error (GET /error/500)
Returns a 500 Internal Server Error for testing error handling.

**Request:**
```bash
curl http://localhost:3000/error/500
```

**Response:**
```json
{
  "error": "Internal server error"
}
```

#### 2. Test Timeout (GET /error/timeout)
Simulates a long-running request (30 seconds) for timeout testing.

#### 3. Reset Data (POST /reset)
Resets all books to initial state and clears all tokens.

**Request:**
```bash
curl -X POST http://localhost:3000/reset
```

**Response:**
```json
{
  "message": "Data reset successfully"
}
```

---

## 🎯 Testing Workflow

### 1. Test Public Endpoints (No Authentication)

```bash
# Get all books
curl http://localhost:3000/posts

# Get single book
curl http://localhost:3000/posts/1

# Try to create book without auth (should fail with 401)
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "body": "Test"}'
```

### 2. Test Authentication Flow

```bash
# Step 1: Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}'

# Save the token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Step 2: Use token for protected operations
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "New Book", "body": "Description"}'

# Step 3: Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Step 4: Try using old token (should fail)
curl http://localhost:3000/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Test CRUD Operations

```bash
# CREATE
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Book", "body": "Test Description", "userId": 1}'

# READ
curl http://localhost:3000/posts/11

# UPDATE
curl -X PUT http://localhost:3000/posts/11 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Book", "body": "Updated Description", "userId": 1}'

# DELETE
curl -X DELETE http://localhost:3000/posts/11 \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Test Error Scenarios

```bash
# 404 Not Found
curl http://localhost:3000/posts/9999

# 500 Server Error
curl http://localhost:3000/error/500

# 401 Unauthorized
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "body": "Test"}'

# 403 Invalid Token
curl -X POST http://localhost:3000/posts \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "body": "Test"}'
```

---

## 🔧 Configuration

### Port Configuration
Change the port in `server.js`:
```javascript
const PORT = 3000; // Change to your preferred port
```

### JWT Secret
Change the JWT secret in `server.js`:
```javascript
const SECRET_KEY = 'your-secret-key-for-jwt';
```

### Network Delay
Adjust simulated network delay:
```javascript
const simulateDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
```

---

## 📊 Data Model

### Book Object (API Post Format)
```typescript
{
  userId: number;    // Author ID (1-5)
  id: number;        // Unique book ID
  title: string;     // Book title
  body: string;      // Book description
}
```

### Angular Book Model (After Transformation)
```typescript
{
  id: number;
  title: string;
  author: string;        // Transform userId to "Author 1", etc.
  description: string;   // Map from body
  status: 'available' | 'reading' | 'read';
}
```

---

## 🔍 Angular Integration

### Environment Configuration
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

### BookService Example
```typescript
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:3000/posts';

  constructor(private http: HttpClient) {}

  getBooks(): Observable<Book[]> {
    return this.http.get<ApiPost[]>(this.apiUrl).pipe(
      map(posts => posts.map(this.transformToBook)),
      retry(1),
      catchError(this.handleError)
    );
  }

  private transformToBook(post: ApiPost): Book {
    return {
      id: post.id,
      title: post.title,
      author: `Author ${post.userId}`,
      description: post.body,
      status: 'available'
    };
  }
}
```

---

## 🧪 Testing Checklist

- [ ] Server starts successfully on port 3000
- [ ] Can access GET /posts without authentication
- [ ] Cannot access POST /posts without authentication (401)
- [ ] Login returns valid JWT token
- [ ] Protected endpoints work with valid token
- [ ] Protected endpoints fail with invalid token (403)
- [ ] Logout invalidates token
- [ ] GET /posts/:id returns 404 for non-existent books
- [ ] GET /error/500 returns 500 status code
- [ ] Console logs show all requests and headers
- [ ] CORS is enabled for Angular app communication

---

## 📝 Notes

1. **Mock Authentication**: The server accepts ANY username/password combination for testing purposes.
2. **In-Memory Storage**: All data is stored in memory and resets when the server restarts.
3. **CORS Enabled**: The server has CORS enabled to allow requests from Angular dev server (http://localhost:4200).
4. **Request Logging**: All requests are logged to the console with headers for debugging.
5. **Token Storage**: Tokens are tracked server-side for logout functionality.

---

## 🐛 Troubleshooting

### Issue: Cannot connect from Angular app
**Solution**: Ensure CORS is enabled and the server is running on the correct port.

### Issue: Token not working
**Solution**: Check that the Authorization header is formatted as: `Bearer <token>` (note the space after Bearer).

### Issue: Port already in use
**Solution**: Change the PORT constant in server.js or kill the process using that port.

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

---

## 📦 Dependencies

- **express**: Web framework
- **cors**: Enable CORS
- **body-parser**: Parse JSON request bodies
- **jsonwebtoken**: Generate and verify JWT tokens
- **nodemon**: Auto-restart during development (dev dependency)

---

## 🎓 Learning Resources

This server implements concepts for:
- RESTful API design
- JWT authentication
- HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Status codes (200, 201, 400, 401, 403, 404, 500)
- CORS configuration
- Request/Response middleware
- Error handling

---

## 📄 License

ISC

---

Happy Testing! 🚀📚
