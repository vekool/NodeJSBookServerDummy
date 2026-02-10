/**
 * RxJS Demo Routes
 * ================
 * HTTP endpoints to control socket streams for RxJS teaching
 */

const express = require('express');
const router = express.Router();

let socketServerInstance = null;

// Set the socket server instance
function setSocketServer(instance) {
  socketServerInstance = instance;
}

// ==================== STREAM CONTROL ENDPOINTS ====================

// Get all active streams and their configurations
router.get('/streams', (req, res) => {
  if (!socketServerInstance) {
    return res.status(503).json({ error: 'Socket server not initialized' });
  }
  
  const configs = socketServerInstance.getStreamConfigs();
  const activeStreams = Array.from(socketServerInstance.activeStreams.keys());
  
  res.json({
    activeStreams,
    configs,
    totalActive: activeStreams.length
  });
});

// Start a stream with custom configuration
router.post('/streams/start', (req, res) => {
  if (!socketServerInstance) {
    return res.status(503).json({ error: 'Socket server not initialized' });
  }
  
  const config = req.body;
  
  // Validate stream name
  if (!config.streamName) {
    return res.status(400).json({ error: 'streamName is required' });
  }
  
  socketServerInstance.startStream({ emit: () => {} }, config);
  
  res.json({
    message: 'Stream started',
    config
  });
});

// Stop a specific stream
router.post('/streams/stop/:streamName', (req, res) => {
  if (!socketServerInstance) {
    return res.status(503).json({ error: 'Socket server not initialized' });
  }
  
  const { streamName } = req.params;
  socketServerInstance.stopStream(streamName);
  
  res.json({
    message: 'Stream stopped',
    streamName
  });
});

// Stop all streams
router.post('/streams/stop-all', (req, res) => {
  if (!socketServerInstance) {
    return res.status(503).json({ error: 'Socket server not initialized' });
  }
  
  socketServerInstance.stopAllStreams();
  
  res.json({
    message: 'All streams stopped'
  });
});

// ==================== PRESET CONFIGURATIONS ====================

// Get preset configurations for teaching different operators
router.get('/presets', (req, res) => {
  res.json({
    presets: {
      basic: {
        name: 'Basic Stream',
        description: 'Simple stream for teaching map, filter, tap',
        books: {
          streamName: 'books',
          interval: 2000,
          duration: 60000
        },
        issues: {
          streamName: 'issues',
          interval: 3000,
          duration: 60000
        }
      },
      throttleDebounce: {
        name: 'Throttle vs Debounce',
        description: 'Fast bursts to demonstrate throttle/debounce',
        books: {
          streamName: 'books',
          interval: 500,
          duration: 60000,
          burstMode: true,
          burstSize: 5,
          burstInterval: 8000
        }
      },
      errorHandling: {
        name: 'Error Handling',
        description: 'Random errors for catchError, retry operators',
        books: {
          streamName: 'books',
          interval: 2000,
          duration: 90000,
          errorRate: 20
        }
      },
      distinctDuplicates: {
        name: 'Distinct & Duplicates',
        description: 'Duplicate data for distinctUntilChanged',
        books: {
          streamName: 'books',
          interval: 2000,
          duration: 60000,
          duplicateRate: 30
        }
      },
      combination: {
        name: 'Combination Operators',
        description: 'Two streams for combineLatest, merge, zip',
        books: {
          streamName: 'books',
          interval: 3000,
          duration: 120000
        },
        issues: {
          streamName: 'issues',
          interval: 2000,
          duration: 120000
        }
      },
      switching: {
        name: 'Switching Operators',
        description: 'Variable delays for switchMap, mergeMap, concatMap',
        books: {
          streamName: 'books',
          interval: 4000,
          duration: 90000,
          delayVariation: 2000
        },
        issues: {
          streamName: 'issues',
          interval: 1500,
          duration: 90000,
          delayVariation: 1000
        }
      },
      buffering: {
        name: 'Buffering & Windowing',
        description: 'Fast stream for buffer operators',
        books: {
          streamName: 'books',
          interval: 800,
          duration: 60000
        }
      },
      timing: {
        name: 'Timing Operators',
        description: 'Variable timing for delay, timeout, sample',
        books: {
          streamName: 'books',
          interval: 3000,
          duration: 120000,
          delayVariation: 3000
        }
      }
    }
  });
});

