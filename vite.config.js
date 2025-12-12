import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

// Load .env for vite config usage (Vite already loads .env for client code via import.meta.env)
dotenv.config();

export default defineConfig({
  plugins: [react()],
})
```

---

### **FILE 4: Create `src` folder**
**Inside mall-billing-system folder:**
```
Right-click → New Folder → Name: src