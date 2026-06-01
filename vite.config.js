import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 3000,
  },
  // Pre-bundle all frontend packages from node_modules to avoid CDN/importmap conflicts
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'zustand',
      'framer-motion',
      'lucide-react',
      'recharts',
      '@tanstack/react-query',
    ],
  },
});
