/**
 * RxJS Teaching Socket Server
 * ===========================
 * Provides configurable WebSocket streams for teaching RxJS operators
 * 
 * Features:
 * - Two data streams: books and issues
 * - Configurable emission intervals
 * - Automatic stop after duration
 * - Error injection for teaching error handling
 * - Duplicate and out-of-order data for teaching operators
 */

class RxJSSocketServer {
  constructor(io) {
    this.io = io;
    this.activeStreams = new Map();
    this.streamConfigs = new Map();
    
    // Sample data pools
    this.bookTitles = [
      "The Midnight Library", "Project Hail Mary", "Dune Messiah",
      "Foundation's Edge", "The Way of Kings", "Name of the Wind",
      "Neuromancer", "Snow Crash", "Ready Player Two",
      "The Hobbit Returns", "Ender's Shadow", "Hyperion Cantos",
      "The Expanse: Leviathan", "Red Rising: Golden Son", "Mistborn: Shadows"
    ];
    
    this.issueTypes = [
      "borrowed", "returned", "renewed", "damaged", "lost", "reserved", "overdue"
    ];
    
    this.users = [
      "Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Prince",
      "Ethan Hunt", "Fiona Green", "George Wilson", "Hannah Lee"
    ];
    
    this.setupSocketHandlers();
  }
  
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`✓ Client connected: ${socket.id}`);
      
      // Send current stream configs to new client
      socket.emit('stream-configs', this.getStreamConfigs());
      
      socket.on('start-stream', (config) => {
        this.startStream(socket, config);
      });
      
      socket.on('stop-stream', (streamName) => {
        this.stopStream(streamName);
      });
      
      socket.on('get-configs', () => {
        socket.emit('stream-configs', this.getStreamConfigs());
      });
      
      socket.on('disconnect', () => {
        console.log(`✗ Client disconnected: ${socket.id}`);
      });
    });
  }
  
  getStreamConfigs() {
    const configs = {};
    this.streamConfigs.forEach((config, name) => {
      configs[name] = config;
    });
    return configs;
  }
  
  startStream(socket, config) {
    const {
      streamName = 'books',
      interval = 3000,        // ms between emissions
      duration = 120000,      // total duration (2 minutes default)
      errorRate = 0,          // 0-100: percentage chance of error
      duplicateRate = 0,      // 0-100: percentage chance of duplicate
      delayVariation = 0,     // ms: random delay variation (0-value)
      burstMode = false,      // emit in bursts
      burstSize = 3,          // items per burst
      burstInterval = 10000   // ms between bursts
    } = config;
    
    // Stop existing stream if running
    this.stopStream(streamName);
    
    console.log(`▶ ${streamName}: ${interval}ms interval, ${duration/1000}s duration`);
    
    this.streamConfigs.set(streamName, config);
    
    const startTime = Date.now();
    let emissionCount = 0;
    let lastEmittedData = null;
    
    const emitData = () => {
      const elapsed = Date.now() - startTime;
      
      // Check if duration exceeded
      if (elapsed >= duration) {
        console.log(`■ ${streamName}: ${emissionCount} emissions in ${(elapsed/1000).toFixed(1)}s`);
        this.stopStream(streamName);
        this.io.emit(`${streamName}-complete`, {
          streamName,
          totalEmissions: emissionCount,
          duration: elapsed
        });
        return;
      }
      
      // Check for error injection
      if (errorRate > 0 && Math.random() * 100 < errorRate) {
        this.io.emit(`${streamName}-error`, {
          error: 'Simulated error',
          message: 'Random error for teaching error handling operators',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Check for duplicate
      if (duplicateRate > 0 && Math.random() * 100 < duplicateRate && lastEmittedData) {
        this.io.emit(streamName, lastEmittedData);
        emissionCount++;
        return;
      }
      
      // Generate data
      const data = streamName === 'books' 
        ? this.generateBookData(emissionCount)
        : this.generateIssueData(emissionCount);
      
      lastEmittedData = data;
      
      // Apply delay variation
      const emitDelay = delayVariation > 0 
        ? Math.random() * delayVariation 
        : 0;
      
      setTimeout(() => {
        this.io.emit(streamName, data);
        emissionCount++;
      }, emitDelay);
    };
    
    let intervalId;
    
    if (burstMode) {
      // Burst mode: emit multiple items at once
      intervalId = setInterval(() => {
        for (let i = 0; i < burstSize; i++) {
          setTimeout(() => emitData(), i * 100); // Small delay between burst items
        }
      }, burstInterval);
    } else {
      // Normal mode: regular intervals
      intervalId = setInterval(emitData, interval);
      emitData(); // Emit first item immediately
    }
    
    this.activeStreams.set(streamName, {
      intervalId,
      config,
      startTime,
      emissionCount: () => emissionCount
    });
    
    socket.emit('stream-started', { streamName, config });
  }
  
  stopStream(streamName) {
    const stream = this.activeStreams.get(streamName);
    if (stream) {
      clearInterval(stream.intervalId);
      this.activeStreams.delete(streamName);
      this.streamConfigs.delete(streamName);
      this.io.emit('stream-stopped', { streamName });
    }
  }
  
  stopAllStreams() {
    this.activeStreams.forEach((stream, name) => {
      this.stopStream(name);
    });
  }
  
  generateBookData(index) {
    const id = 1000 + index;
    const title = this.bookTitles[Math.floor(Math.random() * this.bookTitles.length)];
    const randomSuffix = Math.floor(Math.random() * 100);
    
    return {
      id,
      title: `${title} #${randomSuffix}`,
      author: this.users[Math.floor(Math.random() * this.users.length)],
      isbn: `978-${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 100000000)}`,
      publishedYear: 2000 + Math.floor(Math.random() * 24),
      available: Math.random() > 0.3,
      timestamp: new Date().toISOString(),
      category: ['Fiction', 'Science', 'History', 'Technology', 'Fantasy'][Math.floor(Math.random() * 5)]
    };
  }
  
  generateIssueData(index) {
    const bookId = 1000 + Math.floor(Math.random() * index + 1); // Reference recent books
    const issueType = this.issueTypes[Math.floor(Math.random() * this.issueTypes.length)];
    
    return {
      id: 5000 + index,
      bookId,
      userId: Math.floor(Math.random() * 100) + 1,
      userName: this.users[Math.floor(Math.random() * this.users.length)],
      issueType,
      timestamp: new Date().toISOString(),
      dueDate: issueType === 'borrowed' 
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      fine: issueType === 'overdue' ? Math.floor(Math.random() * 50) + 5 : 0,
      notes: `${issueType} operation for book ${bookId}`
    };
  }
}

module.exports = RxJSSocketServer;
