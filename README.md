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
