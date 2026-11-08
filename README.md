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
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [API reference](#api-reference)
- [Roadmap](#roadmap)
- [Credits and disclaimer](#credits-and-disclaimer)
- [Keywords](#keywords)

---

## What it does

Daily Commit turns interview prep into a daily habit:

1. **Plan.** Answer five questions (level, difficulty mix, hours a day, finish date, revision days) and get a day-by-day plan for the **DailyCode 150**, a 150-problem list covering the core interview patterns. A live preview shows the finish date and whether your hours fit before you build it.
2. **Solve.** Open any problem in a LeetCode-style editor and **Run** or **Submit** in JavaScript, Python, C++ or Java.
3. **Revise.** Problems you starred, or solved with a hint or the solution, come back **3, 7 and 21 days** after you solved them.
4. **Keep the streak.** One daily problem for everyone, a commit-style activity heatmap, and a streak counted from real solves.

---

## Features

### Study planner
- Personalized **DSA study plan** built from your level, daily hours and target date, with lighter revision days every fifth day
- **Live plan preview** in the wizard: finish date, problems and minutes per day, revision days, and a warning when the hours don't fit, all computed by the same scheduler that builds the plan
- **Topic roadmap**, problem sheet grouped by topic, day view, and an all-days overview
- Mark each solve as *solo*, *hint* or *solution*, star problems, and keep notes on mistakes
- Move overdue problems onto upcoming days in one click

### Code editor (Run and Submit)
- **Monaco editor** with starter code for JavaScript, Python, C++ and Java
- Real test cases from each problem's examples, with LeetCode-style inputs: arrays, strings, linked lists, binary trees, cycles, in-place answers, design classes (LRU Cache, Min Stack) and answers accepted in any order
- Clear verdicts: Accepted, Wrong Answer, Runtime Error, Compile Error, Time Limit Exceeded, with the failing case, your output and the expected output
- Drafts saved per problem and language
- Original statements and tests for the **7 LeetCode Premium** problems in the list (Encode and Decode Strings, Meeting Rooms I and II, Walls and Gates, Graph Valid Tree, Number of Connected Components, Alien Dictionary)

### Practice hub (`/practice`)
- **Daily problem**: the same problem for everyone each day, cycling through all 150 without repeats
- **Revision queue** with day 3, 7 and 21 reviews, overdue counts, and a mastered count after the third review
- Sheets: DailyCode 150 is live; more sheets are listed as outlines and marked *Coming soon*

### Progress and habits
- **Streak** and longest streak from days with a solve
- Monthly solve calendar, solved ring by difficulty, achievements
- Daily task list with carry-over, and a focus timer

### Accounts and Pro
- Email and password sign-up with an emailed verification code, plus optional **Google sign-in**
- Data stored per user in **Neon Postgres**; without a database the backend falls back to a local JSON file with accounts turned off
- **Razorpay** checkout for a Pro plan, with payment verification and an optional webhook

### Interface
- Dark and light themes, one blue accent, Geist and Geist Mono type
- Splash screen that waits for a sleeping backend (Render free tier) to wake, with a *Continue offline* option
- Works offline: the planner and problem data fall back to the browser's local storage

---

## How code runs

| Language | Where it runs | Notes |
|---|---|---|
| JavaScript | Web Worker in the browser | 5 second time limit, so an infinite loop can't freeze the tab |
| Python | [Pyodide](https://pyodide.org) (CPython in WebAssembly) in a Web Worker | About 10 MB loads the first time Python is picked; 8 second time limit |
| C++ | [Judge0](https://judge0.com) through the backend | GCC; the browser builds a full program with a `main` that runs every case |
| Java | Judge0 through the backend | OpenJDK; same approach, `public class Main` |

How a run works:

1. The backend fetches a problem's statement, starter code, example inputs and LeetCode's `metaData` (parameter and return types), and caches them.
2. `frontend/src/services/execution/harness.js` turns each example into a language-neutral call spec: values, linked lists, trees, node references and in-place outputs.
3. Each runner executes the spec and prints one marked result per case, and the harness compares answers. It accepts any order only when the statement allows it, and compares decimals with a small tolerance.
4. C++ and Java programs are posted to `POST /api/execute`, which forwards them to Judge0 so the API key stays on the server. The route has a per-IP rate limit.

---

## Tech stack

**Frontend:** React 18, Vite 5, Tailwind CSS 3, Framer Motion, Monaco Editor (`@monaco-editor/react`), Recharts, Lucide icons, react-resizable-panels, Pyodide

**Backend:** Node.js, Express 4, Neon serverless Postgres (`@neondatabase/serverless`), bcryptjs, google-auth-library, Nodemailer

**Services:** Judge0 CE (C++ and Java), Razorpay (payments), Vercel (frontend hosting), Render (backend hosting)

---

## Project structure

```
.
├── backend/
│   ├── server.js                 Express app, routes, health check
│   ├── routes/
│   │   ├── auth.js               register, verify email, login, Google, profile
│   │   ├── planner.js            generate plan, update questions, carry forward
│   │   ├── problems.js           problem tracker + LeetCode statement lookup and cache
│   │   ├── execute.js            C++ and Java runs through Judge0
│   │   ├── billing.js            Razorpay plans, orders, verification
│   │   ├── tasks.js  roadmap.js  stats.js
│   └── data/
│       ├── scheduler-engine.js   builds the day-by-day plan
│       ├── neon.js  store.js     Postgres connection and storage
│       ├── auth.js  mailer.js  billing.js
│       └── neetcode150.json      the 150-problem list
├── frontend/
│   ├── index.html                splash screen
│   ├── vercel.json               SPA rewrite
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── PersonalizedPlanner/   planner wizard, sheet, day, overview
│       │   ├── CodeWorkspace/         the code editor
│       │   ├── practice/              daily problem, revision queue
│       │   ├── PracticeHub.jsx
│       │   └── ui/                    shared UI (Spinner, logo, heatmap)
│       ├── services/
│       │   ├── api.js                 API client with offline fallback
│       │   └── execution/             test harness and language runners
│       ├── data/                      problem list, premium problems, local details
│       ├── lib/                       practice schedule, splash, brand
│       └── utils/schedulerEngine.js   in-browser copy of the scheduler
└── scripts/                      import and export the problem list
```

---

## Getting started

### Requirements
- Node.js 18 or newer (the backend uses the built-in `fetch`)
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

Everything is optional for local development. With an empty `.env` the backend stores data in `backend/data/db.json` and accounts are off. See [Environment variables](#environment-variables).

### 3. Run

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
npm run build      # outputs frontend/dist
npm run preview
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Needed for | Notes |
|---|---|---|
| `DATABASE_URL` | Accounts and per-user data | Neon connection string; use the pooled host |
| `PORT` | | Defaults to `5000` |
| `GOOGLE_CLIENT_ID` | Google sign-in | OAuth client ID (Web application) |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `MAIL_FROM` | Emailing verification codes | Without SMTP, codes are printed in the server console |
| `RAZORPAY_KEY_ID` `RAZORPAY_KEY_SECRET` | Pro payments | Start with `rzp_test_` keys |
| `RAZORPAY_WEBHOOK_SECRET` | Payment webhook | Optional but recommended |
| `JUDGE0_API_KEY` | C++ and Java Run and Submit | RapidAPI key for Judge0 CE |
| `JUDGE0_URL` | Self-hosted Judge0 | Optional; no key needed when this points at your own server |
| `JUDGE0_API_HOST` | | Optional RapidAPI host header |

The server prints which features are on when it starts.

### Frontend

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Backend API base, e.g. `https://your-api.onrender.com/api` (set in `frontend/.env.production`) |

---

## Deployment

**Frontend on Vercel**
- Root directory: `frontend`, build command `npm run build`, output `dist`
- Set `VITE_API_URL` to your backend's `/api` URL
- `frontend/vercel.json` rewrites every path to `index.html`, so routes like `/practice` load directly

**Backend on Render**
- Root directory: `backend`, start command `npm start`
- Add the environment variables above; `trust proxy` is on so rate limits see the visitor's IP
- On the free tier the service sleeps when idle. The frontend splash screen waits for `/api/health` and offers *Continue offline*

---

## API reference

Base URL: `/api`. Data routes need a signed-in user when a database is configured.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Status and database check |
| GET | `/auth/config` | Which sign-in methods are on |
| POST | `/auth/register` · `/auth/verify-email` · `/auth/resend-code` | Email sign-up with a verification code |
| POST | `/auth/login` · `/auth/google` · `/auth/logout` | Sign in and out |
| GET, PATCH | `/auth/me` | Current user and profile |
| GET | `/planner/plan` · `/planner/questions` | The study plan and its problems |
| POST | `/planner/generate` | Build a plan from the wizard's answers |
| PATCH | `/planner/question/:id` | Mark solved, star, solve status, notes, `reviewed: true` |
| POST | `/planner/carry-forward` · `/planner/reset` | Move overdue problems, reset the plan |
| GET | `/problems/details/:slug` | Statement, starter code, test cases and types for a problem |
| GET, POST, PUT, DELETE | `/problems` · `/problems/:id` | Logged problems |
| PATCH | `/problems/:id/toggle-revision` | Flag a problem for revision |
| POST | `/execute` | Run a C++ or Java program on Judge0 |
| GET, POST, PUT, DELETE | `/tasks` · `/tasks/:id` | Daily tasks; `PATCH /tasks/:id/toggle`, `POST /tasks/:id/carry-over` |
| GET, PATCH | `/roadmap` · `/roadmap/week/:weekNum/topic` | Weekly roadmap |
| GET, PUT | `/stats` · `/stats/user` | Activity, streak and progress |
| GET, POST | `/billing/plans` · `/billing/order` · `/billing/verify` | Razorpay checkout |
| POST | `/billing/webhook` | Razorpay webhook (raw body, signed) |

---

## Roadmap

- [ ] Problems for the outlined sheets (A2Z Roadmap, Top 180, Quick 75, language and core CS tracks)
- [ ] Extra hidden tests for Submit on more problems (today most problems run their examples)
- [ ] A checker for problems with several valid answers
- [ ] Clone Graph and Copy List with Random Pointer in the runner (custom `Node` types)
- [ ] Submission history per problem
- [ ] Timed mock interviews
- [ ] Automated tests and CI

---

## Credits and disclaimer

- The DailyCode 150 follows the problem list and topic order of the [NeetCode 150](https://neetcode.io).
- Problem statements are loaded from LeetCode at runtime and belong to LeetCode. Daily Commit isn't affiliated with or endorsed by LeetCode or NeetCode. The Premium problems are described in our own words.
- Code execution uses [Pyodide](https://pyodide.org) and [Judge0](https://judge0.com).

No license file is included yet, so all rights are reserved by the author. Add a `LICENSE` file to allow reuse.

---

## Keywords

DSA practice · data structures and algorithms · coding interview preparation · LeetCode tracker · NeetCode 150 · study planner · spaced repetition · revision queue · daily coding problem · streak tracker · online code editor · Run and Submit · JavaScript · Python · C++ · Java · Monaco editor · Pyodide · Judge0 · React · Vite · Tailwind CSS · Node.js · Express · PostgreSQL · Neon · Razorpay · full-stack project

**Suggested GitHub topics:** `dsa` `data-structures-and-algorithms` `leetcode` `neetcode-150` `coding-interview` `interview-preparation` `spaced-repetition` `study-planner` `code-editor` `monaco-editor` `pyodide` `judge0` `react` `vite` `tailwindcss` `nodejs` `express` `postgresql` `neon`
