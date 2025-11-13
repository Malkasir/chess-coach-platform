/**
 * Stockfish WebAssembly Worker
 *
 * This worker wraps the Stockfish chess engine and provides UCI (Universal Chess Interface)
 * communication between the main thread and the engine.
 *
 * Key features:
 * - Real Stockfish 17.1.0 WASM integration
 * - UCI protocol implementation
 * - MultiPV support for showing multiple best lines
 * - Asynchronous message passing
 *
 * DEPLOYMENT NOTE:
 * To complete the Stockfish integration, copy the appropriate Stockfish files to public/:
 *
 * Option 1 (Recommended - Lite Single-threaded, ~7MB):
 *   cp node_modules/stockfish/src/stockfish-17.1-lite-single-*.js public/stockfish.js
 *   cp node_modules/stockfish/src/stockfish-17.1-lite-single-*.wasm public/stockfish.wasm
 *
 * Option 2 (Stronger but larger, ~75MB, requires CORS):
 *   cp node_modules/stockfish/src/stockfish-17.1-8e4d048.js public/stockfish.js
 *   cp node_modules/stockfish/src/stockfish-17.1-8e4d048-part-*.wasm public/
 *
 * Then update the path below to: '/stockfish.js'
 */

// TODO: Update this path after copying Stockfish files to public/
// For now, this will use a placeholder URL (implementation pending deployment setup)
const stockfishPath = '/stockfish.js';  // Update after copying files to public/

// Types for structured communication
interface WorkerMessage {
  type: 'init' | 'command' | 'stop' | 'quit';
  command?: string;
}

interface WorkerResponse {
  type: 'output' | 'ready' | 'error';
  data: string;
}

// Initialize Stockfish engine
let engine: Worker | null = null;
let isInitializing = false;
let isEngineReady = false;

/**
 * Initialize the Stockfish engine
 * Loads the Stockfish WASM worker from the public directory
 */
