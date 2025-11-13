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

/**
 * Initialize the Stockfish engine
 * Loads the Stockfish WASM worker from the public directory
 */
function initEngine(): void {
  if (engine || isInitializing) return;

  try {
    isInitializing = false;

    // Load Stockfish as a nested worker
    // NOTE: This requires stockfish files to be in the public directory
    engine = new Worker(stockfishPath);

    // Set up message handler to receive UCI output from Stockfish
    engine.onmessage = (e: MessageEvent) => {
      const line = e.data;
      if (typeof line === 'string') {
        const response: WorkerResponse = {
          type: 'output',
          data: line
        };
        self.postMessage(response);
      }
    };

    engine.onerror = (error: ErrorEvent) => {
      const errorResponse: WorkerResponse = {
        type: 'error',
        data: `Stockfish error: ${error.message}`
      };
      self.postMessage(errorResponse);
    };

    isInitializing = false;

    // Notify main thread that engine is ready
    const readyResponse: WorkerResponse = {
      type: 'ready',
      data: 'Stockfish engine initialized'
    };
    self.postMessage(readyResponse);

  } catch (error) {
    isInitializing = false;
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

  switch (type) {
    case 'init':
      initEngine();
      break;

    case 'command':
      if (command) {
        sendCommand(command);
      }
      break;

    case 'stop':
      stopEngine();
      break;

    case 'quit':
      quitEngine();
      break;

    default:
      const errorResponse: WorkerResponse = {
        type: 'error',
        data: `Unknown message type: ${type}`
      };
      self.postMessage(errorResponse);
  }
};

// Export empty object to make this a module
export {};
