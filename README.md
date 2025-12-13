# Mall Billing System

> Simple Vite + React frontend for mall billing, barcode/QR scanning, and stock management (demo data).

## Quick checks
- `package.json` has `dev`, `build`, and `preview` scripts (Vite).
- `vite.config.js` includes `@vitejs/plugin-react`.

## Local run

Install dependencies and run dev server:

```bash
npm install
npm run dev
```

If `node` or `npm` are not installed, install Node.js LTS on Windows using `winget` or the Node.js website:

```powershell
# via Windows package manager (winget)
winget install -e --id OpenJS.NodeJS.LTS

# or download installer: https://nodejs.org/en/download/
```

### Environment variables

Vite reads `.env` files automatically during development and build. Create a `.env` in the project root (it is already added to `.gitignore`) or copy `.env.example` and edit values:

```bash
cp .env.example .env
# or create .env and set VITE_APP_TITLE, VITE_API_URL
```

Client-side environment variables in Vite require the `VITE_` prefix. For example, `VITE_APP_TITLE` will be available under `import.meta.env.VITE_APP_TITLE` in the app.

If you want Google Sheets integration you can provide a backend API and set `VITE_SHEETS_API` to its base URL. The app expects the following endpoints (JSON):

- `GET /products` — list of products
- `GET /product/:code` — single product by code
- `POST /product` — add product
- `PATCH /product/:code` — update product fields
- `POST /stock/adjust/:code` — adjust stock with `{ change: number }`
- `POST /bill` — create a bill
- `GET /bills` — list of bills

The app works in demo mode (localStorage) if `VITE_SHEETS_API` is not set.
If you already have a Google Apps Script web app URL (like the one you provided), set `VITE_SHEETS_API` to that URL. Example `.env` entry:

```env
VITE_SHEETS_API=https://script.google.com/macros/s/AKfycbzySmLhJDe2eNQpvtlQtJDSwiZMRk9Zmr8_sA8eSW84qE76FEcH-JGI3-UhbgetPlXt-w/exec
```

The client auto-detects Apps Script URLs and will use query `action=` parameters when calling endpoints, for example:
- GET VITE_SHEETS_API?action=products
- GET VITE_SHEETS_API?action=product&code=P001
- POST VITE_SHEETS_API?action=bill

Testing the script manually in a browser (GET) or using `curl` for POSTs is a good way to verify it's working before setting it in `.env`:

```bash
# Get products
curl "https://script.google.com/macros/s/AKfy.../exec?action=products"

# Add a product (POST)
curl -X POST -H "Content-Type: application/json" \
	-d '{"code":"P010","name":"Sample","category":"Misc","price":10,"stock":5,"minStock":2}' \
	"https://script.google.com/macros/s/AKfy.../exec?action=product"
```

Build for production:

```bash
npm run build
npm run preview
```

### Run inside Docker (no local Node required)

If you don't want to install Node locally, you can run the project inside Docker. You need Docker Desktop (or Docker Engine) installed.

```bash
# Start the dev environment (maps port 5173)
docker compose up --build
```

- The container uses the local `.env` file (if present) via `docker-compose.yml`.
- Open http://localhost:5173 in your browser.

On Windows you can use the helper script:

```powershell
.\scripts\run-dev.ps1
```

## GitHub: push repository

1. Initialize git and commit:

```bash
git init
git add .
git commit -m "Initial commit - Mall Billing System"
```

2. Create a GitHub repo (via GitHub website) and add remote, then push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Deploy to Vercel

Option A — Connect GitHub repo (recommended):
- Go to https://vercel.com, sign in, choose "Import Project" → select your GitHub repo.
- Framework: `Vite` (Auto-detected). Build command: `npm run build`. Output directory: `dist`.
- Deploy.

Option B — Vercel CLI:

```bash
npm i -g vercel
vercel login
vercel --prod
```

Notes:
- If using environment variables, add them in Vercel Project Settings.
- Tailwind is loaded via CDN in `index.html`; if you later switch to Tailwind JIT, add config files.

## Next recommended steps
- Initialize git locally and push to GitHub (see commands above).
- Link the GitHub repo on Vercel and deploy.
- (Optional) Add tests and backend for persistent data.
