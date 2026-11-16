import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/auto_pere/' : '/',
  plugins: [react(), tailwind()],
}))
