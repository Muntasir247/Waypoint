# Waypoint: Project Specification

> **Read this entire file before writing any code.** It is the single source of truth for the project. If something is not specified here, **do not guess**: stop and ask the developer.

---

## 0. How to work (instructions for the AI coding assistant)

1. Build in the **phases** defined in Section 12, in order. Do not skip ahead.
2. At the end of each phase: run lint, type-check, and tests; summarize what was built; then **stop and wait for approval** before starting the next phase.
3. **Ask before assuming.** Anything marked `OPEN` in this file, or anything not covered, must be raised as a question.
4. **UI is generated with the Google Stitch MCP.** For every screen listed in Section 9, call Stitch to generate the design first, then implement it with the stack in Section 2. Do not hand-invent layouts when Stitch can produce them. If Stitch output conflicts with this spec's design system, the design system wins.
5. Commit in small, meaningful commits using Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
6. Never commit secrets. Use `.env.local` for development and keep `.env.example` up to date.
7. Verify current stable versions of all libraries before installing. Do not rely on memory for version numbers or APIs; check the official docs.

---

## 1. Product overview

**Name:** Waypoint
**One-liner:** A team task assignment and tracking tool built for tech leads who need to assign work to developers and get a project ready on time.

**Primary user:** Tech Lead (admin) who creates projects, breaks work into tasks, assigns them wisely, and monitors progress.
**Secondary users:** Developers (do the work), Viewers/Stakeholders (read-only).

**Core problem solved:** A tech lead needs to know _who should do what_, _who is overloaded_, _what is blocked or late_, and _who performed well this month_, all in one place.

**Project nature:** This is a **portfolio showcase / demo project**, but it must be architected and implemented as a real, fully working product. Anything that is mocked (see Section 8) must be clearly labeled as a demo in the UI.

---

## 2. Tech stack (industry standard, deployed on Vercel)

| Concern          | Choice                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| Framework        | **Next.js** (App Router) + **TypeScript** (strict mode)                        |
| Styling          | **Tailwind CSS** + **shadcn/ui** (Radix primitives)                            |
| Icons            | lucide-react                                                                   |
| Database         | **PostgreSQL** (serverless Postgres, e.g. Neon via the Vercel Marketplace)     |
| ORM              | **Prisma** with migrations                                                     |
| Auth             | **Auth.js (NextAuth)**: Credentials (email + password) and **Google OAuth**    |
| Password hashing | argon2 or bcrypt (pick one, document why)                                      |
| Validation       | **Zod** (shared between client forms and server actions/route handlers)        |
| Forms            | react-hook-form + zod resolver                                                 |
| Server state     | TanStack Query (client) + Server Components/Server Actions where appropriate   |
| Drag and drop    | dnd-kit (Kanban)                                                               |
| Charts           | Recharts                                                                       |
| File uploads     | Vercel Blob (attachments, avatars)                                             |
| Scheduled jobs   | Vercel Cron (monthly score close, digest generation, overdue checks)           |
| Testing          | Vitest (unit), Playwright (E2E on critical flows)                              |
| Quality          | ESLint, Prettier, Husky + lint-staged, `tsc --noEmit`                          |
| CI               | GitHub Actions (lint, type-check, test, build on every PR)                     |
| Hosting          | **Vercel**, auto-deployed from GitHub (preview per PR, production from `main`) |

**Real-time:** not required. Use optimistic updates plus revalidation/polling. Do not add WebSockets.

**Architecture rules**

- Feature-based folder structure (e.g. `src/features/tasks`, `src/features/workspaces`), not type-based dumping grounds.
- All authorization is enforced **server-side** through one central permission helper (Section 5). Hiding buttons in the UI is never sufficient.
- Every mutation validates input with Zod and verifies workspace membership and role.
- Database access only through a data layer (no Prisma calls inside UI components).
- Environment variables validated at startup with a typed env module.

---

## 3. Domain model (multi-workspace)

A user can belong to **multiple workspaces**. Each workspace has its own members, roles, projects, scoring rules and data. All data is scoped by `workspaceId`; never leak data across workspaces.

### Entities (Prisma models, adjust field details as needed)

