# Repository Guidelines

## Project Overview
**Couple Saving Planner** is a Progressive Web App (PWA) built on **Next.js 14 (Pages Router)** designed for couples to track shared savings, individual contributions, and target financial goals.
Data is persisted in **Google Sheets** (authenticated via Google Service Account using `googleapis`) with automatic fallback to a local mock JSON database (`db.json`). The entire application user interface, copywriting, and code commentary are in **Bahasa Indonesia**.

Deployed on Vercel under account `jamalbulkin-5793`:
- Production Project: **`couple-saver-app`**
- Production URL: `https://couple-saver-app.vercel.app` (must match `NEXTAUTH_URL` in production)
- **Important:** Do not use `couple-saving-planner` as the Vercel project name because its global `.vercel.app` domain is suspended and returns 404. All architecture choices strictly respect **Vercel Hobby free tier** limits.

---

## Architecture & Data Flow

### 3-Layer Vercel Hobby Protection
1. **ISR (Incremental Static Regeneration)**: `pages/index.js` caches dashboard HTML on Vercel's Edge CDN (`revalidate: 300` / 5 minutes), dramatically cutting function invocations.
2. **In-Memory Cache (NodeCache)**: `lib/cache.js` caches `summary_data` (TTL 300s) and `transactions_data` (TTL 60s) in serverless execution memory. Any mutating API call (`POST`) must invalidate relevant keys via `cache.del()`.
3. **Single `batchGet`**: Google Sheets read operations fetch all ranges in a single call (`F6`, `H6`, `K6`, `A10:C10`, `A21:F`, `I21:K`, `N21:N`) instead of multiple sequential API queries.

### Data Flow Diagram
```
Client (Browser / PWA)
  │
  ├─► [Pages (ISR/SSR/Client Fetch)]
  │     └─ pages/index.js (ISR props + client-side fresh refetch)
  │     └─ pages/history.js, pages/goals.js, pages/users.js, pages/add.js
  │
  └─► [API Routes (pages/api/*)]
        │ (Auth check: getServerSession with authOptions)
        ▼
      [Cache Layer (lib/cache.js)]
        ├─ Cache Hit  ──► Return cached JSON
        └─ Cache Miss ──► Query Data Layer
                            ▼
                          [Data Layer (lib/sheets.js)]
                            ├─ Google Sheets API (if GOOGLE_* credentials exist)
                            └─ Fallback: db.json (via fs runtime read/write)
```

### Dynamic Balance Calculation
- Balance numbers ("terkumpul" per goal and total shared savings) are **never trusted directly from spreadsheet cells**.
- They are recalculated dynamically from the transactions table via `calculateGoalBalances(data)`.
- Transaction schema: 6-element string array `[date, category, amount, description, saverName, goalName]`. Negative amount represents an expense.

---

## Key Directories

- `lib/`: Server-only helper modules.
  - `sheets.js`: Single data access layer for Google Sheets with automatic mock DB fallback (`db.json`). Uses Node `fs`; **never import into client components**.
  - `cache.js`: Singleton `NodeCache` instance (`stdTTL: 60`, `checkperiod: 120`).
  - `auth.js`: NextAuth shared configuration (`authOptions`) using `CredentialsProvider`.
- `pages/`: Next.js Pages Router views and endpoints.
  - `index.js`: Main dashboard with ISR (`getStaticProps`) and client refetch.
  - `history.js`: Transaction history table, filtering, pagination, and edit/delete modals.
  - `goals.js`: Goal target management (view, create, delete).
  - `users.js`: Member/contributor management (view, create, delete).
  - `add.js`: Transaction entry form with live preview and amount formatter.
  - `login.js`: Split-screen authentication page.
  - `_app.js`: Root application wrapper with `SessionProvider`.
  - `_document.js`: HTML head setup with PWA manifest, theme colors, and icons.
  - `api/`: API handlers (`summary.js`, `transactions.js`, `goals.js`, `users.js`, `add-transaction.js`, `auth/[...nextauth].js`).
- `components/`: UI components.
  - `AppShell.js`: Application layout v3 (desktop sidebar, mobile topbar and bottom tabbar).
  - `Icons.js`: Custom SVG outline icon set (no emojis).
  - `Ring.js`: SVG circular progress gauge.
- `styles/`: Styling definitions.
  - `globals.css`: Dark zinc monochrome design system v3 tokens, responsive grid, and shared utility classes.