function initEngine(): void {
  if (engine || isInitializing) {
    console.log('[StockfishWorker] Already initializing or initialized');
    return;
  }

  try {
    console.log('[StockfishWorker] Starting initialization, loading from:', stockfishPath);
    isInitializing = true;

    // Set a timeout to fall back to ready state if Stockfish doesn't respond
    // This allows the mock worker in the service to take over
    const loadTimeout = setTimeout(() => {
      if (!isEngineReady) {
        console.warn('[StockfishWorker] Stockfish not responding after 3s, signaling ready anyway (mock mode)');
        isEngineReady = true;
        isInitializing = false;
        const readyResponse: WorkerResponse = {
          type: 'ready',
          data: 'Stockfish timed out, using mock mode'
        };
        self.postMessage(readyResponse);
      }
    }, 3000);

    // Load Stockfish as a nested worker
    // NOTE: This requires stockfish files to be in the public directory
    console.log('[StockfishWorker] About to create Worker from:', stockfishPath);
    engine = new Worker(stockfishPath);
    console.log('[StockfishWorker] ✅ Worker object created successfully:', engine);
    console.log('[StockfishWorker] Worker type:', typeof engine, 'instanceof Worker:', engine instanceof Worker);
    console.log('[StockfishWorker] Now waiting for first message from nested engine...');

    // Set up message handler to receive UCI output from Stockfish
    engine.onmessage = (e: MessageEvent) => {
      const line = e.data;
      console.log('[StockfishWorker] Received from engine:', line);

      if (typeof line === 'string') {
        // Wait for first message from Stockfish to confirm it's loaded
        if (!isEngineReady) {
          clearTimeout(loadTimeout);
          isEngineReady = true;
          isInitializing = false;
          console.log('[StockfishWorker] Engine ready! Notifying service...');

          // Now that the nested engine is loaded, notify the service that we're ready
          const readyResponse: WorkerResponse = {
            type: 'ready',
            data: 'Stockfish engine loaded and ready'
          };
          self.postMessage(readyResponse);
        }

        // Forward all Stockfish output to the service
        const response: WorkerResponse = {
          type: 'output',
          data: line
        };
        self.postMessage(response);
      }
    };

    engine.onerror = (error: ErrorEvent) => {
      clearTimeout(loadTimeout);
      console.error('[StockfishWorker] ❌ ENGINE ERROR EVENT:', error);
      console.error('[StockfishWorker] ❌ Error details:', {
        message: error.message,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
        error: error.error,
        type: error.type,
        isTrusted: error.isTrusted
      });

      // Try to extract more details from the error object
      if (error.error) {
        console.error('[StockfishWorker] ❌ Nested error object:', error.error);
        if (error.error instanceof Error) {
          console.error('[StockfishWorker] ❌ Stack trace:', error.error.stack);
        }
      }

      // WASM "unreachable" errors are fatal - engine needs restart
      const errorMessage = error.message || '';
      const isFatalWasmError = errorMessage.includes('unreachable') || errorMessage.includes('RuntimeError');

      if (isFatalWasmError) {
        console.warn('[StockfishWorker] ⚠️ Fatal WASM error detected - engine crashed');
        // Terminate the crashed engine
        if (engine) {
          engine.terminate();
          engine = null;
        }
        isEngineReady = false;
        isInitializing = false;
      }

      isInitializing = false;

      // Signal ready anyway so mock mode can take over
      if (!isEngineReady) {
        isEngineReady = true;
        const readyResponse: WorkerResponse = {
          type: 'ready',
          data: 'Stockfish failed to load, using mock mode'
        };
        self.postMessage(readyResponse);
      }

      const errorResponse: WorkerResponse = {
        type: 'error',
        data: `Stockfish error: ${error.message || 'Unknown error'} at ${error.filename || 'unknown'}:${error.lineno || '?'}`
      };
      self.postMessage(errorResponse);
    };

  } catch (error) {
    console.error('[StockfishWorker] Failed to initialize:', error);
    isInitializing = false;

    // Signal ready anyway so mock mode can take over
    if (!isEngineReady) {
      isEngineReady = true;
      const readyResponse: WorkerResponse = {
        type: 'ready',
        data: 'Stockfish failed to initialize, using mock mode'
      };
      self.postMessage(readyResponse);
    }

    const errorResponse: WorkerResponse = {
      type: 'error',
      data: `Failed to initialize Stockfish: ${error instanceof Error ? error.message : String(error)}`
    };
    self.postMessage(errorResponse);
  }
}

/**
 * Send a UCI command to Stockfish
 */
function sendCommand(command: string): void {
  if (!engine) {
    const errorResponse: WorkerResponse = {
      type: 'error',
      data: 'Engine not initialized'
    };
    self.postMessage(errorResponse);
    return;
  }

  try {
    engine.postMessage(command);
  } catch (error) {
    const errorResponse: WorkerResponse = {
      type: 'error',
      data: `Failed to send command: ${error instanceof Error ? error.message : String(error)}`
    };
    self.postMessage(errorResponse);
  }
}

/**
 * Stop current analysis/search
 */
function stopEngine(): void {
  if (engine) {
    engine.postMessage('stop');
  }
}

/**
 * Terminate the engine
 */
function quitEngine(): void {
  if (engine) {
    engine.postMessage('quit');
    engine = null;
  }
}

/**
 * Main message handler for worker
 */
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, command } = e.data;
  console.log('[StockfishWorker] Received message:', { type, command });

  switch (type) {
    case 'init':
      console.log('[StockfishWorker] Init message received, calling initEngine()');
      initEngine();
      break;

    case 'command':
      if (command) {
        console.log('[StockfishWorker] Forwarding command to engine:', command);
        sendCommand(command);
      }
      break;

    case 'stop':
      console.log('[StockfishWorker] Stop command received');
      stopEngine();
      break;

    case 'quit':
      console.log('[StockfishWorker] Quit command received');
      quitEngine();
      break;

    default:
      console.error('[StockfishWorker] Unknown message type:', type);
      const errorResponse: WorkerResponse = {
        type: 'error',
        data: `Unknown message type: ${type}`
      };
      self.postMessage(errorResponse);
  }
};

// Export empty object to make this a module
export {};