// Start a preset configuration
router.post('/presets/:presetName', (req, res) => {
  if (!socketServerInstance) {
    return res.status(503).json({ error: 'Socket server not initialized' });
  }
  
  const { presetName } = req.params;
  
  // Preset configurations (same as above)
  const presets = {
    basic: {
      books: { streamName: 'books', interval: 2000, duration: 60000 },
      issues: { streamName: 'issues', interval: 3000, duration: 60000 }
    },
    throttleDebounce: {
      books: { streamName: 'books', interval: 500, duration: 60000, burstMode: true, burstSize: 5, burstInterval: 8000 }
    },
    errorHandling: {
      books: { streamName: 'books', interval: 2000, duration: 90000, errorRate: 20 }
    },
    distinctDuplicates: {
      books: { streamName: 'books', interval: 2000, duration: 60000, duplicateRate: 30 }
    },
    combination: {
      books: { streamName: 'books', interval: 3000, duration: 120000 },
      issues: { streamName: 'issues', interval: 2000, duration: 120000 }
    },
    switching: {
      books: { streamName: 'books', interval: 4000, duration: 90000, delayVariation: 2000 },
      issues: { streamName: 'issues', interval: 1500, duration: 90000, delayVariation: 1000 }
    },
    buffering: {
      books: { streamName: 'books', interval: 800, duration: 60000 }
    },
    timing: {
      books: { streamName: 'books', interval: 3000, duration: 120000, delayVariation: 3000 }
    }
  };
  
  const preset = presets[presetName];
  
  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }
  
  // Start all streams in the preset
  Object.values(preset).forEach(config => {
    socketServerInstance.startStream({ emit: () => {} }, config);
  });
  
  res.json({
    message: `Preset '${presetName}' started`,
    preset
  });
});

// ==================== INFO ENDPOINTS ====================