- `public/`: Static assets.
  - `manifest.json`: PWA web application manifest (`display: standalone`, `lang: id`).
  - `icon-192.png`: PWA icon asset.

---

## Development Commands

- `npm run dev`: Start local development server at `http://localhost:3000`.
- `npm run build`: Build production Next.js bundle.
- `npm start`: Run production server locally after build.
- `npm run lint`: Next.js lint command. *(Note: ESLint is not pre-configured; running will prompt to install/configure Next.js ESLint packages).*

---

## Code Conventions & Common Patterns

### Architecture & API Route Standard Pattern
Every mutating API route (`pages/api/*`) must strictly follow this pattern:
```javascript
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/auth';
import cache from '../../lib/cache';

export default async function handler(req, res) {
  // 1. Enforce allowed HTTP method(s)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Validate authentication session
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 3. Validate input parameters
  const { date, category, amount, saverName, goalName } = req.body;
  if (!date || !category || amount === undefined || !saverName || !goalName) {
    return res.status(400).json({ error: 'Field date, category, amount, saverName, dan goalName wajib diisi' });
  }

  try {
    // 4. Perform data mutation
    const result = await addTransaction(date, category, Number(amount), '', saverName, goalName);

    // 5. Invalidate in-memory cache
    cache.del('summary_data');
    cache.del('transactions_data');

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Error in handler:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
```

### Layout and Google Sheets Ranges
The layout in `lib/sheets.js` is coupled to exact Google Sheet cells:
- Header stats: `F6` (Savings), `H6` (Target), `K6` (Progress %), `A10:C10` (Header labels).
- Transactions: `A21:F` (`saveTransactionsList` clears `A21:H` before rewriting `A21:F`).
- Goals: `I21:K` (Name, Target, Saved).
- Members/Users: `N21:N` (User list).
- If sheet rows or columns change, update `lib/sheets.js` ranges accordingly.

### Formatting & UI Conventions
- **Language**: Indonesian for all labels, placeholders, titles, and error messages.
- **Currency formatting**:
  ```javascript
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  ```
- **Date formatting**: Input/persistence is `YYYY-MM-DD`. Display uses `DD-MM-YY` via `formatDateDMY`.
- **Styling**: Zinc dark theme via CSS variables in `styles/globals.css`. Page-specific styles use scoped `<style jsx>`. Never introduce emojis in place of SVG outline icons from `components/Icons.js`.
- **CSS Trap Avoidance**: Avoid `backdrop-filter`, `transform`, or `filter` on ancestor elements of `position: fixed` containers (containing block trap that breaks mobile navbar/tabbar).

---

## Important Files

- `lib/sheets.js`: Server-only Google Sheets + `db.json` runtime access layer.
- `lib/auth.js`: NextAuth Credentials provider config and session options.
- `lib/cache.js`: Centralized in-memory cache instance.
- `db.json`: Live state for mock/fallback mode. Contains real mock user data—never treat it as throwaway dummy fixture or overwrite schema arbitrarily.
- `components/AppShell.js`: Unified navigation shell for desktop and mobile views.
- `styles/globals.css`: Design system tokens, buttons, form elements, and card styles.
- `pages/index.js`: Dashboard entry point with ISR serialization (`JSON.parse(JSON.stringify(...))`).
- `.env`: Contains real development credentials (Google Service Account keys, Sheet ID, NextAuth secret). Never commit `.env` to version control.

---

## Runtime & Tooling Preferences

- **Runtime**: Node.js `v18+` (Tested on Node `v20` / `v24`).
- **Package Manager**: `npm`.
- **Language**: JavaScript (ESM / CommonJS hybrid handled by Next.js Babel/SWC). No TypeScript configuration.
- **Git & Secrets Warning**: Check `.gitignore` before initializing or pushing a Git repo to guarantee `.env` is ignored.

---

## Testing & QA

- **Current State**: There is currently no automated test runner (Jest, Vitest, Cypress) or TypeScript typechecker configured in the project.
- **Build Verification**: Run `npm run build` to verify page compilation, routing, and Next.js static generation.
- **Syntax & Module Checks**: Run `node -c <file>.js` or dry-run Next.js dev server.
- **API Verification**: Test endpoints (`/api/summary`, `/api/transactions`, `/api/goals`, `/api/users`, `/api/add-transaction`) with valid session credentials or via UI interaction.
- **Mock Fallback Verification**: If `GOOGLE_*` environment variables are empty or network fails, verify that `lib/sheets.js` smoothly falls back to `db.json` without crashing the application.
