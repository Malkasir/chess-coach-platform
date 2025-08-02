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
  server: {
    proxy: {
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: [
      'cm-chessboard/src/extensions/markers/Markers.js',
      'sockjs-client'
    ]
  },
  resolve: { 
    dedupe: ['lit'] 
  }
});