- **User**: id, name, email (unique), emailVerified, passwordHash (nullable for OAuth-only), image, createdAt
- **Account / Session / VerificationToken**: Auth.js standard tables
- **Workspace**: id, name, slug (unique), createdById, createdAt
- **Membership**: id, userId, workspaceId, role (`ADMIN` | `DEVELOPER` | `VIEWER`), availability (`ACTIVE` | `ON_LEAVE` | `OVERLOADED`), joinedAt. Unique on (userId, workspaceId).
- **Invite**: id, workspaceId, email, role, token (hashed), expiresAt, acceptedAt, invitedById
- **Skill**: id, workspaceId, name. **MemberSkill**: membershipId, skillId, level (1 to 5)
- **Project**: id, workspaceId, name, description, status (`PLANNING` | `ACTIVE` | `ON_HOLD` | `COMPLETED`), targetDate, createdAt
- **Sprint**: id, projectId, name, goal, startDate, endDate, status (`PLANNED` | `ACTIVE` | `CLOSED`)
- **Milestone**: id, projectId, name, dueDate, description
- **Task**: id, projectId, sprintId (nullable), milestoneId (nullable), title, description (markdown), status (`TODO` | `IN_PROGRESS` | `IN_REVIEW` | `DONE` | `BLOCKED`), priority (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`), estimatePoints (1, 2, 3, 5, 8), dueDate, assigneeId (membership, nullable), createdById, position (for ordering), completedAt, createdAt
- **ChecklistItem** (subtasks): id, taskId, text, done, position
- **TaskDependency**: taskId, dependsOnTaskId (a task cannot move to `IN_PROGRESS` while a dependency is not `DONE`; prevent cycles)
- **Label** and **TaskLabel**
- **Comment**: id, taskId, authorId, body (markdown, supports @mentions), createdAt
- **Attachment**: id, taskId, type (`FILE` | `LINK`), url, name
- **TimeEntry**: id, taskId, membershipId, minutes, note, loggedAt
- **ActivityLog**: id, taskId, actorId, action, from/to values (JSON), createdAt (powers the task history)
- **AuditLog**: id, workspaceId, actorId, action, target, metadata, createdAt (sensitive actions only: deletions, role changes, member removal, scoring rule changes)
- **Notification**: id, userId, workspaceId, type, payload, readAt, createdAt
- **MockEmail**: id, to, subject, body, kind, createdAt (the demo outbox, see Section 8)
- **ScoringConfig**: workspaceId (unique), rules (JSON; see Section 7)
- **ScoreEvent**: id, membershipId, taskId, points, reason, createdAt
- **MonthlyResult**: id, workspaceId, membershipId, month (YYYY-MM), totalPoints, tasksCompleted, onTimeRate, rank
- **Badge** and **MemberBadge**
- **SavedFilter**: id, userId, workspaceId, name, query (JSON)

Add sensible indexes (workspaceId, assigneeId, status, dueDate) and use soft deletes only where history matters (tasks may be hard-deleted by admins but the deletion must be audit-logged).

---

## 4. Authentication and accounts

- Sign up (email + password), login, logout.
- **Google OAuth** login and signup.
- Password rules enforced server-side (min length, no trivially weak passwords).
- Password reset flow and email verification flow (delivery is mocked, see Section 8, but the token logic must be real: hashed, single-use, expiring).
- **Invite-only team joining:** an Admin creates an invite (email + role) and gets a shareable link. The invitee signs up or logs in and joins the workspace. Invites expire and are single-use.
- After signup a user can **create a workspace** (becoming its Admin) or **accept an invite**.
- Workspace switcher in the app shell for users in several workspaces.
- Rate-limit login, signup and reset endpoints.
- Secure cookies, CSRF protection (as provided by Auth.js), and no sensitive data in JWT payloads.

---

## 5. Roles and permissions (RBAC)

Roles are **per workspace** (stored on `Membership`).

| Action                                      | Admin (Tech Lead) | Developer                                           | Viewer |
| ------------------------------------------- | ----------------- | --------------------------------------------------- | ------ |
| View workspace, projects, tasks             | Yes               | Yes                                                 | Yes    |
| Create / edit projects, sprints, milestones | Yes               | No                                                  | No     |
| Create tasks                                | Yes               | Yes (optional per workspace setting, default: no)   | No     |
| Edit any task's details                     | Yes               | No (only own assigned tasks' description/checklist) | No     |
| Assign / reassign tasks                     | Yes               | No                                                  | No     |
| Update status of a task                     | Yes (any)         | **Own assigned tasks only**                         | No     |
| **Delete a task**                           | **Yes**           | **No**                                              | No     |
| Comment, @mention                           | Yes               | Yes                                                 | No     |
| Log time                                    | Yes               | Own tasks                                           | No     |
| Manage members, invites, roles              | Yes               | No                                                  | No     |
| Configure scoring rules                     | Yes               | No                                                  | No     |
| View leaderboard and reports                | Yes               | Yes                                                 | Yes    |
| View audit log                              | Yes               | No                                                  | No     |
| Bulk reassign                               | Yes               | No                                                  | No     |

Implementation requirements:

- One central module, e.g. `can(user, action, resource)`, used by every server action and route handler.
- Unit tests covering the full matrix above.
- A workspace must always keep at least one Admin (prevent removing or demoting the last one).

---

## 6. Feature list

### 6.1 Profiles

- Profile page: name, avatar upload, role (per workspace), skills with levels, availability status.
- Personal stats: tasks completed, on-time rate, average completion time, current points, badges.
- A "My Tasks" view (default landing page for developers).

### 6.2 Tasks (core)

- Create with title, description, priority, due date, estimate, labels, assignee.
- Assign / reassign (Admin).
- Status flow: `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`, plus `BLOCKED` (requires a short reason).
- Checklist/subtasks, dependencies, comments with @mentions, attachments and links (PRs, Figma, docs).
- Time logging.
- Full activity history per task.
- Delete (Admin only, with confirmation, audit-logged).

### 6.3 Projects and planning

- Multiple projects per workspace.
- Sprints and milestones, so a project has a clear "ready by" target.
- Backlog with prioritization.
- Views: **Kanban (drag and drop)**, list, calendar, timeline (Gantt-style).

### 6.4 Tech lead tools (the differentiator)

- **Workload view:** per-developer open tasks, total estimate points, and capacity indicator.
- **Smart assignment suggestions** (algorithm in Section 7.2), shown when assigning, always explainable ("why this person").
- **Overdue and blocked alerts** on the dashboard.
- **Project dashboard:** completion percentage, burndown chart, status breakdown, upcoming due dates.
- **Bulk actions:** select many tasks, reassign, change status/priority/sprint. Includes "reassign all tasks of a member going on leave".

### 6.5 Scoring and recognition (see Section 7)

- Points per completed task, monthly leaderboard, top performer summary, badges, configurable rules.

### 6.6 Notifications (in-app real, email mocked)

- In-app notifications for: assignment, status change, mention, due soon, overdue, blocked, invite, monthly results.
- Notification center with unread count and mark-as-read.
- Email digests and transactional emails are **mocked** (Section 8).
- Optional Slack/Discord webhook: **out of scope for now** (`OPEN` if the developer wants it later).

### 6.7 Reporting

- Monthly report per developer and per project.
- Export to **CSV** and **PDF**.
- Audit log viewer (Admin).

### 6.8 Quality of life

- Global search and filters (assignee, status, label, priority, due date), saved filters.
- Dark mode and light mode.
- Fully responsive (mobile-friendly Kanban and lists).
- Empty states, loading skeletons, error boundaries, toasts.
- Keyboard shortcuts for common actions (create task, search).
- Accessibility: WCAG AA contrast, keyboard navigation, correct ARIA via Radix.

---

## 7. Scoring and smart assignment

### 7.1 Scoring system (defaults, configurable per workspace by Admin)

Fairness principle: score by **weighted effort**, not task count, so nobody gains by cherry-picking trivial tasks.

```
basePoints      = estimatePoints × priorityMultiplier
priorityMultiplier: LOW 1.0 | MEDIUM 1.25 | HIGH 1.5 | CRITICAL 2.0

onTime (completed on/before dueDate)  → points = basePoints × 1.2
late                                  → points = basePoints × 0.5
no dueDate                            → points = basePoints
task sent back from IN_REVIEW to IN_PROGRESS → -10% of basePoints per bounce (min 50% of basePoints)
```

- Points are awarded when a task reaches `DONE`, recorded as `ScoreEvent`s (an immutable ledger). If a task is reopened, add a reversing event; never edit past events.
- **Monthly close:** a Vercel Cron job (and a manual "recompute" button for Admins) aggregates `ScoreEvent`s into `MonthlyResult`, ranks members, and creates the "Top performer" summary and notifications.
- **Leaderboard:** current month live, with history of previous months.
- **Badges** (examples, make them data-driven): "Streak: 5 on-time tasks", "Bug Squasher" (N tasks labeled `bug` completed), "Reviewer's Choice" (zero bounces in a month), "Workhorse" (highest points in a month).
- Show the **scoring breakdown** for every score so results are transparent.
- A workspace setting can disable the whole scoring system (it is optional).

### 7.2 Smart assignment (suggestion only, never auto-assigns)

For a given task, rank eligible members (role `DEVELOPER`, availability not `ON_LEAVE`):

```
suitability = 0.5 × skillMatch + 0.3 × capacityScore + 0.2 × onTimeHistory
skillMatch     = overlap between task labels/skill tags and member skills (weighted by level)
capacityScore  = 1 - (member's open estimate points / capacity limit), clamped 0..1
onTimeHistory  = member's on-time rate over the last 90 days (neutral value if no history)
```

- Show top 3 suggestions with a plain-language reason for each.
- Weights live in `ScoringConfig` so they can be adjusted later.
- Capacity limit default: 20 open estimate points per member (configurable).

---

## 8. Demo mode and mocked services

This is a demo project. The following **must be clearly labeled in the UI**:

- A persistent, dismissible-per-session **banner**: _"Demo project: emails are simulated and no real messages are sent."_
- **Emails are mocked.** Create an `EmailProvider` interface with a `MockEmailProvider` implementation that stores messages in the `MockEmail` table instead of sending them. A real provider can be dropped in later without touching feature code.
- A **"Demo Outbox"** page (visible inside the app) lists all mock emails (invites, verification, password reset, digests) with working links, so every flow can be completed and demonstrated end to end.
- Where an email would normally be sent, also show a toast such as _"Demo: email simulated, see Demo Outbox."_
- Add a **seed script** (`prisma/seed.ts`) that creates a realistic demo workspace:
  - 1 Tech Lead (admin), 5 developers with varied skills and availability, 1 viewer
  - 2 projects with sprints, milestones, ~40 tasks across all statuses, dependencies, comments, and some overdue/blocked items
  - One **previous closed month** of score data so the leaderboard and reports are populated
- Add a **"Try the demo"** entry on the login page with one-click sign-in buttons for the Tech Lead, a Developer, and a Viewer (demo accounts only, enabled via an environment flag).

---

## 9. Screens (generate each with Google Stitch MCP first)

1. Landing / marketing page (short, explains the product, "Try the demo" button)
2. Sign up, Login, Forgot password, Reset password, Verify email
3. Accept invite
4. Create workspace / workspace switcher
5. Dashboard (Admin): project progress, burndown, overdue/blocked alerts, workload summary, top performer
6. My Tasks (Developer home)
7. Projects list, Project detail (overview, backlog, sprints, milestones)
8. Kanban board (drag and drop), List view, Calendar view, Timeline view
9. Task detail (drawer or page): fields, checklist, dependencies, comments, attachments, time log, activity history
10. Create/Edit task modal with smart assignment suggestions
11. Workload view
12. Team/Members (invites, roles, availability, remove member)
13. Profile page (own and others')
14. Leaderboard and monthly results, scoring rules settings
15. Reports and exports
16. Notification center
17. Audit log
18. Workspace settings
19. Demo Outbox
20. Empty, loading, error and 404 states

### Design system

- **Style:** colorful and friendly, Notion-like. Soft rounded corners, generous whitespace, approachable and playful but still professional.
- Calm neutral surfaces, with **color used meaningfully**: distinct, accessible colors per status and per priority, colorful label chips, friendly avatars with colored fallbacks.
- Light and dark themes, both polished. Define colors as design tokens (CSS variables) and reuse them everywhere.
- A clean, readable sans-serif typeface (choose one and document it), clear hierarchy, subtle micro-interactions (hover, drag, status change).
- Consistent components via shadcn/ui; do not mix in other UI kits.
- Include illustrations or friendly icons on empty states.

---

## 10. Non-functional requirements

- **Security:** server-side authorization everywhere, input validation, rate limiting, hashed tokens, no secrets in the repo, secure headers. Follow OWASP basics (prevent IDOR by always scoping queries by workspace).
- **Performance:** paginate lists, avoid N+1 queries, index hot paths, lazy-load heavy views (timeline, charts).
- **Reliability:** database transactions for multi-step writes (e.g. status change + activity log + score event + notification).
- **Testing:** unit tests for permissions, scoring, smart assignment and dependency/cycle logic. Playwright E2E for: sign up → create workspace → invite → assign task → developer updates status → developer cannot delete → leaderboard updates.
- **Documentation:** a good `README.md` (what it is, screenshots, tech stack, architecture diagram, setup, env vars, seed instructions, deployment steps, demo credentials) since this is a portfolio piece.

---

## 11. Environment and deployment

- GitHub repository, deployed to **Vercel** from GitHub (preview deployments on PRs, production from `main`).
- Provision serverless Postgres and Vercel Blob; run Prisma migrations on deploy (document the exact build command).
- Provide `.env.example` listing every variable, for example: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`, `NEXT_PUBLIC_DEMO_MODE`.
- Protect cron endpoints with `CRON_SECRET`.
- Provide step-by-step instructions for the developer to create the Google OAuth credentials and set redirect URIs for both local and production URLs.

---

## 12. Build phases

Stop for approval at the end of each phase.

**Phase 0: Foundation**
Repo setup, Next.js + TypeScript + Tailwind + shadcn/ui, ESLint/Prettier/Husky, typed env module, Prisma + Postgres connection, CI workflow, Vercel deployment of a "hello world", design tokens and theme (light/dark), app shell, and Stitch designs for the shell.
_Done when:_ a deployed empty app with themes and CI passing.

**Phase 1: Auth**
Credentials signup/login/logout, Google OAuth, password reset and email verification (mock email provider + Demo Outbox + demo banner), rate limiting.
_Done when:_ all auth flows work end to end, including via the Demo Outbox.

**Phase 2: Workspaces, members, RBAC, profiles**
Create workspace, switcher, invites (create/accept/expire), roles, central `can()` module with full test matrix, member management, profiles with skills, availability and avatar upload.
_Done when:_ an Admin can invite a developer who joins with the right role and permissions are enforced server-side.

**Phase 3: Projects and tasks (core)**
Projects, sprints, milestones, task CRUD, status flow with Blocked reason, checklist, comments with mentions, attachments/links, time logging, activity history, dependencies with cycle prevention, Admin-only delete with audit log.
_Done when:_ a Developer can update only their own tasks' status and cannot delete; Admin can do everything.

**Phase 4: Views**
Kanban with drag and drop, list view, calendar view, timeline view, search, filters, saved filters, My Tasks.
_Done when:_ all views reflect the same data and respect permissions.

**Phase 5: Tech lead tools**
Workload view, smart assignment suggestions with explanations, project dashboard (completion, burndown), overdue/blocked alerts, bulk actions.

**Phase 6: Scoring**
Scoring config, score ledger, live leaderboard, monthly close cron + manual recompute, top performer summary, badges, score breakdown UI.

**Phase 7: Notifications and reporting**
In-app notification center, mock email digests (daily/weekly via cron), monthly reports, CSV and PDF export, audit log viewer.

**Phase 8: Polish and demo**
Landing page, seed script with realistic demo data, "Try the demo" logins, empty/loading/error states, responsive pass, accessibility pass, keyboard shortcuts, E2E tests, README with screenshots, final production deploy.
_Done when:_ a stranger can open the deployed URL, click "Try the demo", and explore every feature with populated data.

---

## 13. Open questions (ask the developer before building the related part)

- `RESOLVED` Should developers be allowed to **create** tasks? **No (Admin only by default; toggleable via workspace setting).**
- `RESOLVED` Slack/Discord webhook integration: **Out of scope for MVP.**
- `RESOLVED` GitHub integration (link PRs to tasks automatically): **Out of scope for MVP.**
- `RESOLVED` Brand assets: **Waypoint icon (geometric compass/waypoint mark), tagline: "Precision task assignment & tracking for high-velocity teams".**
- `RESOLVED` Custom domain, or the default `*.vercel.app` URL? **Default `*.vercel.app` deployment.**
- `RESOLVED` Any preferred typeface or brand color to anchor the Notion-like palette? **Inter font, Warm Indigo (`#6366F1`) & Slate palette, Notion-like calm neutral canvas with accessible status colors.**
- `RESOLVED` Confirm the scoring defaults in Section 7 (multipliers, bonuses, capacity limit of 20 points) or provide your own. **Confirmed Section 7 spec defaults.**
- `RESOLVED` Package manager: **npm (v10.9.3, Node v22).**

When any `OPEN` item becomes relevant to the current phase, ask the developer, record the answer in this file, and continue.
