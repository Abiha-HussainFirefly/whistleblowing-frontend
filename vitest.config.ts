import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': src,
      '@assets': `${src}/assets`,
      '@components': `${src}/components`,
      '@config': `${src}/config`,
      '@features': `${src}/features`,
      '@hooks': `${src}/hooks`,
      '@layouts': `${src}/layouts`,
      '@lib': `${src}/lib`,
      '@pages': `${src}/pages`,
      '@routes': `${src}/routes`,
      '@store': `${src}/store`,
      '@styles': `${src}/styles`,
      '@types': `${src}/types`,
      '@validators': `${src}/validators`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
