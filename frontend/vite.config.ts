import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',          // keep as-is if already working
  build: {
    outDir: 'dist',   // same
    target: 'es2021', // same
  },
  optimizeDeps: {
    include: [
      'cm-chessboard/src/extensions/markers/Markers.js'
    ]
  }
});
