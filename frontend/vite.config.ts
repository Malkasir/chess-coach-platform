import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2021',
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      'cm-chessboard/src/extensions/markers/Markers.js'
    ]
  }
});
