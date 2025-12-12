import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load .env for vite config usage. Vite exposes client envs via import.meta.env automatically.
dotenv.config()

export default defineConfig({
  plugins: [react()],
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load .env for vite config usage. Vite exposes client envs via import.meta.env automatically.
dotenv.config()

export default defineConfig({
  plugins: [react()],
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load .env for vite config usage (Vite already loads .env for client code via import.meta.env)
dotenv.config();

export default defineConfig({
  plugins: [react()],
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load .env for vite config usage (Vite already loads .env for client code via import.meta.env)
dotenv.config();

export default defineConfig({
  plugins: [react()],
})
// NOTE: Vite loads .env files into `import.meta.env` automatically for the client.
// The `dotenv` import above is only used if you need to access env vars here in the vite config.
```
