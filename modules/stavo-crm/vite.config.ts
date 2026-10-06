import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  base: '/stavo-crm/',
  root: resolvePath('./src/client'),
  plugins: [react()],
  resolve: {
    alias: {
      '@client': resolvePath('./src/client'),
      '@shared': resolvePath('./src/shared'),
      '@site-kit': resolvePath('./src/site-kit'),
      '@builder': resolvePath('./src/builder'),
    },
  },
  build: {
    outDir: resolvePath('./dist/client'),
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: false,
      },
    },
  },
});
