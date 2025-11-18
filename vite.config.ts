
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ouyestudio/',
  build: {
    outDir: 'dist',
  },
  define: {
    __BASE_PATH__: JSON.stringify('/ouyestudio'),
  },
})
