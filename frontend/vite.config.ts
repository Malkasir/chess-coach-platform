import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',          // keep as-is if already working
  build: {
    outDir: 'dist',   // same
    target: 'es2021', // same
  },

  server: {
    proxy: {
      '/ws': {
        target: 'http://localhost:8080', // Spring Boot port
        ws: true,                        // also proxy the upgrade
        changeOrigin: true
      }
    }
  },

  optimizeDeps: {
    include: [
      'cm-chessboard/src/extensions/markers/Markers.js', 'sockjs-client'
    ]
  },
  define: {
    global: 'globalThis'     // replaces every `global` identifier at build time
  },

resolve: { dedupe: ['lit'] }

});
