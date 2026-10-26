# BetPro Exchange — Next.js Frontend Client

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io_Client-4.8.3-010101?style=for-the-badge&logo=socketdotio)](https://socket.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)]()

A high-performance, real-time sports betting exchange web application engineered with **Next.js (App Router)**, **React 19**, and **Tailwind CSS v4**. Built to match the exact UX/UI presentation of professional exchanges such as BPExch, featuring live ball-by-ball scorecards, streaming WebSocket odds, dual Back/Lay bet slips, and full hierarchy administrative controls.

---

## ⚡ Core Features

* **Real-Time Sports Exchange**:
  * **Match Odds (H2H)**: Live Back/Lay betting with dynamic depth ladder (volume quotes) and visual flash indicators on rate shifts.
  * **Bookmaker Market**: Fast-settling bookmaker markets with automatic commission netting and full book exposure.
  * **Toss Market**: Universal toss market (`1.98` Back / `2.02` Lay) with pre-match locking, live match completion badges, and instant admin declaration.
  * **Fancy & Fancy-2 Markets**: Over-by-over run markets (e.g. "6 Over Total Run", "10 Over Total Run", "Fall of 1st Wicket") with yes/no rate slips.
  * **Figure Market**: Unique last-digit run prediction grid (Digits 0–9) with individual odds and digit-specific exposures.
  * **Even / Odd Market**: Team total run parity markets (Kalli / Jotti) with real-time settlement.
  * **Tied Match**: Direct hedge market for drawn or tied fixtures.

* **Bet Slip & Calculation Engine**:
  * Seamless slide-out Bet Slip supporting both **Back** (profit = stake × (odds - 1)) and **Lay** (liability = stake × (odds - 1)) modes.
  * Real-time potential profit and liability preview before order submission.
  * Rapid stake chips (`+1k`, `+5k`, `+10k`, `+25k`, `+50k`, `+100k`) and max-stake validation per market type.

* **Live Cricket Center & Scorecard**:
  * Real-time ball-by-ball updates, current run rate (CRR), required run rate (RRR), partnership stats, and current bowler/batsman metrics.
  * Integrated BPExch TV live video streaming player with theatre mode and audio controls.

* **Multi-Tier Hierarchy Views**:
  * Tailored interfaces for **Users**, **Masters**, **Super Masters**, **Admins**, and **Super Admins**.
  * Dynamic Profit/Loss exposure displayed directly beneath each runner in bold green (`+`) or bold red (`-`).
  * Admin quick result and toss winner declaration panels for instant cross-tier settlement.

* **Casino & Arcade Suite**:
  * Interactive Aviator crash game with PixiJS canvas rendering and audio engine.
  * Live Teen Patti, Dragon Tiger, and Roulette modules.

---

## 🏗️ Architecture & Directory Structure

```
betproexchange/
├── app/                              # Next.js App Router (Routes & Layouts)
│   ├── layout.jsx                    # Root layout with Geist font & providers
│   ├── page.jsx                      # Landing / redirect controller
│   ├── login/                        # Authentication portal
│   ├── dashboard/                    # Primary user exchange dashboard
│   │   ├── bets/                     # User bet history & statement
│   │   ├── casino/                   # Live casino lounge
│   │   └── aviator/                  # Real-time Aviator crash game
│   ├── admin/                        # Admin operations & user management
│   ├── superadmin/                   # Platform root governance
│   └── master/                       # Agent hierarchy portal
├── components/                       # Modular UI Components
│   ├── MatchDetail.jsx               # User match view (Scorecard, Odds, TV, Toss)
│   ├── MatchDetailAdminView.jsx      # Admin match view (Declarations, Full Books)
│   ├── BetSlip.jsx                   # Order placement slip with real-time liability
│   ├── DashboardLayout.jsx           # Global state provider & responsive shell
│   ├── DashboardContent.jsx          # Match list & sports classification
│   ├── RightPanel.jsx                # Collapsible desktop bet slip & position book
│   ├── Header.jsx                    # Navigation, wallet balance & profile dropdown
│   └── Sidebar.jsx                   # Multi-sport sidebar navigation
├── lib/                              # Client Utility Libraries
│   ├── apiConfig.js                  # Dynamic API base URL resolver (Local / Prod)
│   ├── auth.js                       # JWT session storage & role validation
│   ├── betCalc.js                    # Core exchange math, books, and P/L netting
│   ├── casinoSoundFX.js              # Synthesized Web Audio API sound generator
│   └── useAviatorStore.js            # Zustand store for Aviator game loop
├── public/                           # Static Assets (Logos, banners, icons)
├── package.json                      # Dependencies and scripts
└── next.config.mjs                   # Next.js compilation settings
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16.2.3](https://nextjs.org/) (App Router) |
| **Runtime** | [React 19.2.4](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS |
| **Real-time Comms** | [Socket.io-Client 4.8.3](https://socket.io/) (Bi-directional WebSocket) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **State Management** | React Context + [Zustand 5](https://github.com/pmndrs/zustand) |
| **Canvas / Graphics** | [Pixi.js v8](https://pixijs.com/) (Aviator animation engine) |

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm** or **pnpm**
* Backend server running on `http://localhost:5000` (or configured via environment)

### 2. Environment Configuration
Create a `.env.local` file in the root of `betproexchange/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🔌 WebSocket Events Consumed

The frontend client connects via Socket.io to receive sub-second updates:

| Event | Description |
|---|---|
| `match_updated` | Triggered when match h2h odds change or match starts/completes |
| `live_score_update` | Official live scores (runs, wickets, overs, current ball, run rates) |
| `toss_odds_update` | Toss market status, active pre-match odds, and winner settlement |
| `bookmaker_odds_update` | Real-time bookmaker market Back/Lay odds and depth volume |
| `fancy_market_update` | In-play over-run fancy lines and rate adjustments |
| `figure_market_update` | Live digit (0–9) figure odds updates |
| `bet_settled` | Instant notification when a user bet has been won, lost, or refunded |
| `wallet_updated` | Balance synchronization across active sessions |

---

## 📄 License

Proprietary and Confidential. Unauthorized copying, transferring, or reproduction of this software via any medium is strictly prohibited.
