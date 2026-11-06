# 🔥 CodeStreak — Full-Stack DSA Learning Planner & Problem Tracker

<div align="center">

![CodeStreak](https://img.shields.io/badge/CodeStreak-DSA%20Platform-0066FF?style=for-the-badge&logo=codeforces&logoColor=white)
![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

**A high-performance, dark/light themed daily DSA learning planner, LeetCode problem tracker, consistency streak manager, structured interview roadmap, and standalone Practice Hub (`/practice/dsa`).**

</div>

---

## 📖 Table of Contents
- [✨ Key Features & Modules](#-key-features--modules)
- [🚀 Practice Hub (`/practice/dsa`)](#-practice-hub-practicedsa)
- [🎨 Design System & Dual-Theme Architecture](#-design-system--dual-theme-architecture)
- [📱 Mobile OTP Authentication](#-mobile-otp-authentication)
- [📁 Project Architecture](#-project-architecture)
- [⚡ Quick Start Guide](#-quick-start-guide)
- [🌐 REST API Specification](#-rest-api-specification)
- [🖋️ Typography & Fonts](#️-typography--fonts)

---

## ✨ Key Features & Modules

### 1. 🚀 Agency-Grade Hero & Brand Marquee
- **Modern Clean Typography**: Refined Inter/Outfit non-bold heading hierarchy with `#0066FF` brand accents.
- **Social Proof**: Stacked coder avatars, live 4.9/5 rating counter from 15,000+ active users.
- **Continuous Brand Slider**: Seamless marquee featuring tier-1 tech target companies (Google, Microsoft, Amazon, Meta, Apple, Netflix, Stripe, LeetCode, OpenAI, Uber, Airbnb, Spotify, etc.).
- **Direct Practice Hub Trigger**: 1-click CTA button routing directly to `/practice/dsa`.

### 2. 📋 Interactive Study Sprint (TaskSteps) & Calendar
- **Interactive Stepper**: Visual step-by-step sprint tracker (Morning Algorithm Sprint, Core Problem Drills, Spaced Revision, Mock Timed Practice).
- **Study Calendar Widget**: Interactive month-grid calendar with day-selection, today highlights, and active drill quotas.
- **Task Actions**: 1-click task completion toggling, carry-over incomplete tasks, and custom priority tags.

### 3. 🎯 Problem Tracker & Independence Metrics
- **Algorithmic Vault**: Search, filter, and review solved LeetCode and HackerRank problems.
- **Honesty Metric**: Track real solution independence (`Independently`, `Needed Hint`, `Looked at Solution`).
- **Complexity Breakdown**: Document O(N) time and space complexity reflections for each problem.

### 4. 🔄 Spaced Repetition Revision Queue
- **Automated Retention**: Tricky problems and hint-dependent questions are automatically prioritized for spaced review.
- **Revision Badges**: Real-time revision counter badge in the floating navigation bar.

### 5. 🛠️ Interactive Feature & Concept Showcases
- **Features 13 Block**: 4 interactive feature accordions with active indicator bars and live animated preview panels.
- **How It Works 7 Block**: Step-by-step workflow simulator displaying how daily practice transitions into interview readiness.
- **Integrations 3**: Developer tool integration showcase (LeetCode, GitHub, VS Code, Discord, Calendar).
- **FAQs 01 Accordion**: Clean expandable FAQ component addressing spaced repetition, study schedules, and problem tracking.

### 6. 📊 Live System Footer (Footer 12)
- **Dark Newsletter Panel**: Newsletter sign-up with instant feedback validation.
- **Real-Time System Vitals**: Live uptime indicators for API Server (99.9%), DSA Engine (100%), Revision Queue (99.7%), and Streak Tracker (99.9%).
- **Real-Time Metric Counters**: Active day streak, total solved problems, and pending revisions.

---

## 🚀 Practice Hub (`/practice/dsa`)

A dedicated, full-screen standalone practice destination inspired by **takeUforward's Prep Hub**:

- **Standalone Routing**: Accessible directly at `http://localhost:3000/practice/dsa`, isolated from the main dashboard layout.
- **3-Column Workspace**:
  - **Left Navigation Sidebar**: Quick routing between Prep Hub, DSA Sheets, Core CS & SQL, System Design, Planly, and community links, with 1-click return to Dashboard.
  - **Middle Content Feed**: Curated sheets grouped by mastery level with search filtering, completion progress dials, and module tags:
    - *C++ for Beginners* & *Python for DSA* (Learn From Zero)
    - *Striver's A2Z DSA Sheet* (455 Problems, Steps 1 to 18)
    - *Striver's SDE Sheet (Top 180)* (FAANG Benchmark)
    - *Striver's 75 Sheet* (Blind 75 Equivalent)
    - *High-Level Design (HLD) Master* (System Architecture)
    - *Operating Systems & DBMS for Interviews* (Core CS)
  - **Right Promotion & Planner Panel**: Live festive offer banner (`GARBA45`) with active countdown timer (`06:42:47`) and embedded Quick Planner drill checklist.
- **Interactive Curriculum Syllabus Modal**:
  - Clicking **"Explore ->"** on any sheet opens a full interactive syllabus drawer.
  - Check off completed steps and drills with local persistence and celebratory confetti effects.
  - Direct external problem links to LeetCode and practice portals.

---

## 🎨 Design System & Dual-Theme Architecture

- **Color Tokens**:
  - Primary Brand: Electric Blue (`#0066FF`) & Cyan (`#00C2FF`)
  - Dark Mode: Pure Black (`#000000`) & Deep Void (`#07090e`, `#0c0e14`)
  - Light Mode: Clean Slate (`#f8fafc` / `#ffffff`)
- **Theme Switcher**: Smooth, 1-click dark/light mode toggle embedded in the floating navigation pill with persistent context state (`ThemeContext`).
- **Floating Spring Nav Bar**:
  - Adaptive pill navigation with spring-loaded active tab expansions.
  - Scroll-aware collapsing with brand logo and action button animations.
  - Quick action modal triggers for adding tasks and logging problems on the fly.

---

## 📱 Mobile OTP Authentication

- **Passwordless Security**:
  - **Backend**: Generates secure 6-digit OTPs, validates expiration, and maintains simulated sessions in `data/db.json`.
  - **Frontend**: 6-digit auto-advancing OTP input modal with resend countdown timer and user session badge in the navbar.

---

## 📁 Project Architecture

```text
CodeStreak/
├── frontend/                          # React 18 + Vite + Tailwind CSS
│   ├── index.html                     # Preconnected Google Fonts & Root DOM
│   ├── package.json                   # Dependencies & Scripts
│   ├── tailwind.config.js             # Extended color tokens & typography
│   ├── vite.config.js                 # Vite dev server configuration (Port 3000)
│   └── src/
│       ├── main.jsx                   # React Entry Point with ThemeProvider
│       ├── App.jsx                    # Application Shell & Client-Side HTML5 Router
│       ├── index.css                  # Global styles, fonts & glass classes
│       ├── context/
│       │   └── ThemeContext.jsx       # Dark / Light Theme Context & State
│       ├── components/
│       │   ├── PracticeHub.jsx        # Standalone /practice/dsa takeUforward Hub
│       │   ├── Explore.jsx            # PracticeHub Alias Component
│       │   ├── Hero22.jsx             # Agency Hero Section Wrapper
│       │   ├── Dashboard.jsx          # Main Overview Page Layout
│       │   ├── Navbar.jsx             # Top Floating Expanding Nav Pill
│       │   ├── Footer.jsx             # Footer 12 with Vitals & Newsletter
│       │   ├── DailyPlanner.jsx       # Task Planner with Carry-Over
│       │   ├── ProblemTracker.jsx     # LeetCode Log with Multi-Filters
│       │   ├── RoadmapView.jsx        # Milestone Roadmap & Syllabus
│       │   ├── RevisionQueue.jsx      # Spaced Repetition Queue
│       │   ├── StatsCharts.jsx        # Recharts Analytics Dashboards
│       │   ├── FocusTimer.jsx         # Pomodoro Sprint Stopwatch
│       │   ├── AuthModal.jsx          # Mobile Number OTP Login Modal
│       │   ├── AddTaskModal.jsx       # Task Creation Dialog
│       │   ├── AddProblemModal.jsx    # Problem Logging Dialog
│       │   ├── reactbits/             # Interactive Visual ReactBits
│       │   └── ui/                    # Magic UI & Custom Design System Primitives
│       │       ├── AgencyHeroSection.jsx
│       │       ├── CodeStreakLogo.jsx
│       │       ├── bottom-nav-bar.jsx
│       │       ├── task-steps.tsx     # Study Sprint Stepper
│       │       ├── faqs-01.jsx        # Expandable FAQ Accordion
│       │       ├── integrations-3.jsx # Developer Integrations
│       │       └── hero-01-utils/     # Hero Subcomponents & Brand Slider
│       └── services/
│           └── api.js                 # Unified API Client with Offline Fallback
│
└── backend/                           # Node.js + Express REST API (Port 5000)
    ├── package.json                   # Backend Dependencies
    ├── server.js                      # Express App, CORS & Route Registry
    ├── routes/
    │   ├── auth.js                    # Mobile OTP Authentication Endpoints
    │   ├── tasks.js                   # Daily Tasks CRUD & Carry-over
    │   ├── problems.js                # Problem Tracker & Revision Endpoints
    │   ├── roadmap.js                 # Roadmap Modules & Subtopics
    │   └── stats.js                   # Aggregated Metrics & Heatmap Data
    └── data/
        ├── store.js                   # In-memory Storage Adapter
        └── db.json                    # Persistent JSON Database
```

---

## ⚡ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` or `yarn`

### 1. Run the Backend API Server
```bash
cd backend
npm install
npm run dev   # or npm start
```
> Server runs on: `http://localhost:5000`  
> Health check: `http://localhost:5000/api/health`

### 2. Run the Frontend Client
```bash
cd frontend
npm install
npm run dev
```
> Frontend runs on: `http://localhost:3000`  
> Standalone Practice Hub: `http://localhost:3000/practice/dsa`

*Note: The frontend includes full offline support with `localStorage` fallback if the backend is not running.*

---

## 🌐 REST API Specification

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Send 6-digit OTP to mobile number |
| `POST` | `/api/auth/verify-otp` | Verify OTP and issue session token |
| `GET` | `/api/auth/me` | Fetch active authenticated user profile |
| `POST` | `/api/auth/logout` | Clear authenticated session |
| `GET` | `/api/tasks` | Get all tasks for the current day |
| `POST` | `/api/tasks` | Create a new daily study task |
| `PATCH` | `/api/tasks/:id/toggle` | Toggle task completion status |
| `POST` | `/api/tasks/carry-forward` | Carry over incomplete tasks to today |
| `GET` | `/api/problems` | Retrieve all logged solved problems |
| `POST` | `/api/problems` | Log a new solved problem |
| `PATCH` | `/api/problems/:id/revision` | Toggle spaced repetition flag |
| `GET` | `/api/roadmap` | Get weekly structured roadmap syllabus |
| `PATCH` | `/api/roadmap/toggle-topic` | Update subtopic checkpoint progress |
| `GET` | `/api/stats` | Aggregated metrics, streak & heatmap points |

---

## 🖋️ Typography & Fonts

The application uses Google Fonts configured in `index.html` and `tailwind.config.js`:

- **Primary UI**: `Inter` / `Outfit` (`font-sans`)
- **Code & Metrics**: `JetBrains Mono` (`font-mono`)
- **Weights**: Clean, modern weights (400 regular, 500 medium, 600 semibold) avoiding heavy bold text for optimal readability.

---

<div align="center">
  <sub>Built with ❤️ for passionate engineers mastering Data Structures & Algorithms.</sub>
</div>
