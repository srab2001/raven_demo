import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/demo3/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
