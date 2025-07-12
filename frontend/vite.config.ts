import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',          // your existing frontend folder
  build: {
    outDir: 'dist',   // matches Netlify publish dir
    target: 'es2021'
  }
});
