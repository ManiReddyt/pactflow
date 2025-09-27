import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for specific Node.js modules
      include: ['buffer', 'process', 'crypto', 'stream', 'util', 'path'],
      // Exclude Node.js modules that are not needed
      exclude: ['fs'],
      // Whether to polyfill `global` variable
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Whether to polyfill Node.js built-in modules
      protocolImports: true,
    }),
  ],
  base: process.env.NODE_ENV === 'production' ? '/todo-app/' : '/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
});
