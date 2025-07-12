// web-dev-server.config.js
import { esbuildPlugin } from '@web/dev-server-esbuild';
// ↓ Uncomment these two lines only if you really want HMR
// import { hmrPlugin, presets } from '@open-wc/dev-server-hmr';
// const hmr = process.argv.includes('--hmr');

/** @type {import('@web/dev-server').DevServerConfig} */
export default {
  open: '/index.html',
  watch: true,                 // set false if you later add --hmr flag
  nodeResolve: {
    exportConditions: ['browser', 'development'],
  },
  plugins: [
    // hmr && hmrPlugin({ exclude: ['**/*/node_modules/**/*'], presets: [presets.lit] }),
    esbuildPlugin({ ts: true, target: 'es2020' }),
  ],
};
