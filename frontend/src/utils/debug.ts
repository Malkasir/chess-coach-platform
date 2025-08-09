// Debug utility to gate console logs based on environment
const DEBUG = import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development';

export const debugLog = (...args: any[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};

export const debugError = (...args: any[]) => {
  if (DEBUG) {
    console.error(...args);
  }
};

export const debugWarn = (...args: any[]) => {
  if (DEBUG) {
    console.warn(...args);
  }
};