// Get information about available operators and what to teach
router.get('/operators-guide', (req, res) => {
  res.json({
    operators: {
      creation: {
        description: 'Create observables from various sources',
        operators: ['timer', 'interval', 'fromEvent', 'of', 'from'],
        teaching: 'Use socket connection as fromEvent source',
        demonstration: {
          code: `
// In Angular component:
import { fromEvent } from 'rxjs';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Create Observable from socket event
const books$ = fromEvent(socket, 'books');
books$.subscribe(book => console.log(book));`,
          explanation: "fromEvent converts socket events into Observable streams. Each time the server emits 'books', the Observable emits that data.",
          useCase: "Foundation for all socket-based streams. Every socket event becomes a reactive stream.",
          presetToUse: "basic"
        }
      },
      
      transformation: {
        description: 'Transform emitted values',
        operators: ['map', 'pluck', 'mapTo', 'scan', 'reduce'],
        teaching: 'Transform book/issue data structures',
        demonstration: {
          map: {
            code: `
books$.pipe(
  map(book => ({
    id: book.id,
    title: book.title.toUpperCase(),
    year: book.publishedYear
  }))
).subscribe(transformed => console.log(transformed));`,
            explanation: "map transforms each emitted value. Here we extract specific fields and uppercase the title.",
            useCase: "Reshape data, extract properties, perform calculations on each emission."
          },
          
          scan: {
            code: `
books$.pipe(
  scan((allBooks, newBook) => [...allBooks, newBook], [])
).subscribe(bookList => console.log('Total books:', bookList.length));`,
            explanation: "scan accumulates values over time like Array.reduce. It emits accumulated result on each emission.",
            useCase: "Build collections, count items, calculate running totals, maintain state."
          },
          
          pluck: {
            code: `
books$.pipe(
  pluck('title')
).subscribe(title => console.log(title));`,
            explanation: "pluck extracts a single nested property from each emission.",
            useCase: "Quickly extract specific fields without full map function."
          },
          
          presetToUse: "basic"
        }
      },
      
      filtering: {
        description: 'Filter which values to emit',
        operators: ['filter', 'take', 'takeUntil', 'takeWhile', 'skip', 'first', 'last', 'distinctUntilChanged', 'distinct'],
        teaching: 'Filter books by category, take first N emissions',
        demonstration: {
          filter: {
            code: `
books$.pipe(
  filter(book => book.category === 'Fiction')
).subscribe(fictionBook => console.log(fictionBook));`,
            explanation: "filter only emits values that pass the condition. Others are ignored.",
            useCase: "Show only available books, specific categories, items matching criteria."
          },
          
          take: {
            code: `
books$.pipe(
  take(5)
).subscribe(book => console.log('First 5:', book));`,
            explanation: "take emits only first N values, then completes. Perfect for limiting results.",
            useCase: "Get first few items, sample data, limit API calls."
          },
          
          distinctUntilChanged: {
            code: `
books$.pipe(
  map(book => book.category),
  distinctUntilChanged()
).subscribe(category => console.log('Category changed:', category));`,
            explanation: "distinctUntilChanged only emits when value differs from previous emission.",
            useCase: "Detect changes, eliminate consecutive duplicates. Use duplicateRate config to test!",
            presetToUse: "distinctDuplicates"
          },
          
          skip: {
            code: `
books$.pipe(
  skip(3),
  take(5)
).subscribe(book => console.log('Items 4-8:', book));`,
            explanation: "skip ignores first N emissions, then emits normally. Often combined with take.",
            useCase: "Pagination, skip initial load, ignore startup values."
          },
          
          presetToUse: "basic"
        }
      },
      
      rateLimit: {
        description: 'Control emission rate',
        operators: ['throttleTime', 'debounceTime', 'auditTime', 'sampleTime'],
        teaching: 'Use fast bursts to show throttle vs debounce differences',
        demonstration: {
          throttleTime: {
            code: `
books$.pipe(
  throttleTime(2000)
).subscribe(book => console.log('Throttled:', book));`,
            explanation: "throttleTime emits first value, then ignores emissions for specified duration. Good for limiting rapid events.",
            behavior: "Emits IMMEDIATELY on first event, then blocks for 2000ms",
            useCase: "Button clicks, scroll events, API rate limiting. Prevents spam.",
            presetToUse: "throttleDebounce"
          },
          
          debounceTime: {
            code: `
books$.pipe(
  debounceTime(2000)
).subscribe(book => console.log('Debounced:', book));`,
            explanation: "debounceTime waits for emissions to stop for specified duration before emitting last value.",
            behavior: "Waits 2000ms of SILENCE, then emits most recent value",
            useCase: "Search input, auto-save, waiting for user to finish typing.",
            difference: "throttle emits first & blocks, debounce waits & emits last",
            presetToUse: "throttleDebounce"
          },
          
          auditTime: {
            code: `
books$.pipe(
  auditTime(2000)
).subscribe(book => console.log('Audited:', book));`,
            explanation: "auditTime emits most recent value at end of each interval.",
            behavior: "Waits 2000ms, then emits latest value in that window",
            useCase: "Periodic sampling, rate limiting with latest data.",
            presetToUse: "throttleDebounce"
          },
          
          sampleTime: {
            code: `
books$.pipe(
  sampleTime(2000)
).subscribe(book => console.log('Sampled:', book));`,
            explanation: "sampleTime emits latest value at fixed intervals.",
            behavior: "Every 2000ms, emit current value (if any)",
            useCase: "Regular polling, dashboard updates, monitoring.",
            presetToUse: "throttleDebounce"
          }
        }
      },
      
      combination: {
        description: 'Combine multiple observables',
        operators: ['combineLatest', 'merge', 'concat', 'zip', 'withLatestFrom', 'forkJoin'],
        teaching: 'Combine books and issues streams',
        demonstration: {
          combineLatest: {
            code: `
combineLatest([books$, issues$]).pipe(
  map(([book, issue]) => ({
    book: book.title,
    issue: issue.issueType,
    timestamp: new Date()
  }))
).subscribe(combined => console.log(combined));`,
            explanation: "combineLatest emits whenever ANY source emits, combining latest values from all sources.",
            behavior: "Waits for all streams to emit at least once, then emits on every emission",
            useCase: "Form validation (all fields valid?), dashboard with multiple data sources.",
            presetToUse: "combination"
          },
          
          merge: {
            code: `
merge(books$, issues$).subscribe(
  item => console.log('Either stream:', item)
);`,
            explanation: "merge combines multiple streams into one, emitting from whichever fires.",
            behavior: "Emits immediately when any source emits, maintains all types",
            useCase: "Multiple event sources, unified notification stream.",
            presetToUse: "combination"
          },
          
          zip: {
            code: `
zip(books$, issues$).subscribe(
  ([book, issue]) => console.log('Pair:', book, issue)
);`,
            explanation: "zip pairs emissions by index - first with first, second with second, etc.",
            behavior: "Waits for corresponding emission from all streams before emitting pair",
            useCase: "Synchronize streams, parallel processing, matching related data.",
            presetToUse: "combination"
          },
          
          withLatestFrom: {
            code: `
issues$.pipe(
  withLatestFrom(books$),
  map(([issue, book]) => ({ issue, latestBook: book }))
).subscribe(result => console.log(result));`,
            explanation: "withLatestFrom emits when source emits, including latest value from secondary stream.",
            behavior: "Primary stream drives emissions, secondary provides context",
            useCase: "Add context from another stream, user actions with current state.",
            presetToUse: "combination"
          }
        }
      },
      
      flattening: {
        description: 'Flatten higher-order observables',
        operators: ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap'],
        teaching: 'Fetch book details when issue emits (by bookId)',
        demonstration: {
          switchMap: {
            code: `
issues$.pipe(
  switchMap(issue => 
    this.http.get(\`/books/\${issue.bookId}\`)
  )
).subscribe(bookDetails => console.log(bookDetails));`,
            explanation: "switchMap cancels previous inner observable when new emission arrives. Only latest matters.",
            behavior: "CANCELS previous request if new one arrives",
            useCase: "Search autocomplete, user navigation, latest request wins.",
            warning: "Cancels in-flight requests! Not suitable for save operations.",
            presetToUse: "switching"
          },
          
          mergeMap: {
            code: `
issues$.pipe(
  mergeMap(issue => 
    this.http.get(\`/books/\${issue.bookId}\`)
  )
).subscribe(bookDetails => console.log(bookDetails));`,
            explanation: "mergeMap runs all inner observables concurrently. Doesn't cancel anything.",
            behavior: "Runs ALL requests in parallel, order not guaranteed",
            useCase: "Parallel API calls, batch processing, independent operations.",
            presetToUse: "switching"
          },
          
          concatMap: {
            code: `
issues$.pipe(
  concatMap(issue => 
    this.http.get(\`/books/\${issue.bookId}\`)
  )
).subscribe(bookDetails => console.log(bookDetails));`,
            explanation: "concatMap queues inner observables, waits for each to complete before starting next.",
            behavior: "Runs requests ONE AT A TIME in order",
            useCase: "Sequential operations, maintain order, save transactions.",
            presetToUse: "switching"
          },
          
          exhaustMap: {
            code: `
issues$.pipe(
  exhaustMap(issue => 
    this.http.get(\`/books/\${issue.bookId}\`)
  )
).subscribe(bookDetails => console.log(bookDetails));`,
            explanation: "exhaustMap ignores new emissions while inner observable is active.",
            behavior: "IGNORES new emissions until current completes",
            useCase: "Prevent duplicate submissions, login requests, debounce actions.",
            presetToUse: "switching"
          },
          
          comparison: {
            switchMap: "Latest wins - cancels previous",
            mergeMap: "All run - parallel execution",
            concatMap: "Sequential - queue and wait",
            exhaustMap: "Block - ignore while busy"
          }
        }
      },
      
      errorHandling: {
        description: 'Handle errors gracefully',
        operators: ['catchError', 'retry', 'retryWhen'],
        teaching: 'Use errorRate config to inject errors',
        demonstration: {
          catchError: {
            code: `
books$.pipe(
  map(book => {
    if (!book.title) throw new Error('Invalid book');
    return book;
  }),
  catchError(err => {
    console.error('Error:', err);
    return of({ error: true, message: err.message });
  })
).subscribe(result => console.log(result));`,
            explanation: "catchError catches errors and returns a new observable. Stream continues.",
            behavior: "Catches error, stream doesn't die, returns fallback observable",
            useCase: "Graceful degradation, error recovery, user-friendly error messages.",
            presetToUse: "errorHandling"
          },
          
          retry: {
            code: `
books$.pipe(
  map(book => {
    if (Math.random() < 0.3) throw new Error('Random error');
    return book;
  }),
  retry(3)
).subscribe(
  book => console.log('Success:', book),
  err => console.error('Failed after 3 retries:', err)
);`,
            explanation: "retry resubscribes to source observable N times on error.",
            behavior: "Attempts operation up to N times before propagating error",
            useCase: "Network requests, transient failures, API retries.",
            presetToUse: "errorHandling"
          },
          
          retryWhen: {
            code: `
books$.pipe(
  retryWhen(errors => 
    errors.pipe(
      delay(2000),
      take(3)
    )
  )
).subscribe(book => console.log(book));`,
            explanation: "retryWhen allows custom retry logic with delays and conditions.",
            behavior: "Retry with exponential backoff, conditional retry, limited attempts",
            useCase: "Smart retry, exponential backoff, conditional error recovery.",
            presetToUse: "errorHandling"
          }
        }
      },
      
      utility: {
        description: 'Utility operators',
        operators: ['tap', 'delay', 'delayWhen', 'timeout', 'finalize', 'share', 'shareReplay'],
        teaching: 'Log with tap, add delays, handle timeouts',
        demonstration: {
          tap: {
            code: `
books$.pipe(
  tap(book => console.log('Before:', book)),
  map(book => book.title.toUpperCase()),
  tap(title => console.log('After:', title))
).subscribe(title => console.log('Final:', title));`,
            explanation: "tap performs side effects without modifying stream. Perfect for debugging.",
            behavior: "Doesn't transform data, just observes it",
            useCase: "Logging, debugging, analytics, triggering side effects.",
            presetToUse: "basic"
          },
          
          delay: {
            code: `
books$.pipe(
  delay(2000)
).subscribe(book => console.log('Delayed 2s:', book));`,
            explanation: "delay delays each emission by specified time.",
            behavior: "Shifts entire stream forward in time",
            useCase: "Animations, simulated latency, staggered displays.",
            presetToUse: "timing"
          },
          
          timeout: {
            code: `
books$.pipe(
  timeout(5000)
).subscribe(
  book => console.log(book),
  err => console.error('Timeout! No emission in 5s')
);`,
            explanation: "timeout errors if no emission within specified time.",
            behavior: "Throws error if silence exceeds duration",
            useCase: "Detect stalled streams, API timeouts, SLA monitoring.",
            presetToUse: "timing"
          },
          
          share: {
            code: `
const shared$ = books$.pipe(
  tap(() => console.log('Fetch')),
  share()
);

shared$.subscribe(b => console.log('Sub1:', b));
shared$.subscribe(b => console.log('Sub2:', b));
// Only ONE 'Fetch' log despite two subscriptions`,
            explanation: "share multicasts source observable to multiple subscribers.",
            behavior: "Single execution shared among all subscribers",
            useCase: "Prevent duplicate HTTP requests, share expensive operations.",
            presetToUse: "basic"
          },
          
          shareReplay: {
            code: `
const cached$ = books$.pipe(
  shareReplay(1)
);

cached$.subscribe(b => console.log('Sub1:', b));
setTimeout(() => {
  cached$.subscribe(b => console.log('Sub2 gets last value:', b));
}, 5000);`,
            explanation: "shareReplay shares stream AND replays last N emissions to new subscribers.",
            behavior: "Caches last N values, replays to late subscribers",
            useCase: "Cache HTTP responses, state management, late subscribers need data.",
            presetToUse: "basic"
          },
          
          finalize: {
            code: `
books$.pipe(
  take(5),
  finalize(() => console.log('Stream completed or errored'))
).subscribe(book => console.log(book));`,
            explanation: "finalize executes callback when observable completes or errors.",
            behavior: "Cleanup logic, runs on complete OR error",
            useCase: "Cleanup, close connections, release resources, logging.",
            presetToUse: "basic"
          }
        }
      },
      
      buffering: {
        description: 'Collect emissions',
        operators: ['bufferTime', 'bufferCount', 'buffer', 'windowTime', 'windowCount'],
        teaching: 'Use fast interval to collect emissions in buffers',
        demonstration: {
          bufferTime: {
            code: `
books$.pipe(
  bufferTime(5000)
).subscribe(booksBatch => 
  console.log('Batch of', booksBatch.length, 'books')
);`,
            explanation: "bufferTime collects emissions for specified time, then emits array.",
            behavior: "Emits array of values collected over time period",
            useCase: "Batch processing, bulk API calls, analytics aggregation.",
            presetToUse: "buffering"
          },
          
          bufferCount: {
            code: `
books$.pipe(
  bufferCount(3)
).subscribe(booksBatch => 
  console.log('Every 3 books:', booksBatch)
);`,
            explanation: "bufferCount collects N emissions, then emits array and starts new buffer.",
            behavior: "Emits array every N items",
            useCase: "Pagination, chunked processing, batch operations.",
            presetToUse: "buffering"
          },
          
          windowTime: {
            code: `
books$.pipe(
  windowTime(5000),
  mergeMap(window$ => window$.pipe(
    reduce((count, book) => count + 1, 0)
  ))
).subscribe(count => console.log('Books in window:', count));`,
            explanation: "windowTime creates Observable of Observables - each window is an observable.",
            behavior: "Like bufferTime but emits observable instead of array",
            useCase: "Complex windowing logic, nested processing, real-time analytics.",
            presetToUse: "buffering"
          }
        }
      }
    }
  });
});

module.exports = {
  router,
  setSocketServer
};
