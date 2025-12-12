import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load .env for vite config usage. Vite exposes client envs via import.meta.env automatically.
dotenv.config()

export default defineConfig({
  plugins: [react()],
})
