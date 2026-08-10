import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/demo2/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
