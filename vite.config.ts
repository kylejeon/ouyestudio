import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  base: '/ouyestudio/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
