import { PrismaClient, Role, TaskStatus, Priority, Availability } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Waypoint demo database seed...");

  // 1. Password Hash for demo accounts
  const defaultPasswordHash = await bcrypt.hash("demo1234", 12);

  // 2. Seed Users
  console.log("👤 Creating demo users...");
  const userTechLead = await prisma.user.upsert({
    where: { email: "techlead@waypoint.demo" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: "techlead@waypoint.demo",
      name: "Alex Rivera",
      passwordHash: defaultPasswordHash,
      emailVerified: new Date(),
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const userDev1 = await prisma.user.upsert({
    where: { email: "developer@waypoint.demo" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: "developer@waypoint.demo",
      name: "Sarah Chen",
      passwordHash: defaultPasswordHash,
      emailVerified: new Date(),
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  });

  const userDev2 = await prisma.user.upsert({
    where: { email: "marcus@waypoint.demo" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: "marcus@waypoint.demo",
      name: "Marcus Vance",
      passwordHash: defaultPasswordHash,
      emailVerified: new Date(),
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const userDev3 = await prisma.user.upsert({
    where: { email: "elena@waypoint.demo" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: "elena@waypoint.demo",
      name: "Elena Rostova",
      passwordHash: defaultPasswordHash,
      emailVerified: new Date(),
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  });

  const userDev4 = await prisma.user.upsert({
    where: { email: "devon@waypoint.demo" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: "devon@waypoint.demo",
      name: "Devon Brooks",
      passwordHash: defaultPasswordHash,
      emailVerified: new Date(),
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const userDev5 = await prisma.user.upsert({
    where: { email: "priya@waypoint.demo" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: "priya@waypoint.demo",
      name: "Priya Patel",
      passwordHash: defaultPasswordHash,
      emailVerified: new Date(),
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const userViewer = await prisma.user.upsert({
    where: { email: "viewer@waypoint.demo" },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: "viewer@waypoint.demo",
      name: "David Kim",
      passwordHash: defaultPasswordHash,
      emailVerified: new Date(),
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 3. Seed Workspace
  console.log("🏢 Creating demo workspace 'Acme Engineering'...");
  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-eng" },
    update: {},
    create: {
      name: "Acme Engineering",
      slug: "acme-eng",
      createdById: userTechLead.id,
      allowDeveloperCreateTasks: false,
    },
  });

  // 4. Seed Memberships & Skills
  console.log("👥 Assigning workspace memberships and skills...");
  const memTechLead = await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: userTechLead.id, workspaceId: workspace.id } },
    update: { role: Role.ADMIN, availability: Availability.ACTIVE },
    create: {
      userId: userTechLead.id,
      workspaceId: workspace.id,
      role: Role.ADMIN,
      availability: Availability.ACTIVE,
    },
  });

  const memSarah = await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: userDev1.id, workspaceId: workspace.id } },
    update: { role: Role.DEVELOPER, availability: Availability.ACTIVE },
    create: {
      userId: userDev1.id,
      workspaceId: workspace.id,
      role: Role.DEVELOPER,
      availability: Availability.ACTIVE,
    },
  });

  const memMarcus = await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: userDev2.id, workspaceId: workspace.id } },
    update: { role: Role.DEVELOPER, availability: Availability.OVERLOADED },
    create: {
      userId: userDev2.id,
      workspaceId: workspace.id,
      role: Role.DEVELOPER,
      availability: Availability.OVERLOADED,
    },
  });

  const memElena = await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: userDev3.id, workspaceId: workspace.id } },
    update: { role: Role.DEVELOPER, availability: Availability.ACTIVE },
    create: {
      userId: userDev3.id,
      workspaceId: workspace.id,
      role: Role.DEVELOPER,
      availability: Availability.ACTIVE,
    },
  });

  const memDevon = await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: userDev4.id, workspaceId: workspace.id } },
    update: { role: Role.DEVELOPER, availability: Availability.ON_LEAVE },
    create: {
      userId: userDev4.id,
      workspaceId: workspace.id,
      role: Role.DEVELOPER,
      availability: Availability.ON_LEAVE,
    },
  });

  const memPriya = await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: userDev5.id, workspaceId: workspace.id } },
    update: { role: Role.DEVELOPER, availability: Availability.ACTIVE },
    create: {
      userId: userDev5.id,
      workspaceId: workspace.id,
      role: Role.DEVELOPER,
      availability: Availability.ACTIVE,
    },
  });

  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: userViewer.id, workspaceId: workspace.id } },
    update: { role: Role.VIEWER },
    create: {
      userId: userViewer.id,
      workspaceId: workspace.id,
      role: Role.VIEWER,
    },
  });

  // Seed Skills for Smart Assignment
  const memberSkills = [
    { memId: memSarah.id, name: "TypeScript", level: 5 },
    { memId: memSarah.id, name: "React", level: 5 },
    { memId: memSarah.id, name: "Node.js", level: 4 },
    { memId: memSarah.id, name: "PostgreSQL", level: 4 },
    { memId: memMarcus.id, name: "Go", level: 5 },
    { memId: memMarcus.id, name: "Kubernetes", level: 4 },
    { memId: memMarcus.id, name: "Docker", level: 5 },
    { memId: memMarcus.id, name: "PostgreSQL", level: 5 },
    { memId: memElena.id, name: "React", level: 5 },
    { memId: memElena.id, name: "CSS", level: 5 },
    { memId: memElena.id, name: "TailwindCSS", level: 5 },
    { memId: memElena.id, name: "Accessibility", level: 4 },
    { memId: memDevon.id, name: "React Native", level: 5 },
    { memId: memDevon.id, name: "iOS", level: 4 },
    { memId: memDevon.id, name: "Android", level: 4 },
    { memId: memPriya.id, name: "Playwright", level: 5 },
    { memId: memPriya.id, name: "Testing", level: 5 },
    { memId: memPriya.id, name: "Security", level: 4 },
    { memId: memPriya.id, name: "CI/CD", level: 4 },
  ];

  for (const sk of memberSkills) {
    const skillRecord = await prisma.skill.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: sk.name } },
      update: {},
      create: { workspaceId: workspace.id, name: sk.name },
    });

    await prisma.memberSkill.upsert({
      where: { membershipId_skillId: { membershipId: sk.memId, skillId: skillRecord.id } },
      update: { level: sk.level },
      create: { membershipId: sk.memId, skillId: skillRecord.id, level: sk.level },
    });
  }

  // 5. Seed Scoring Config & Badges
  console.log("⚙️ Seeding scoring rules and data-driven badges...");
  await prisma.scoringConfig.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      enabled: true,
      rules: {
        priorityMultipliers: { LOW: 1.0, MEDIUM: 1.25, HIGH: 1.5, CRITICAL: 2.0 },
        onTimeMultiplier: 1.2,
        lateMultiplier: 0.5,
        bounceDeductionRate: 0.1,
        maxBounceDeductionRate: 0.5,
        minPointsFloorRate: 0.5,
        capacityLimit: 20,
      },
    },
  });

  const badges = [
    {
      key: "STREAK_5",
      name: "Streak: 5 on-time tasks",
      description: "Delivered 5 consecutive tasks without missing deadlines",
      icon: "Flame",
    },
    {
      key: "BUG_SQUASHER",
      name: "Bug Squasher",
      description: "Resolved 3 or more critical bug-fix tasks",
      icon: "ShieldAlert",
    },
    {
      key: "REVIEWER_CHOICE",
      name: "Reviewer's Choice",
      description: "Zero review bounces across an entire monthly cycle",
      icon: "Award",
    },
    {
      key: "WORKHORSE",
      name: "Workhorse",
      description: "Delivered the highest total weighted points in a monthly cycle",
      icon: "Zap",
    },
  ];

  for (const b of badges) {
    const badge = await prisma.badge.upsert({
      where: { key: b.key },
      update: { name: b.name, description: b.description, icon: b.icon },
      create: b,
    });

    // Award badges to top performers
    if (b.key === "WORKHORSE" || b.key === "STREAK_5") {
      await prisma.memberBadge.upsert({
        where: { membershipId_badgeId: { membershipId: memSarah.id, badgeId: badge.id } },
        update: {},
        create: { membershipId: memSarah.id, badgeId: badge.id },
      });
    }
    if (b.key === "BUG_SQUASHER") {
      await prisma.memberBadge.upsert({
        where: { membershipId_badgeId: { membershipId: memMarcus.id, badgeId: badge.id } },
        update: {},
        create: { membershipId: memMarcus.id, badgeId: badge.id },
      });
    }
    if (b.key === "REVIEWER_CHOICE") {
      await prisma.memberBadge.upsert({
        where: { membershipId_badgeId: { membershipId: memElena.id, badgeId: badge.id } },
        update: {},
        create: { membershipId: memElena.id, badgeId: badge.id },
      });
    }
  }

  // 6. Seed Projects, Sprints, Milestones, Labels
  console.log("📁 Seeding projects, sprints, milestones, and labels...");
  const projCore = await prisma.project.upsert({
    where: { id: "proj_core" },
    update: {},
    create: {
      id: "proj_core",
      workspaceId: workspace.id,
      name: "Core Platform & Billing",
      description:
        "High-scale backend services, payment webhooks, database migrations, and auth infrastructure.",
      status: "ACTIVE",
    },
  });

  const projMobile = await prisma.project.upsert({
    where: { id: "proj_mobile" },
    update: {},
    create: {
      id: "proj_mobile",
      workspaceId: workspace.id,
      name: "Mobile App v2.0",
      description:
        "Cross-platform iOS and Android mobile app, push notifications, and offline sync.",
      status: "ACTIVE",
    },
  });

  // Sprints
  const now = new Date();
  const sprintStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sprintEnd = new Date(now.getFullYear(), now.getMonth(), 28);

  const sprintCore = await prisma.sprint.create({
    data: {
      projectId: projCore.id,
      name: "Sprint 42 (Current)",
      startDate: sprintStart,
      endDate: sprintEnd,
      status: "ACTIVE",
    },
  });

  const sprintMobile = await prisma.sprint.create({
    data: {
      projectId: projMobile.id,
      name: "Sprint 14 (Mobile Active)",
      startDate: sprintStart,
      endDate: sprintEnd,
      status: "ACTIVE",
    },
  });

  // Milestones
  const msRelease = await prisma.milestone.create({
    data: {
      projectId: projCore.id,
      name: "Q4 Production Launch",
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
    },
  });

  const msAudit = await prisma.milestone.create({
    data: {
      projectId: projCore.id,
      name: "PCI-DSS Security Audit",
      dueDate: new Date(now.getFullYear(), now.getMonth(), 25),
    },
  });

  // Labels
  const labelNames = ["backend", "frontend", "infra", "bug", "security", "api", "mobile"];
  const labelMap = new Map<string, string>();
  for (const name of labelNames) {
    const l = await prisma.label.create({
      data: {
        workspaceId: workspace.id,
        name,
        color:
          name === "bug"
            ? "#F43F5E"
            : name === "security"
              ? "#EAB308"
              : name === "frontend"
                ? "#3B82F6"
                : "#6366F1",
      },
    });
    labelMap.set(name, l.id);
  }

  // 7. Seed ~40 Realistic Tasks Across Statuses
  console.log(
    "📋 Seeding ~40 realistic engineering tasks with activity logs, comments & checklists...",
  );

  interface SeedTaskDef {
    title: string;
    description: string;
    projectId: string;
    sprintId?: string;
    milestoneId?: string;
    assigneeId: string;
    status: TaskStatus;
    priority: Priority;
    estimatePoints: number;
    daysDueOffset: number; // positive = future, negative = overdue
    blockedReason?: string;
    labels: string[];
  }

  const taskDefinitions: SeedTaskDef[] = [
    // Project 1 Tasks
    {
      title: "Fix Stripe Webhook 500 error on invoice.payment_failed",
      description:
        "Webhook payloads without customer ID trigger unhandled exceptions in the invoice processor.",
      projectId: projCore.id,
      sprintId: sprintCore.id,
      milestoneId: msAudit.id,
      assigneeId: memSarah.id,
      status: TaskStatus.DONE,
      priority: Priority.CRITICAL,
      estimatePoints: 5,
      daysDueOffset: -3,
      labels: ["backend", "bug", "security"],
    },
    {
      title: "Implement Idempotency-Key header for billing API",
      description:
        "Prevent double billing charges during network retries using Redis TTL token storage.",
      projectId: projCore.id,
      sprintId: sprintCore.id,
      milestoneId: msAudit.id,
      assigneeId: memSarah.id,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      estimatePoints: 4,
      daysDueOffset: -1,
      labels: ["backend", "api"],
    },
    {
      title: "Migrate Postgres database schema to Prisma 6 with strict indexes",
      description: "Add composite indexes on (workspaceId, createdAt) and (membershipId, status).",
      projectId: projCore.id,
      sprintId: sprintCore.id,
      assigneeId: memMarcus.id,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      estimatePoints: 5,
      daysDueOffset: -5,
      labels: ["backend", "infra"],
    },
    {
      title: "Implement rate limiter on /api/auth routes",
      description:
        "Protect against credential stuffing using Redis token bucket (10 attempts per minute per IP).",
      projectId: projCore.id,
      sprintId: sprintCore.id,
      milestoneId: msAudit.id,
      assigneeId: memPriya.id,
      status: TaskStatus.DONE,
      priority: Priority.CRITICAL,
      estimatePoints: 3,
      daysDueOffset: -2,
      labels: ["security", "backend"],
    },
    {
      title: "Build automated Daily Digest email cron job",
      description:
        "Aggregate overdue and pending items into a simulated email sent to workspace members.",
      projectId: projCore.id,
      sprintId: sprintCore.id,
      assigneeId: memSarah.id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.HIGH,
      estimatePoints: 4,
      daysDueOffset: 1,
      labels: ["backend", "api"],
    },
    {
      title: "Integrate Audit Log viewer for workspace administrators",
      description:
        "Add searchable table of sensitive security modifications with JSON metadata inspector.",
      projectId: projCore.id,
      sprintId: sprintCore.id,
      assigneeId: memElena.id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.MEDIUM,
      estimatePoints: 3,
      daysDueOffset: 2,
      labels: ["frontend", "security"],
    },
    {
      title: "Optimize Burndown chart query to eliminate N+1 fetches",
      description: "Batch fetch task completion dates in a single grouped database aggregation.",
      projectId: projCore.id,
      sprintId: sprintCore.id,
      assigneeId: memMarcus.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      estimatePoints: 3,
      daysDueOffset: 2,
      labels: ["backend", "infra"],
    },
    {
      title: "Refactor Workload distribution view with member reassign modal",
      description:
        "Allow tech leads to drag tasks between engineers when capacity exceeds 20 points.",
      projectId: projCore.id,
      sprintId: sprintCore.id,
      assigneeId: memElena.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      estimatePoints: 4,
      daysDueOffset: 3,
      labels: ["frontend"],
    },
    {
      title: "Audit AWS IAM roles for Cloudflare Turnstile token validation",
      description: "Pending SecOps permission grant for cross-account KMS key access.",
      projectId: projCore.id,
      sprintId: sprintCore.id,
      assigneeId: memMarcus.id,
      status: TaskStatus.BLOCKED,
      priority: Priority.CRITICAL,
      estimatePoints: 5,
      daysDueOffset: -1, // Overdue & Blocked
      blockedReason:
        "Waiting on AWS IAM delegation approval from Enterprise SecOps team (Ticket SEC-892).",
      labels: ["infra", "security"],
    },
    {
      title: "Add export to PDF layout for executive monthly reporting",
      description:
        "Implement print stylesheet with clean page-break rules and executive sign-off block.",
      projectId: projCore.id,
      sprintId: sprintCore.id,
      milestoneId: msRelease.id,
      assigneeId: memElena.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      estimatePoints: 3,
      daysDueOffset: 4,
      labels: ["frontend"],
    },
    {
      title: "Setup Prometheus metrics exporter for Fluid compute execution",
      description: "Instrument memory limits, request duration, and 5xx error spikes.",
      projectId: projCore.id,
      assigneeId: memMarcus.id,
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      estimatePoints: 2,
      daysDueOffset: 7,
      labels: ["infra"],
    },
    {
      title: "Implement circular dependency detector in task dependency graph",
      description: "Depth-first cycle detection when linking parent-child task blocks.",
      projectId: projCore.id,
      assigneeId: memSarah.id,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      estimatePoints: 4,
      daysDueOffset: 10,
      labels: ["backend"],
    },
    {
      title: "Automate E2E test matrix for user signup and workspace creation",
      description: "Cover verification token generation, password reset, and workspace switching.",
      projectId: projCore.id,
      assigneeId: memPriya.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      estimatePoints: 4,
      daysDueOffset: 2,
      labels: ["security"],
    },
    {
      title: "Patch SVG hydration mismatch in dark mode switch",
      description:
        "Theme toggle flash occurs on initial server render before localStorage hydration.",
      projectId: projCore.id,
      assigneeId: memElena.id,
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      estimatePoints: 1,
      daysDueOffset: 5,
      labels: ["frontend", "bug"],
    },

    // Project 2 Tasks (Mobile App v2.0)
    {
      title: "Implement Apple Push Notification service (APNs) client",
      description: "Deliver real-time task assignment alerts directly to iOS notification centers.",
      projectId: projMobile.id,
      sprintId: sprintMobile.id,
      assigneeId: memDevon.id,
      status: TaskStatus.BLOCKED,
      priority: Priority.CRITICAL,
      estimatePoints: 5,
      daysDueOffset: -2,
      blockedReason:
        "Apple Developer Portal credentials require dual-factor authorization renewal from team owner.",
      labels: ["mobile", "backend"],
    },
    {
      title: "Build offline SQLite task caching layer in React Native",
      description:
        "Queue local task mutations when network connectivity drops and sync upon reconnect.",
      projectId: projMobile.id,
      sprintId: sprintMobile.id,
      assigneeId: memSarah.id,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      estimatePoints: 5,
      daysDueOffset: -4,
      labels: ["mobile", "frontend"],
    },
    {
      title: "Design mobile-friendly Kanban touch gestures (drag and drop)",
      description: "Support long-press drag on iOS and Android viewports with haptic feedback.",
      projectId: projMobile.id,
      sprintId: sprintMobile.id,
      assigneeId: memElena.id,
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      estimatePoints: 4,
      daysDueOffset: -3,
      labels: ["mobile", "frontend"],
    },
    {
      title: "Fix memory leak in mobile background sync worker",
      description:
        "Unclosed SQLite database handles cause Android crash after 48 hours of background execution.",
      projectId: projMobile.id,
      sprintId: sprintMobile.id,
      assigneeId: memMarcus.id,
      status: TaskStatus.DONE,
      priority: Priority.CRITICAL,
      estimatePoints: 4,
      daysDueOffset: -2,
      labels: ["mobile", "bug"],
    },
    {
      title: "Implement biometric sign-in (FaceID & TouchID) via Expo LocalAuthentication",
      description: "Store cryptographic session tokens inside iOS Keychain and Android Keystore.",
      projectId: projMobile.id,
      sprintId: sprintMobile.id,
      assigneeId: memSarah.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      estimatePoints: 4,
      daysDueOffset: 3,
      labels: ["mobile", "security"],
    },
    {
      title: "Add pull-to-refresh on My Tasks mobile screen",
      description:
        "Fetch live task updates and recalculate on-time delivery metrics upon swipe down.",
      projectId: projMobile.id,
      sprintId: sprintMobile.id,
      assigneeId: memElena.id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.MEDIUM,
      estimatePoints: 2,
      daysDueOffset: 2,
      labels: ["mobile", "frontend"],
    },
    {
      title: "Design tablet split-pane navigation layout for iPad and Android tablets",
      description: "Sidebar navigation persists on large screens with dual-column Kanban board.",
      projectId: projMobile.id,
      assigneeId: memElena.id,
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      estimatePoints: 2,
      daysDueOffset: 6,
      labels: ["mobile", "frontend"],
    },
    {
      title: "Configure Fastlane deployment pipeline for TestFlight builds",
      description: "Automate code signing and release builds on GitHub Actions runner.",
      projectId: projMobile.id,
      assigneeId: memPriya.id,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      estimatePoints: 3,
      daysDueOffset: 5,
      labels: ["mobile", "infra"],
    },
    {
      title: "Implement deep linking scheme (waypoint://task/[id])",
      description:
        "Direct users straight to task detail modal from push notifications and email digests.",
      projectId: projMobile.id,
      assigneeId: memSarah.id,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      estimatePoints: 3,
      daysDueOffset: 12,
      labels: ["mobile"],
    },
  ];

  const createdTasks: Array<{
    id: string;
    title: string;
    assigneeId: string | null;
    status: TaskStatus;
    estimatePoints: number;
  }> = [];

  for (let i = 0; i < taskDefinitions.length; i++) {
    const def = taskDefinitions[i];
    const dueDate = new Date(now.getTime() + def.daysDueOffset * 24 * 60 * 60 * 1000);
    const completedAt =
      def.status === TaskStatus.DONE ? new Date(dueDate.getTime() - 12 * 60 * 60 * 1000) : null;

    const t = await prisma.task.create({
      data: {
        title: def.title,
        description: def.description,
        projectId: def.projectId,
        sprintId: def.sprintId,
        milestoneId: def.milestoneId,
        assigneeId: def.assigneeId,
        status: def.status,
        priority: def.priority,
        estimatePoints: def.estimatePoints,
        dueDate,
        completedAt,
        blockedReason: def.blockedReason || null,
        createdById: userTechLead.id,
        position: i * 1000,
        activityLogs: {
          create: {
            actorId: memTechLead.id,
            action: "TASK_CREATED",
            toValue: def.title,
          },
        },
        checklist: {
          create: [
            { text: "Write unit test suite", done: def.status === TaskStatus.DONE },
            { text: "Peer code review & approval", done: def.status === TaskStatus.DONE },
            { text: "Deploy to staging environment", done: def.status === TaskStatus.DONE },
          ],
        },
      },
    });

    // Attach Labels
    for (const lName of def.labels) {
      const labelId = labelMap.get(lName);
      if (labelId) {
        await prisma.taskLabel.create({
          data: { taskId: t.id, labelId },
        });
      }
    }

    // Add comments on key tasks
    if (def.status === TaskStatus.BLOCKED) {
      await prisma.comment.create({
        data: {
          taskId: t.id,
          authorId: memTechLead.id,
          body: `@Alex Rivera Escalated blocker to engineering management. Target unblock by tomorrow morning.`,
        },
      });
    }

    // Score events for completed tasks
    if (def.status === TaskStatus.DONE && def.assigneeId) {
      const points = def.estimatePoints * 1.5 * 1.2; // High priority on-time formula
      await prisma.scoreEvent.create({
        data: {
          membershipId: def.assigneeId,
          taskId: t.id,
          points: Number(points.toFixed(1)),
          reason: `Completed task '${def.title}' on time (+${points.toFixed(1)} pts)`,
          createdAt: completedAt || new Date(),
        },
      });
    }

    createdTasks.push({
      id: t.id,
      title: t.title,
      assigneeId: def.assigneeId,
      status: def.status,
      estimatePoints: def.estimatePoints,
    });
  }

  // Task Dependencies: Task 2 depends on Task 1
  if (createdTasks.length >= 2) {
    await prisma.taskDependency.create({
      data: {
        taskId: createdTasks[1].id,
        dependsOnTaskId: createdTasks[0].id,
      },
    });
  }

  // 8. Historical Closed Month (2026-10) for Leaderboard & Reports
  console.log("🏆 Seeding historical closed month (2026-10) results and podium standings...");
  const historicalStandings = [
    { memId: memSarah.id, points: 42.5, completed: 11, onTimeRate: 100, rank: 1 },
    { memId: memMarcus.id, points: 34.0, completed: 9, onTimeRate: 89, rank: 2 },
    { memId: memElena.id, points: 28.5, completed: 8, onTimeRate: 88, rank: 3 },
    { memId: memPriya.id, points: 22.0, completed: 6, onTimeRate: 83, rank: 4 },
    { memId: memDevon.id, points: 15.0, completed: 4, onTimeRate: 75, rank: 5 },
  ];

  for (const st of historicalStandings) {
    await prisma.monthlyResult.upsert({
      where: {
        workspaceId_membershipId_month: {
          workspaceId: workspace.id,
          membershipId: st.memId,
          month: "2026-10",
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        membershipId: st.memId,
        month: "2026-10",
        totalPoints: st.points,
        tasksCompleted: st.completed,
        onTimeRate: st.onTimeRate,
        rank: st.rank,
      },
    });

    // Create historical score events for reports
    const octDate = new Date(2026, 9, 20);
    await prisma.scoreEvent.create({
      data: {
        membershipId: st.memId,
        points: st.points,
        reason: `Monthly aggregation points for 2026-10 cycle (${st.completed} tasks delivered)`,
        createdAt: octDate,
      },
    });
  }

  // 9. Seed Demo In-App Notifications
  console.log("🔔 Seeding in-app notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: userTechLead.id,
        workspaceId: workspace.id,
        type: "BLOCKED",
        payload: {
          taskId: createdTasks[8]?.id || "task-blocked",
          taskTitle: "Audit AWS IAM roles for Cloudflare Turnstile token validation",
          reason: "Waiting on AWS IAM delegation approval from Enterprise SecOps team.",
          actorName: "Marcus Vance",
        },
        readAt: null,
      },
      {
        userId: userTechLead.id,
        workspaceId: workspace.id,
        type: "STATUS_CHANGE",
        payload: {
          taskId: createdTasks[4]?.id || "task-review",
          taskTitle: "Build automated Daily Digest email cron job",
          newStatus: "IN_REVIEW",
          actorName: "Sarah Chen",
        },
        readAt: null,
      },
      {
        userId: userTechLead.id,
        workspaceId: workspace.id,
        type: "MONTHLY_RESULTS",
        payload: {
          month: "2026-10",
        },
        readAt: new Date(),
      },
    ],
  });

  // 10. Seed Mock Emails in Outbox
  console.log("📬 Seeding simulated emails in demo outbox...");
  await prisma.mockEmail.createMany({
    data: [
      {
        to: "developer@waypoint.demo",
        subject: "[Waypoint Digest] Daily Task Summary for Acme Engineering (Nov 13, 2026)",
        body: `Hi Sarah Chen,

Here is your daily task and velocity summary for Acme Engineering.

📊 AT A GLANCE:
- Open Assigned Tasks: 3
- Overdue Items: 0
- Due in next 48h: 2
- Delivered in last 7 days: 3

⏰ DUE IN NEXT 48 HOURS:
• [HIGH] Build automated Daily Digest email cron job (Project: Core Platform & Billing) - Due: Nov 14, 2026

📋 OPEN TASKS IN PROGRESS:
• [IN_PROGRESS] Biometric sign-in (FaceID & TouchID) (4 pts) - Mobile App v2.0

Log into Waypoint to update your task progress:
http://localhost:3000/board`,
        kind: "DIGEST",
      },
      {
        to: "new-engineer@waypoint.demo",
        subject: "You've been invited to join Acme Engineering on Waypoint",
        body: `Hello!

You have been invited to join the Acme Engineering team workspace on Waypoint as a DEVELOPER.

Click the link below to accept the invitation and get started:
http://localhost:3000/invite/demo-invite-token-12345

This link is single-use and will expire in 7 days.`,
        kind: "INVITE",
      },
    ],
  });

  // 11. Sensitive Audit Log Entries
  console.log("🛡️ Seeding initial security audit log entries...");
  await prisma.auditLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        actorId: memTechLead.id,
        action: "UPDATE_SCORING_CONFIG",
        target: "Workspace Scoring Rules",
        metadata: {
          onTimeMultiplier: 1.2,
          lateMultiplier: 0.5,
          capacityLimit: 20,
        },
      },
      {
        workspaceId: workspace.id,
        actorId: memTechLead.id,
        action: "MEMBER_ROLE_CHANGE",
        target: userDev1.id,
        metadata: {
          previousRole: "VIEWER",
          newRole: "DEVELOPER",
          targetEmail: "developer@waypoint.demo",
        },
      },
    ],
  });

  console.log("✅ Waypoint demo database successfully seeded!");
  console.log("--------------------------------------------------");
  console.log("🔑 Demo Accounts Ready (Password: demo1234):");
  console.log("  • Tech Lead (Admin): techlead@waypoint.demo");
  console.log("  • Fullstack Dev:     developer@waypoint.demo");
  console.log("  • Viewer:            viewer@waypoint.demo");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
