# Waypoint 🧭

> **Precision team task assignment and tracking tool built for tech leads who need to assign work to developers and get a project ready on time.**

Waypoint solves the core challenge tech leads face daily: knowing _who should do what_, _who is overloaded_, _what is blocked or late_, and _who performed well this month_, all in one transparent, Notion-like workspace.

---

## 🚀 Key Capabilities

- **Multi-Tenant Workspaces**: Role-based access control (`ADMIN`, `DEVELOPER`, `VIEWER`) with a centralized server-side `can()` permission engine.
- **Smart Assignment Suggestions**: Recommends eligible developers based on skill match, available capacity, and historical on-time delivery with human-readable explanations.
- **Fair Gamified Scoring**: Weighted effort scoring system rewarding timely completion and preventing bounce-backs, paired with a transparent monthly ledger and badges.
- **Tech Lead Command Center**: Workload indicators, sprint burndown metrics, dependency blocking graphs, and automated alerts.
- **Demo Mode & Mock Outbox**: Demonstrates transactional email flows (invites, verification, password resets, digests) in-app via a dedicated Demo Outbox without requiring external SMTP credentials.

---

## 🛠️ Tech Stack

| Layer                  | Technology                                                    |
| ---------------------- | ------------------------------------------------------------- |
| **Framework**          | Next.js 16 (App Router) + React 19 + TypeScript (Strict Mode) |
| **Styling**            | Tailwind CSS + Design Tokens + CSS Custom Properties          |
| **Icons & Primitives** | Lucide React + Radix Primitives                               |
| **Database & ORM**     | PostgreSQL (Neon / Supabase) + Prisma ORM 6                   |
| **Auth**               | Auth.js (NextAuth) with Credentials & Google OAuth            |
| **State & Forms**      | TanStack Query, React Hook Form, Zod validation               |
| **Drag & Drop**        | @dnd-kit (Kanban board)                                       |
| **Testing & CI**       | Vitest, ESLint, Prettier, Husky + Lint-Staged, GitHub Actions |
| **Design Source**      | Google Stitch MCP Design System                               |

---

## 📦 Project Structure

```
waypoint/
├── .github/workflows/ci.yml       # GitHub Actions CI (lint, typecheck, test, build)
├── prisma/
│   └── schema.prisma             # Complete multi-tenant PostgreSQL schema
├── public/                       # Static public assets
├── src/
│   ├── app/                      # Next.js App Router routes & layouts
│   │   ├── globals.css           # Design tokens, color system & themes
│   │   ├── layout.tsx            # Root layout with ThemeProvider & fonts
│   │   └── page.tsx              # Workspace dashboard & overview
│   ├── components/               # UI components
│   │   ├── layout/               # AppShell, Sidebar, Topbar
│   │   ├── demo-banner.tsx       # Simulated email demo notification
│   │   ├── theme-provider.tsx    # Next-themes wrapper
│   │   └── theme-toggle.tsx      # Dark/Light mode switcher
│   ├── env.ts                    # Typed environment configuration (Zod)
│   └── lib/
│       ├── db.ts                 # Prisma Client singleton
│       └── utils.ts              # cn helper (clsx + tailwind-merge)
├── .env.example                  # Environment variable reference
├── vitest.config.mjs             # Unit testing configuration
└── WAYPOINT_SPEC.md              # Project specification & source of truth
```

---

## 🏃 Getting Started

### Prerequisites

- Node.js `22.x`
- npm `10.x` or higher
- PostgreSQL database (Neon, Supabase, or local instance)

### Setup Instructions

1. **Clone the repository and install dependencies:**

   ```bash
   git clone <repo-url>
   cd Waypoint
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your database credentials and authentication secret.

3. **Generate Prisma Client:**

   ```bash
   npm run prisma:generate
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app shell.

5. **Run test suite & quality checks:**
   ```bash
   npm run typecheck    # Typecheck with tsc
   npm run lint         # ESLint check
   npm test             # Vitest unit tests
   npm run build        # Production build verification
   ```

---

## 📐 Design System & Stitch Integration

Waypoint uses a Notion-inspired visual language generated with the **Google Stitch MCP**:

- **Canvas**: Calm neutral surfaces (`#F8FAFC` light, `#0B0F19` dark)
- **Primary Brand**: Warm Indigo (`#6366F1`)
- **Semantic Accents**: Accessible status badges (Sky/In Progress, Emerald/Completed, Amber/In Review, Rose/Blocked, Violet/Milestone)
- **Geometry**: Soft 10–12px curvature with 1px structural dividing lines
