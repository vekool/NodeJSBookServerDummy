/**
 * Help & Documentation Routes
 * ============================
 * Educational resources about WebSockets and Socket.io
 */

const express = require('express');
const router = express.Router();

// ==================== WEBSOCKETS EDUCATIONAL ENDPOINT ====================

router.get('/sockets', (req, res) => {
  res.json({
    title: "WebSockets & Socket.io - Complete Guide",
    
    introduction: {
      whatAreWebSockets: "WebSockets provide a persistent, bidirectional communication channel between a client and server over a single TCP connection. Unlike traditional HTTP requests (which are request-response based), WebSockets allow real-time, full-duplex communication where both client and server can send messages independently at any time.",
      
      whyUseWebSockets: [
        "Real-time updates: Push data from server to client instantly without polling",
        "Bidirectional: Both client and server can initiate communication",
        "Lower latency: No need to establish new connections for each request",
        "Efficient: Reduced overhead compared to HTTP polling or long-polling",
        "Persistent connection: Stays open for continuous data flow"
      ],
      
      realWorldUseCases: [
        "Chat applications (instant messaging)",
        "Live sports scores and updates",
        "Real-time collaboration tools (Google Docs, Figma)",
        "Stock trading platforms with live price updates",
        "Multiplayer online games",
        "Live notifications and alerts",
        "IoT device monitoring dashboards",
        "Live streaming application controls"
      ]
    },
    
    technicalConcepts: {
      howWebSocketsWork: {
        description: "WebSockets establish connection through an HTTP upgrade handshake",
        steps: [
          "1. Client sends HTTP request with 'Upgrade: websocket' header",
          "2. Server responds with HTTP 101 (Switching Protocols) if it supports WebSockets",
          "3. Connection is upgraded from HTTP to WebSocket protocol (ws:// or wss://)",
          "4. Both parties can now send messages freely over the persistent connection",
          "5. Either party can close the connection when done"
        ]
      },
      
      protocolDetails: {
        standardHTTP: "ws:// (WebSocket) - equivalent to http://",
        secureHTTP: "wss:// (WebSocket Secure) - equivalent to https://",
        defaultPorts: {
          ws: 80,
          wss: 443
        }
      },
      
      vsTraditionalApproaches: {
        httpPolling: {
          description: "Client repeatedly requests server at intervals",
          pros: ["Simple to implement", "Works with standard HTTP"],
          cons: ["High latency", "Wasted bandwidth on empty responses", "Server load from constant requests"]
        },
        longPolling: {
          description: "Client requests and server holds connection until data is available",
          pros: ["Lower latency than polling", "Works with HTTP"],
          cons: ["Still creates new connection per response", "Complexity in handling timeouts"]
        },
        serverSentEvents: {
          description: "One-way communication from server to client over HTTP",
          pros: ["Simple for server-to-client updates", "Built on HTTP"],
          cons: ["Unidirectional only", "Limited by HTTP connection limits"]
        },
        webSockets: {
          description: "Full-duplex bidirectional persistent connection",
          pros: ["True bidirectional", "Low latency", "Efficient", "Full-duplex communication"],
          cons: ["Requires support from both client and server", "Proxy/firewall complications"]
        }
      }
    },
    
    socketIO: {
      whatIsSocketIO: "Socket.io is a JavaScript library that provides a high-level abstraction over WebSockets with additional features like automatic reconnection, fallback options, room/namespace support, and broadcasting capabilities. It works in both browser (client-side) and Node.js (server-side).",
      
      whyUseSocketIO: [
        "Automatic reconnection: Handles connection drops gracefully",
        "Fallback mechanisms: Uses long-polling if WebSockets unavailable",
        "Broadcasting: Send messages to multiple clients easily",
        "Rooms and Namespaces: Organize clients into groups",
        "Binary support: Send binary data efficiently",
        "Acknowledgements: Confirm message receipt",
        "Cross-browser compatibility: Works everywhere",
        "Simple API: Easier than raw WebSocket API"
      ],
      
      coreFeatures: {
        events: {
          description: "Socket.io uses event-driven communication",
          example: "Instead of sending raw messages, you emit named events with data",
          benefit: "Makes code more organized and easier to understand"
        },
        rooms: {
          description: "Group clients into rooms for targeted broadcasting",
          useCase: "Chat rooms, game lobbies, department-specific notifications"
        },
        namespaces: {
          description: "Create separate communication channels on same connection",
          useCase: "Separate admin panel from user application, multiple apps on same server"
        },
        acknowledgements: {
          description: "Callback-based confirmation that message was received",
          useCase: "Ensure critical data was delivered successfully"
        },
        middleware: {
          description: "Intercept connections and messages for authentication/logging",
          useCase: "Authenticate users before allowing socket connection"
        }
      }
    },
    
    architectureAndFlow: {
      serverSide: {
        setup: "Create HTTP server, attach Socket.io to it, listen for 'connection' events",
        responsibilities: [
          "Accept incoming connections",
          "Emit events to connected clients",
          "Listen for events from clients",
          "Manage rooms and namespaces",
          "Handle disconnections",
          "Broadcast to multiple clients"
        ]
      },
      
      clientSide: {
        setup: "Import socket.io-client library, connect to server using io()",
        responsibilities: [
          "Establish connection to server",
          "Emit events to server",
          "Listen for events from server",
          "Handle connection/disconnection",
          "Manage reconnection logic"
        ]
      },
      
      messageFlow: [
        "1. Client establishes connection to server",
        "2. Server emits 'connection' event with socket object",
        "3. Both sides can emit custom events with data",
        "4. Both sides listen for specific events and handle them",
        "5. Data flows bidirectionally in real-time",
        "6. Connection remains open until explicitly closed"
      ]
    },
    
    rxjsIntegration: {
      whyCombineWithRxJS: "RxJS (Reactive Extensions for JavaScript) is perfect for handling streams of data from WebSockets. Socket events naturally fit the Observable pattern - they emit values over time that you can transform, filter, and combine.",
      
      benefits: [
        "Treat socket events as Observable streams",
        "Apply RxJS operators (map, filter, debounce, etc.) to socket data",
        "Combine multiple socket streams using combineLatest, merge, zip",
        "Handle errors gracefully with catchError, retry",
        "Control emission rate with throttle, debounce",
        "Clean up subscriptions automatically",
        "Compose complex async logic declaratively"
      ],
      
      commonPatterns: {
        fromEvent: "Convert socket events to Observables using fromEvent or custom Observable",
        operators: {
          map: "Transform incoming socket data",
          filter: "Only process certain messages",
          switchMap: "Fetch related data when socket emits (e.g., get book details when issue emits)",
          merge: "Combine multiple socket streams into one",
          combineLatest: "Get latest values from multiple sockets together",
          debounceTime: "Wait for pause in rapid socket emissions",
          throttleTime: "Limit rate of processing socket messages",
          catchError: "Handle socket errors gracefully",
          retry: "Automatically reconnect on errors",
          shareReplay: "Share socket connection among multiple subscribers"
        }
      },
      
      thisProjectExample: {
        description: "This server provides two socket streams (books and issues) for teaching RxJS operators",
        booksStream: "Emits book creation events with configurable timing",
        issuesStream: "Emits book issue/return events linked to books by ID",
        teachingGoals: [
          "Show how to handle real-time data streams",
          "Demonstrate combination operators (books + issues)",
          "Practice error handling with injected errors",
          "Learn rate limiting with configurable emission intervals",
          "Understand flattening operators (fetch book when issue emits)"
        ]
      }
    },
    
    implementation: {
      serverSetup: {
        description: "How this project implements Socket.io",
        files: {
          "server.js": "Main server file - creates HTTP server and attaches Socket.io",
          "rxjs-socket-server.js": "Socket server class managing stream emissions",
          "rxjs-demo-routes.js": "HTTP routes to control socket streams"
        },
        architecture: "Hybrid approach: HTTP endpoints control socket behavior, sockets stream data"
      },
      
      streamConfiguration: {
        description: "Streams are highly configurable for teaching purposes",
        parameters: {
          streamName: "Name of the stream (books, issues, custom)",
          interval: "Milliseconds between emissions",
          duration: "Total duration stream runs (auto-stops)",
          errorRate: "Percentage chance of error (0-100) for teaching error handling",
          duplicateRate: "Percentage chance of duplicate data (0-100) for distinctUntilChanged",
          delayVariation: "Random delay variation for realistic timing",
          burstMode: "Emit multiple items at once for throttle/debounce teaching",
          burstSize: "Number of items per burst",
          burstInterval: "Time between bursts"
        }
      },
      
      angularIntegration: {
        description: "How to consume these sockets in Angular",
        steps: [
          "1. Install socket.io-client: npm install socket.io-client",
          "2. Create a service to manage socket connection",
          "3. Convert socket events to Observables",
          "4. Use RxJS operators to transform/combine streams",
          "5. Subscribe in components to display data",
          "6. Clean up subscriptions in ngOnDestroy"
        ],
        
        exampleServiceStructure: {
          connection: "io('http://localhost:3001')",
          booksObservable: "fromEvent(socket, 'books').pipe(/* operators */)",
          issuesObservable: "fromEvent(socket, 'issues').pipe(/* operators */)",
          combinedStream: "combineLatest([books$, issues$]).pipe(/* process both */)"
        }
      }
    },
    
    bestPractices: {
      performance: [
        "Use rooms/namespaces to limit message scope",
        "Avoid sending large payloads - send IDs and fetch details",
        "Implement rate limiting on server to prevent abuse",
        "Clean up event listeners to prevent memory leaks",
        "Use binary data for large transfers",
        "Consider message queuing for high traffic"
      ],
      
      security: [
        "Always use wss:// (secure WebSocket) in production",
        "Authenticate connections - verify user identity",
        "Validate all incoming data - never trust client",
        "Implement rate limiting per connection",
        "Use CORS properly to restrict origins",
        "Add timeout mechanisms to prevent hanging connections",
        "Log and monitor socket usage for anomalies"
      ],
      
      reliability: [
        "Handle disconnection gracefully in client",
        "Implement automatic reconnection with backoff",
        "Show connection status to users",
        "Queue messages during disconnection",
        "Use acknowledgements for critical messages",
        "Monitor connection health",
        "Have fallback mechanisms"
      ],
      
      scalability: [
        "Use Redis adapter for multi-server deployments",
        "Load balance WebSocket connections properly (sticky sessions)",
        "Monitor connection count and set limits",
        "Consider using a message broker (RabbitMQ, Kafka) for high volume",
        "Implement horizontal scaling with shared state",
        "Use connection pooling",
        "Cache frequently accessed data"
      ]
    },
    
    debugging: {
      commonIssues: [
        {
          issue: "Connection fails immediately",
          causes: ["Server not running", "Wrong URL/port", "CORS blocking", "Firewall blocking"],
          solutions: ["Check server is running", "Verify URL matches server", "Configure CORS on server", "Check network/firewall rules"]
        },
        {
          issue: "Events not received",
          causes: ["Event name mismatch", "Not listening before emit", "Connection dropped"],
          solutions: ["Verify event names match exactly", "Set up listeners before emitting", "Check connection status"]
        },
        {
          issue: "Memory leaks",
          causes: ["Not removing event listeners", "Not unsubscribing from Observables"],
          solutions: ["Remove listeners on disconnect", "Unsubscribe in ngOnDestroy", "Use takeUntil pattern"]
        },
        {
          issue: "Performance degradation",
          causes: ["Too many connections", "Large message payloads", "No rate limiting"],
          solutions: ["Implement connection limits", "Reduce payload size", "Add server-side throttling"]
        }
      ],
      
      tools: [
        "Chrome DevTools Network tab - Monitor WebSocket frames",
        "Socket.io debug mode - Enable with DEBUG=socket.io:* environment variable",
        "Browser console - Log all events for debugging",
        "Wireshark - Deep packet inspection",
        "Socket.io Admin UI - Monitor connections and rooms"
      ]
    },
    
    furtherLearning: {
      officialDocs: "https://socket.io/docs/",
      rxjsDocs: "https://rxjs.dev/",
      webSocketSpec: "https://datatracker.ietf.org/doc/html/rfc6455",
      tutorials: [
        "Build a real-time chat application",
        "Create a collaborative drawing board",
        "Implement live notifications system",
        "Make a multiplayer game",
        "Build a dashboard with live metrics"
      ]
    },
    
    thisServerEndpoints: {
      description: "Available endpoints in this project for RxJS teaching",
      httpEndpoints: {
        "GET /rxjs/streams": "Get currently active streams and their configs",
        "POST /rxjs/streams/start": "Start a custom stream with specific configuration",
        "POST /rxjs/streams/stop/:name": "Stop a specific stream",
        "POST /rxjs/streams/stop-all": "Stop all running streams",
        "GET /rxjs/presets": "Get preset stream configurations",
        "POST /rxjs/presets/:name": "Start a preset configuration",
        "GET /rxjs/operators-guide": "Get guide on which operators to teach"
      },
      
      socketEvents: {
        client_to_server: {
          "start-stream": "Client requests to start a stream with config",
          "stop-stream": "Client requests to stop a stream",
          "get-configs": "Client requests current stream configs"
        },
        server_to_client: {
          "books": "Book data emission",
          "books-error": "Error in books stream",
          "books-complete": "Books stream completed",
          "issues": "Issue data emission",
          "issues-error": "Error in issues stream",
          "issues-complete": "Issues stream completed",
          "stream-started": "Confirmation that stream started",
          "stream-stopped": "Notification that stream stopped",
          "stream-configs": "Current stream configurations"
        }
      }
    }
  });
});

module.exports = router;
