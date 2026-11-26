<div align="center">

# Daily Commit

**A daily DSA practice planner for coding interview preparation.**
Plan the day's problems, solve them in a built-in code editor, and get the tricky ones back on day 3, 7 and 21 with spaced repetition.

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=flat-square&logo=tailwindcss&logoColor=38BDF8)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Neon_Postgres-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Monaco](https://img.shields.io/badge/Monaco_Editor-0066FF?style=flat-square&logo=visualstudiocode&logoColor=white)

</div>

---

## Contents

- [What it does](#what-it-does)
- [Features](#features)
- [How code runs](#how-code-runs)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [API reference](#api-reference)
- [Roadmap](#roadmap)
- [Credits and disclaimer](#credits-and-disclaimer)
- [Keywords](#keywords)

---

## What it does

Daily Commit turns interview prep into a daily habit, one green square a day:

1. **Plan.** Answer five questions (level, difficulty mix, hours a day, finish date, revision days) and get a day-by-day plan for the **DailyCode 150**, a 150-problem list covering the core interview patterns. A live preview shows the finish date and whether your hours fit before you build it.
2. **Solve.** Open any problem in a full-window workspace and **Run** or **Submit** in Python, C++, Java or JavaScript.
3. **Learn from it.** With Pro, every scored solution gets a 0 to 100 code score and an analysis of its time and space complexity against the best known approach.
4. **Revise.** Problems you struggled with come back **3, 7 and 21 days** later (sooner and adaptively with Pro).
5. **Keep the streak.** One daily problem for everyone, a 16-week activity grid, and a streak counted from real solves.

---

## Features

### Practice hub (`/practice`)
- **Today's problem** as the opening card: the same problem for everyone each day, cycling through all 150 without repeats, next to your **streak** and a **16-week activity grid** of the days you solved something
- **Next up**: an adaptive next problem picked from how your recent solves went. A fast first-try solve steps up to a harder problem in the same pattern; a struggle steps down to an easier one or a prerequisite pattern; falling behind your plan brings you back to it. Every pick says why
- **Study plan card** that builds or opens your DailyCode 150 plan
- **Progress card**: solved X of 150, solved today, left to solve, topics started and revisions due for everyone; **Pro** adds a per-topic breakdown, what needs work, what is still to cover, and an on-track check against your plan
- **Revision queue** with day 3, 7 and 21 reviews, overdue counts, and a mastered count after the third review. It works without a study plan: problems you struggle with in the editor, or rate Hard, join the queue on their own
- **Smart revision (Pro)**: problems you struggled with come back sooner (read the solution, see it again tomorrow), each review is rated Hard, Good or Easy and the next gap adapts, and struggles you didn't flag (wrong first submit, slow, brute force) join the queue on their own
- **Sheets**: DailyCode 150 is live with a progress bar; more sheets are listed as outlines and marked *Coming soon*

### Code workspace
- **Full-window workspace**: the app's sidebar steps aside while you solve. Only the problem and the console scroll, never the page
- **Top bar**: back to problems, hide or show the problem, a **solve timer** (counts only while the tab is visible, click to pause), today's **commit square** that fills on an accepted submit, and **Run** / **Submit**
- **Problem card**: Description and Hints tabs, a green check by the title once you have solved it, chips for difficulty and topic, and links to LeetCode and the video explanation. Statements from LeetCode are tidied into one consistent style for examples and constraints
- **Editor card**: Monaco with starter code, a language chip with a dropdown (**Python first**, then your last choice is remembered), a brief *Saved* note as drafts autosave per problem and language, and a toolbar for font size, reset, copy and full screen. Dark and light editor themes follow the app theme
- **Console card**: test cases with a square per case (grey before a run, then green or red), your output next to the expected one, and a Result tab with the verdict and runtime. The console folds down to a single bar and reopens on Run or Submit
- **Panels resize** by dragging the gaps between them, and the problem and console can be folded away to give the code the whole width
- Real test cases from each problem's examples, with LeetCode-style inputs: arrays, strings, linked lists, binary trees, cycles, in-place answers, design classes (LRU Cache, Min Stack) and answers accepted in any order
- Clear verdicts: Accepted, Wrong Answer, Runtime Error, Compile Error, Time Limit Exceeded
- **Hidden tests on Submit** for the first 50 problems: about 300 extra cases (empty inputs, duplicates, negatives, large values) on top of the examples, with answers computed from verified reference solutions
- Original statements and tests for the **7 LeetCode Premium** problems in the list (Encode and Decode Strings, Meeting Rooms I and II, Walls and Gates, Graph Valid Tree, Number of Connected Components, Alien Dictionary)
- After a failed run, *Suggest an easier problem* offers one to build up with

### Code score and AI analysis (Pro)
- A **score pill** in the editor header appears after your first Run or Submit: a small ring that fills with the score, amber under 50, blue above, green at 100
- The score is **tests passed (40) + time complexity (40) + space complexity (20)**, graded by Google Gemini against the best known approach. Time and space credit shrinks when tests fail, and 100 needs every test and an optimal approach
- The **analysis panel** slides in on the right after an accepted Submit, or when you click the pill, and keeps the problem and code in view:
  - a **score ring** in three segments (tests, time, space) that shows where points were lost
  - your time and space complexity against the best known
  - the main idea of your approach, and a better way to think about it when there is one
  - *How did that feel?* (Easy, OK, Hard), which feeds Next up and revision
  - your code, folded away
  - a **Next** button that opens the suggested next problem
- Identical code is answered from a cache and costs none of the daily allowance. A brute-force verdict also tells Next up not to step up yet

### Study planner
- Personalized **DSA study plan** built from your level, daily hours and target date, with lighter revision days every fifth day
- **Live plan preview** in the wizard: finish date, problems and minutes per day, revision days, and a warning when the hours don't fit, all computed by the same scheduler that builds the plan
- **Topic roadmap**, problem sheet grouped by topic, day view, and an all-days overview
- Mark each solve as *solo*, *hint* or *solution*, star problems, and keep notes on mistakes
- Move overdue problems onto upcoming days in one click

### Progress and habits
- **Streak** and longest streak from days with a solve
- Monthly solve calendar, solved ring by difficulty, achievements
- Daily task list with carry-over, and a focus timer

### Accounts and Pro
- Email and password sign-up with an emailed verification code, plus optional **Google sign-in**
- **Forgot password**: an emailed code sets a new password and signs out every other session
- **Download my data** and **Delete account** (password or typed email to confirm). Deleting erases the plan, attempts and profile; payment records are kept for accounting, without name or email
- Data stored per user in **Neon Postgres**; without a database the backend falls back to a local JSON file with accounts turned off
- **Razorpay** checkout for a Pro plan, with payment verification, a webhook backup, payment history, and automatic removal of Pro on a full refund

### Interface
- Dark and light themes on one neutral ramp with a single blue accent, Geist and Geist Mono type
- Splash screen that waits for a sleeping backend (Render free tier) to wake, with a *Continue offline* option
- Works offline: the planner, problem data, attempts and the free revision schedule fall back to the browser's local storage

---

## How code runs

| Language | Where it runs | Notes |
|---|---|---|
| Python | [Pyodide](https://pyodide.org) (CPython in WebAssembly) in a Web Worker | About 10 MB loads the first time, started as soon as Python is picked; 8 second time limit |
| JavaScript | Web Worker in the browser | 5 second time limit, so an infinite loop can't freeze the tab |
| C++ | [Judge0](https://judge0.com) through the backend | GCC; the browser builds a full program with a `main` that runs every case |
| Java | Judge0 through the backend | OpenJDK; same approach, `public class Main` |

How a run works:

1. The backend fetches a problem's statement, starter code, example inputs and LeetCode's `metaData` (parameter and return types), and caches them in `backend/data/problem_cache.json`.
2. `frontend/src/services/execution/harness.js` turns each example into a language-neutral call spec: values, linked lists, trees, node references and in-place outputs.
3. Each runner executes the spec and prints one marked result per case, and the harness compares answers. It accepts any order only when the statement allows it, and compares decimals with a small tolerance.
4. C++ and Java programs are posted to `POST /api/execute`, which forwards them to Judge0 so the API key stays on the server. The route has a per-IP rate limit. Compile-error line numbers are shifted back to match your code.

---

## Tech stack

**Frontend:** React 18, Vite 5, Tailwind CSS 3, Framer Motion, Monaco Editor (`@monaco-editor/react`), react-resizable-panels, Recharts, Lucide icons, Pyodide

**Backend:** Node.js, Express 4, Neon serverless Postgres (`@neondatabase/serverless`), bcryptjs, google-auth-library, Nodemailer, Google Gen AI SDK (`@google/genai`)

**Services:** Judge0 CE (C++ and Java), Google Gemini (code analysis), Razorpay (payments), Resend or Brevo (email), Vercel (frontend hosting), Render (backend hosting)

---

## Project structure

```
.
├── backend/
│   ├── server.js                  Express app, routers, health check, startup report
│   ├── routes/
│   │   ├── auth.js                sign-up, verify, login, Google, reset password, export, delete
│   │   ├── planner.js             plan, questions, attempts, next up, revision, reviews, progress
│   │   ├── problems.js            problem tracker + LeetCode statement lookup and cache
│   │   ├── ai.js                  Gemini code analysis and score (Pro)
│   │   ├── execute.js             C++ and Java runs through Judge0
│   │   ├── billing.js             Razorpay plans, orders, verification, webhook, history
│   │   ├── dev.js                 seed and reset (testing mode only)
│   │   └── tasks.js  roadmap.js  stats.js
│   ├── data/
│   │   ├── app-mode.js            testing or production
│   │   ├── store.js  neon.js      file or Postgres storage, per-user state
│   │   ├── auth.js  mailer.js  billing.js
│   │   ├── scheduler-engine.js    builds the day-by-day plan
│   │   ├── recommender.js         adaptive Next up (pure, shared with the frontend)
│   │   ├── problem-graph.json     the pattern graph the recommender walks
│   │   ├── smart-revision.js      Pro revision schedule
│   │   ├── progress.js            progress summary
│   │   ├── ai-review.js  code-score.js  analysis-cache.js
│   │   └── neetcode150.json       the 150-problem list
│   ├── data/monitoring.js         Sentry error tracking and JSON error responses
│   └── test/                      node:test suites, incl. an end-to-end run on in-memory Postgres
├── frontend/
│   ├── index.html                 splash screen
│   ├── vercel.json                SPA rewrite
│   └── src/
│       ├── App.jsx                routing without a router library
│       ├── components/
│       │   ├── PracticeHub.jsx        the /practice hub
│       │   ├── practice/              hub pieces: sidebar, cards, sheets, today's tasks
│       │   ├── CodeWorkspace/         workspace: top bar, problem, editor and console panels, score pill, analysis panel
│       │   ├── PersonalizedPlanner/   planner wizard, sheet, day, overview
│       │   ├── modals/                app modals
│       │   └── ui/                    shared UI
│       ├── services/
│       │   ├── api.js                 API client with offline fallback
│       │   └── execution/             test harness and language runners
│       ├── data/                      problem list, premium problems, pattern graph copy
│       ├── lib/                       practice schedule, recommender copy, splash, app mode
│       └── utils/schedulerEngine.js   in-browser copy of the scheduler
│   └── scripts/hidden-tests/      reference solutions and generators for the hidden Submit tests
├── scripts/                       import the problem list, sync the recommender copy
└── docs/                          Pro implementation notes and open requirements
```

---

## Getting started

### Requirements
- Node.js 18 or newer to run the app (the backend uses the built-in `fetch`); Node.js 22 to run the tests
- npm

### 1. Install

```bash
git clone https://github.com/SUDHEER176/DailyCommit.git
cd DailyCommit

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure

```bash
cp backend/.env.example backend/.env
```

Everything is optional for local development. With an empty `.env` the backend runs in testing mode. See [Environment variables](#environment-variables).

### 3. Run

The backend has two modes (`APP_MODE` in `backend/.env`, or the npm scripts below):

| Mode | Sign-in | Pro features | Payments | Data |
|---|---|---|---|---|
| **testing** (`npm run dev:testing`) | None, straight to the editor | All free | Off | `backend/data/testing-db.json` (local, not in git); the real database is never touched |
| **production** (`npm run start:production`) | Email/password or Google | Pro accounts only | Razorpay | Neon (`DATABASE_URL` required) |

When `APP_MODE` isn't set: production if `DATABASE_URL` is set, testing otherwise. A yellow *Testing* strip shows across the top in testing mode, with buttons to load sample attempts and to wipe the data.

```bash
# terminal 1: API on http://localhost:5000
cd backend
npm run dev

# terminal 2: app on http://localhost:3000
cd frontend
npm run dev
```

The frontend calls `http://localhost:5000/api` unless `VITE_API_URL` is set.

### Build

```bash
cd frontend
npm run build      # outputs frontend/dist (not committed; Vercel builds it on deploy)
npm run preview
```

---

## Testing

```bash
cd backend
npm test                                                          # every backend suite
node --test --test-name-pattern="Two Sum" "test/**/*.test.js"     # a subset by name

cd frontend
npm test                                                          # every frontend suite (Vitest)
npm run hidden-tests                                              # rebuild the hidden Submit tests
```

**Backend**

- `test/api.test.js` starts the real server in testing mode against a temporary data file.
- `test/production.e2e.test.js` runs the server in production mode on an in-memory Postgres (pglite): sign-up, sign-in, payments (Razorpay's order API faked, signatures real), Pro gates, refunds, password reset, export and delete, and CORS.
- `node test/helpers/demo-production.mjs` runs that same production setup on port 5000 for trying in a browser. A helper on port 5001 reads emailed codes and makes an account Pro.
- After editing `backend/data/recommender.js` or `problem-graph.json`, run `node scripts/sync-recommender.mjs` to refresh the frontend copies; a test fails when they are stale.

**Frontend**
- `src/services/execution/__tests__/` tests the code runner end to end: real solutions for eight problem shapes (values, linked lists, trees, a cycle placed by `pos`, lists of lists, a design class, an in-place answer, node references) run through the real JavaScript worker, the real Python driver under a local `python`, and real C++ and Java programs compiled with `g++` and `javac`. Languages whose tool isn't installed are skipped with a note.
- The same suite covers test-case parsing, answer comparison, signature reading and verdicts.
- `src/data/__tests__/hiddenTests.test.js` fails when `src/data/hiddenTests.json` doesn't match what `scripts/hidden-tests/` generates.

**Hidden Submit tests.** `frontend/scripts/hidden-tests/problems.js` holds, for each problem, LeetCode's type metadata, a reference solution, the statement's examples and a seeded input generator. `npm run hidden-tests` first checks every reference against its examples, then runs it on the generated inputs through the real harness to compute the expected answers. Nothing is typed by hand, and the file is reproducible.

CI (`.github/workflows/ci.yml`) runs the backend tests, the frontend tests (with Python, C++ and Java) and a frontend build on Node 22.

---

## Environment variables

### Backend (`backend/.env`)

Put these in **`backend/.env`** (the backend reads only that file, not a `.env` at the repo root). Copy `backend/.env.example` to start. Every variable is optional: whatever is missing just switches its feature off.

| Variable | Turns on | Where to get it |
|---|---|---|
| `DATABASE_URL` | Accounts and per-user data | [Neon console](https://console.neon.tech) → your project → **Connect** → copy the connection string. Use the **pooled** host (contains `-pooler`). Free plan available |
| `GEMINI_API_KEY` | Code score and AI analysis in the editor (Pro) | [Google AI Studio → Get API key](https://aistudio.google.com/apikey). Sign in with a Google account → **Create API key**. Free, no card needed |
| `GEMINI_MODEL` | Which Gemini model reviews code | Optional. Defaults to `gemini-2.5-flash` (free tier). Model names: [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) |
| `AI_REVIEW_DAILY_LIMIT` | Code analyses per person per day | Optional, default `30`. Each Run or Submit with new code is one analysis; identical code is cached and free. The free tier allows only a small number of Flash requests per day **for the whole project**; see [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits). Raise this after you turn on billing |
| `RAZORPAY_KEY_ID` `RAZORPAY_KEY_SECRET` | Pro payments | [Razorpay dashboard](https://dashboard.razorpay.com) → **Account & Settings → API keys**. Start with `rzp_test_` keys (no real money) |
| `RAZORPAY_WEBHOOK_SECRET` | Pro still turns on if the browser closes after paying | Razorpay → **Settings → Webhooks** → URL `https://<your-backend>/api/billing/webhook`, events `payment.captured`, `order.paid` and `refund.processed` (the last one takes Pro away after a full refund). Choose a long random secret (20+ characters) and paste it here |
| `RESEND_API_KEY` (or `BREVO_API_KEY`), plus `MAIL_FROM` | Emailing sign-up and reset codes over HTTPS. Needed on Render, which blocks SMTP | [Resend → API keys](https://resend.com/api-keys) (verify your sending domain under Domains) or [Brevo → SMTP & API](https://app.brevo.com/settings/keys/api). Without mail settings, codes are printed in the server console |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | SMTP fallback, fine locally | Used only when no mail API key is set. With Resend: host `smtp.resend.com`, user `resend`, password = your Resend key |
| `GOOGLE_CLIENT_ID` | Google sign-in | [Google Cloud console → Credentials](https://console.cloud.google.com/apis/credentials) → **Create credentials → OAuth client ID → Web application**. Add `http://localhost:3000` (and your live site) to Authorised JavaScript origins |
| `JUDGE0_API_KEY` | Running C++ and Java | [RapidAPI → Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce) → subscribe (free plan has a daily limit) → copy `X-RapidAPI-Key`. Python and JavaScript run in the browser without it |
| `JUDGE0_URL` `JUDGE0_API_HOST` | Self-hosted Judge0, or a different RapidAPI host | Optional |
| `SENTRY_DSN` | Error tracking for the API | [sentry.io](https://sentry.io) → create a **Node.js / Express** project → **Settings → Client Keys (DSN)**. Free plan available. Reports carry no IP address, cookies, auth headers or request bodies. Optional `SENTRY_ENVIRONMENT` labels them (defaults to the app mode) |
| `CORS_ORIGINS` | Locks the API to your own site | Comma-separated, e.g. `https://yourdomain.com,https://www.yourdomain.com`. Unset means any website can call the API from a browser: fine locally, set it in production (the server warns at startup) |
| `APP_MODE` | `testing` or `production` | See [Run](#3-run) |
| `PORT` | | Defaults to `5000` |

The server prints which features are on when it starts.

### Frontend

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Backend API base, e.g. `https://your-api.onrender.com/api` (set in `frontend/.env.production`) |
| `VITE_SENTRY_DSN` | Error tracking in the browser: create a **React** project in Sentry and paste its DSN. Off when unset, and the Sentry SDK isn't downloaded at all. Reports carry no IP address, cookies, query strings or code. Optional `VITE_SENTRY_ENVIRONMENT` |

---

## Deployment

**Frontend on Vercel**
- Root directory: `frontend`, build command `npm run build`, output `dist`
- Set `VITE_API_URL` to your backend's `/api` URL
- `frontend/vercel.json` rewrites every path to `index.html`, so routes like `/practice` load directly

**Backend on Render**
- Root directory: `backend`, start command `npm run start:production`
- Add the environment variables above, including `DATABASE_URL` and `CORS_ORIGINS`; `trust proxy` is on so rate limits see the visitor's IP
- On the free tier the service sleeps when idle. The frontend splash screen waits for `/api/health` and offers *Continue offline*

---

## API reference

Base URL: `/api`. When accounts are on, every route except auth, billing plans and the webhook, `execute`, `ai/status` and `problems/details` needs a signed-in user.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Status, app mode and database check |
| **Auth** | | |
| GET | `/auth/config` | Which sign-in methods are on, and the app mode |
| POST | `/auth/register` · `/auth/verify-email` · `/auth/resend-code` | Email sign-up with a verification code |
| POST | `/auth/login` · `/auth/google` · `/auth/logout` | Sign in and out |
| POST | `/auth/forgot-password` · `/auth/reset-password` | Reset by emailed code; signs out every session |
| GET, PATCH, DELETE | `/auth/me` | Current user, update profile, delete (anonymise) the account |
| GET | `/auth/me/export` | Download profile, payments and all saved data |
| **Planner** | | |
| GET | `/planner/plan` · `/planner/questions` | The study plan and its problems |
| POST | `/planner/generate` | Build a plan from the wizard's answers |
| PATCH | `/planner/question/:id` | Mark solved, star, solve status, notes, `reviewed: true` with `reviewResult` |
| POST | `/planner/carry-forward` · `/planner/reset` | Move overdue problems, reset the plan |
| GET, POST | `/planner/attempts` | Per-problem attempt signals from the editor (time, runs, verdicts, hints, self-rating) |
| GET | `/planner/next?after=&today=&exclude=` | The adaptive next problem, with the reason |
| GET | `/planner/revision?today=&tz=` | Smart revision queue (Pro); `{ smart: false }` for Free |
| GET, POST | `/planner/review` | Reviews of problems outside the plan; POST records a review anywhere |
| GET | `/planner/progress` | Progress basics, plus per-topic detail for Pro |
| **Code** | | |
| GET | `/problems/details/:slug` | Statement, starter code, test cases and types for a problem |
| GET, POST, PUT, DELETE | `/problems` · `/problems/:id` | Logged problems; `PATCH /problems/:id/toggle-revision` |
| POST | `/execute` | Run a C++ or Java program on Judge0 |
| GET | `/ai/status` | Whether code analysis is on |
| POST | `/ai/review` | Gemini analysis and 0 to 100 score of your code (Pro) |
| **Billing** | | |
| GET | `/billing/plans` | Pro plans and prices |
| POST | `/billing/order` · `/billing/verify` | Razorpay checkout |
| GET | `/billing/history` | Your payments |
| POST | `/billing/webhook` | Razorpay webhook (raw body, signed) |
| **Other** | | |
| GET, POST, PUT, DELETE | `/tasks` · `/tasks/:id` | Daily tasks; `PATCH /tasks/:id/toggle`, `POST /tasks/:id/carry-over` |
| GET, PATCH | `/roadmap` · `/roadmap/week/:weekNum/topic` | Weekly roadmap |
| GET, PUT | `/stats` · `/stats/user` | Activity, streak and progress |
| POST | `/dev/seed` · `/dev/reset` | Load sample attempts, wipe data (testing mode only) |

---

## Roadmap

- [ ] Problems for the outlined sheets (A2Z Roadmap, Top 180, Quick 75, language and core CS tracks)
- [ ] Extra hidden tests for Submit on more problems (today most problems run their examples)
- [ ] A checker for problems with several valid answers
- [ ] Clone Graph and Copy List with Random Pointer in the runner (custom `Node` types)
- [ ] Submission history per problem
- [ ] Timed mock interviews
- [ ] Hidden tests for the other 100 problems
- [x] Backend and frontend tests, and CI
- [x] Hidden Submit tests for the first 50 problems
- [x] Error tracking (Sentry, off until configured)

---

## Credits and disclaimer

- The DailyCode 150 follows the problem list and topic order of the [NeetCode 150](https://neetcode.io).
- Problem statements are loaded from LeetCode at runtime and belong to LeetCode. Daily Commit isn't affiliated with or endorsed by LeetCode or NeetCode. The Premium problems are described in our own words.
- Code execution uses [Pyodide](https://pyodide.org) and [Judge0](https://judge0.com). Code analysis uses Google Gemini.

Released under the [MIT License](LICENSE).

---

## Keywords

DSA practice · data structures and algorithms · coding interview preparation · LeetCode tracker · NeetCode 150 · study planner · spaced repetition · revision queue · daily coding problem · streak tracker · online code editor · Run and Submit · code complexity analysis · Python · C++ · Java · JavaScript · Monaco editor · Pyodide · Judge0 · Gemini · React · Vite · Tailwind CSS · Node.js · Express · PostgreSQL · Neon · Razorpay · full-stack project

**Suggested GitHub topics:** `dsa` `data-structures-and-algorithms` `leetcode` `neetcode-150` `coding-interview` `interview-preparation` `spaced-repetition` `study-planner` `code-editor` `monaco-editor` `pyodide` `judge0` `gemini` `react` `vite` `tailwindcss` `nodejs` `express` `postgresql` `neon`
