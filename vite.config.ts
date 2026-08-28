import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const src = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': src,
      '@components': `${src}/components`,
      '@assets': `${src}/assets`,
      '@config': `${src}/config`,
      '@features': `${src}/features`,
      '@hooks': `${src}/hooks`,
      '@lib': `${src}/lib`,
      '@layouts': `${src}/layouts`,
      '@pages': `${src}/pages`,
      '@routes': `${src}/routes`,
      '@store': `${src}/store`,
      '@styles': `${src}/styles`,
      '@types': `${src}/types`,
      '@validators': `${src}/validators`,
    },
  },
});
