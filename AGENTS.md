# AGENTS.md

This file provides guidance to Codex (claude.ai/code) when working with code in this repository.

## Project

Daily Commit: a DSA interview-prep planner (React/Vite frontend + Express backend). Users build a day-by-day plan over the 150-problem "DailyCode 150" list (NeetCode 150 order), solve problems in a Monaco editor (JS/Python/C++/Java), and get spaced-repetition reviews on days 3, 7 and 21. `README.md` has the full feature list, env var table and API reference.

## Commands

Two independent npm packages; install and run each separately (the root `package.json` only holds stray type deps).

```bash
cd backend && npm install && npm run dev    # API on http://localhost:5000 (node --watch)
cd frontend && npm install && npm run dev   # Vite on http://localhost:3000
cd frontend && npm run build                # outputs frontend/dist (committed to the repo)
```

```bash
cd backend && npm test                                       # all backend tests (node:test)
cd backend && node --test --test-name-pattern="Two Sum" "test/**/*.test.js"   # a subset by name
node scripts/sync-recommender.mjs                            # after editing backend/data/recommender.js or problem-graph.json
```

`backend/test/api.test.js` spawns the real server in testing mode with `DB_FILE` pointing at a temp file. `backend/test/production.e2e.test.js` runs the real server in production mode inside the test process on an in-memory Postgres (pglite): sign-up, sign-in, payments (Razorpay's order API faked, signatures real), Pro gates, refunds, password reset, export and delete, CORS. The harness is `test/helpers/production-harness.js`; `node test/helpers/demo-production.mjs` runs the same thing on port 5000 for trying in a browser (a helper on port 5001 reads emailed codes and makes an account Pro). Tests need Node 22. Use the `DB_FILE` trick when running the server for manual testing in file mode. There is no frontend test suite, linter or CI; check frontend changes with `npx vite build --outDir <somewhere outside the repo>` (plain `npm run build` rewrites the committed `frontend/dist`) and by running the app. Node 18+ is required (backend uses global `fetch`).

`node scripts/import-neetcode150.js` (run from repo root) idempotently merges the seed list into `backend/data/problems.json`.

## Architecture

### Backend (`backend/`, ESM)

- `server.js` wires routers. `import 'dotenv/config'` must stay the first import so `DATABASE_URL` is set before the store connects. The Razorpay webhook route is registered **before** `express.json()` because it needs the raw body for signature checks.
- **App mode** (`data/app-mode.js`): `APP_MODE=testing|production`, or `--testing` / `--production` (`npm run dev:testing`, `npm run start:production`); unset means production if `DATABASE_URL` is set. Testing forces file mode even with `DATABASE_URL` set (`hasDatabase` is false), so there are no accounts, every Pro check passes, payments are off, and data goes to `backend/data/testing-db.json` (gitignored, starts empty). Production without `DATABASE_URL` refuses to start. The mode is exposed on `/api/health` and `/api/auth/config`; the frontend reads it via `lib/appMode.js`.
- **Two storage modes**, chosen by whether `hasDatabase` is true (`data/store.js`):
  - *File mode*: one shared dataset in `backend/data/db.json`; accounts are off.
  - *Neon mode*: per-user data. `requireUser` (`data/auth.js`) loads the user's state and runs the rest of the request inside `runAsUser()` (an `AsyncLocalStorage`). Routes keep calling the synchronous `getDb()` / `saveDb()`, which resolve to the current user's in-memory copy; `saveDb()` diffs collections and upserts changed keys to Neon asynchronously. Calling `getDb()` outside a signed-in request throws in Neon mode.
  - So route handlers should only use `getDb()`/`saveDb()` and never touch Neon directly for user data.
- Neon is accessed via `@neondatabase/serverless` over WebSockets (port 443), not plain TCP Postgres. Schema is created in `ensureSchema()` in `data/neon.js`.
- Public routes: `/api/auth`, `/api/billing`, `/api/execute` (rate-limited per IP; `trust proxy` is on), and `GET /api/problems/details/:slug` (LeetCode statement/metadata fetch + cache in `problem_cache.json`). Everything else goes through `requireUser`.
- Every optional integration (Google sign-in, Brevo/Resend/SMTP mail, Razorpay, Judge0) degrades gracefully when unconfigured; the server logs which are on at startup. Without mail config, verification codes are printed to the console.

### Frontend (`frontend/src/`)

- No router library: `App.jsx` tracks `window.location.pathname` and a `navigate()` helper; `/practice` (and `/explore` → `/practice/dsa`) render the standalone practice hub. `vercel.json` rewrites all paths to `index.html`.
- `services/api.js` is the single API client. It attaches the bearer token from localStorage (keys are prefixed `codestreak_`), dispatches an `auth:expired` window event on 401, and falls back to localStorage/`data/initialData.js` when the backend is unreachable (offline mode). `VITE_API_URL` overrides the default `http://localhost:5000/api`.
- `index.html` + `public/intro/` + `lib/splash.js` implement the splash screen that waits on `/api/health` (Render free tier cold start) with a "Continue offline" option.
- Path alias `@` → `src`; `motion` / `motion/react` are aliased to `framer-motion`. JSX and a few shadcn-style `.tsx` files coexist in `components/ui/`.
- App modals are imported from `components/modals/`; the same-named files directly under `components/` are older copies.

### Code execution (`frontend/src/services/execution/`)

- `harness.js` turns a problem's examples + LeetCode `metaData` (param/return types) into a language-neutral call spec (linked lists, trees, node refs, in-place outputs, design classes) and compares outputs (order-insensitive only when the statement allows; float tolerance).
- JS runs in `js.worker.js`, Python in Pyodide via `py.worker.js` (both in-browser with time limits). C++/Java: `cppDriver.js` / `javaDriver.js` generate a full program with a `main` around the user's code, posted to `POST /api/execute`, which proxies to Judge0 so the key stays server-side. Compile-error line numbers are shifted using `USER_CODE_MARKER`.
- All runners return the same `{ success, verdict, runtimeMs, results }` shape and emit marked per-case output parsed by `parseMarkedOutput`.
- The 7 LeetCode Premium problems have hand-written statements/tests in `data/premiumProblems.js`.

### Adaptive practice ("Next up") and AI code review

- **Attempts:** `CodeWorkspace/useAttemptTracker.js` records one attempt per problem opening: active seconds (visible tab, not idle), runs and submits, first and final verdict, hints or video opened, pasted characters, self-rating, AI verdict. The client always sends the whole attempt, upserted by id via `POST /api/planner/attempts`, and stores it in `db.attempts[problemId]` (and a localStorage copy). So any field the server sets on an attempt must also be held by the tracker, or the next save wipes it.
- **Recommender:** `backend/data/recommender.js` is pure and deterministic (Elo-style mastery per pattern, then step up, hold, step down, prerequisite or revisit, while staying inside the study plan when behind). It reads the pattern graph in `backend/data/problem-graph.json`. The frontend runs an identical copy offline (`frontend/src/lib/recommender.js`, `frontend/src/data/problemGraph.json`), generated by `scripts/sync-recommender.mjs`; never edit the copies. A test fails when they're stale. Served by `GET /api/planner/next`, shown by `practice/NextUpCard.jsx` in the practice hub and in the editor after an accepted submit.
- **Smart revision (Pro):** computed only on the server (`backend/data/smart-revision.js`) and served by `GET /api/planner/revision?today=&tz=`, which returns `{ smart: false }` unless `isProUser` passes, so it can't be unlocked from the browser. Free and offline fall back to the fixed 3/7/21 schedule in `frontend/src/lib/practice.js`. Days are counted in the person's time zone (`tz` = `Date.getTimezoneOffset()`). `PATCH /planner/question/:id` with `reviewed: true, reviewResult: 'hard'|'ok'|'easy'` appends to `q.reviews` and the aligned `q.reviewResults` (older reviews have none, read as 'ok').
- **Revision without a plan, and progress:** both schedules also read the editor's `attempts` for problems outside the plan (`smart-revision.js` server-side, `revisionSchedule(plan, today, { attempts, problems, attemptReviews })` in `frontend/src/lib/practice.js` for Free). Reviews on those are stored in `db.attemptReviews` via `POST /planner/review` (which writes to the plan question instead when it's in the plan); the hub records all reviews through `api.recordReview`. A problem rated Hard always counts as a struggle, and once reviewed it stays on the queue. `GET /planner/progress` (`data/progress.js`) returns basics for everyone and `detailed` (per-topic, weak topics, on-track) only when `isProUser`; shown by `practice/ProgressCard.jsx`.
- **Testing helpers:** in testing mode only, `POST /api/dev/seed` loads sample attempts and `POST /api/dev/reset` wipes the data (`routes/dev.js`, buttons in `TestingModeBanner.jsx`).
- **Pro checks:** `createProChecks()` in `data/billing.js` builds `isProUser` / `requirePro`; unit tests pass a fake query, and the production e2e tests run them for real.
- **Swappable database:** `data/neon.js` exports a `pool` handle that forwards to the Neon pool; tests call `setBackend()` to put an in-memory Postgres behind it. `server.js` exports `app` and `start()` and only auto-starts when run as `node server.js`.
- **Accounts:** `POST /auth/forgot-password` (same answer for every address) and `/auth/reset-password` use the `email_codes` table with purpose `reset`, then revoke all sessions (`deleteUserSessions`). `DELETE /auth/me` anonymises rather than hard-deletes: it erases `user_state`, clears name/email/sign-in links and Pro, and keeps `payments` rows (accounting) tied to no personal details; `forgetUserData` drops the in-memory copy first so a late save can't bring it back. `GET /auth/me/export` returns profile, payments and all saved data.
- **Refunds:** the `refund.processed` webhook calls `applyRefund`: a full refund marks the payment `refunded` and subtracts its days from `plan_expires_at` (never below now); partial refunds and repeats do nothing.
- **CORS:** `CORS_ORIGINS` (comma-separated) restricts browser callers; unset allows any (production warns at startup).
- The frontend API client answers 401 locally for signed-out visitors when the server has accounts on, instead of sending requests that would be refused (`refusedWithoutSignIn` in `services/api.js`).
- **Code score and AI analysis (Pro):** `backend/data/ai-review.js` asks Google Gemini (`@google/genai`, default `gemini-2.5-flash`, free tier; transient 500/503 are retried) for a JSON analysis: time and space complexity, the best known, grades (optimal / good / poor), the approach, the main idea and a better way to think about it. `backend/data/code-score.js` turns the grades and the tests passed into the 0-100 score (tests 40, time 40, space 20, with the time and space credit scaled by the share of tests passed; 100 needs every test and optimal time and space). `routes/ai.js` (`POST /api/ai/review`) is behind `requireUser` + `requirePro`, caches analyses by code hash (`analysis-cache.js`, so repeats are free) and counts only new analyses against `AI_REVIEW_DAILY_LIMIT` (default 30). After an accepted Submit it keeps the verdict on the attempt for the recommender. Off without `GEMINI_API_KEY`. UI: `CodeWorkspace/useCodeScore.js`, `ScoreBar.jsx` (after every Run and Submit; compile and runtime errors are not analysed) and `ScoreModal.jsx` (centred popup after an accepted Submit, and from the bar's Details).

### Duplicated logic to keep in sync

- **Scheduler**: `backend/data/scheduler-engine.js` (used by `POST /planner/generate`) and `frontend/src/utils/schedulerEngine.js` (live preview in `PlannerWizardModal.jsx`, which also mirrors its time estimates). Change both together.
- **Problem list**: `backend/data/neetcode150.json`, `backend/data/seeds/neetcode150.json` and `frontend/src/data/neetcode150.json`.

## Repo notes

- Pro plan (Razorpay billing) status, flow and remaining work: `docs/PRO_IMPLEMENTATION.md`. Open questions and missing env values for the owner: `docs/REQUIREMENTS.md`.
- Working-tree files use CRLF line endings (`core.autocrlf=true`); multi-line string replacements in scripts must account for `\r\n`.

- `.agents/skills/unslop/` is a UI-polish skill used for design passes on the frontend.
- `daily-commit-intro.mp4` (~19 MB) and stray files `console.log('FRONTEND` / `powershell.cmd` sit at the root; don't extend them.
