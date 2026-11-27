import { db } from '../src/lib/db.ts';

async function main() {
  const users = await db.user.findMany({ select: { id: true, email: true, name: true } });
  console.log('=== USERS ===', users);

  const workspaces = await db.workspace.findMany();
  console.log('=== WORKSPACES ===', workspaces);

  const memberships = await db.membership.findMany({
    include: { user: { select: { email: true } }, workspace: { select: { name: true } } }
  });
  console.log('=== MEMBERSHIPS ===', memberships.map(m => ({
    id: m.id,
    user: m.user.email,
    workspace: m.workspace.name,
    role: m.role
  })));

  const projects = await db.project.findMany();
  console.log('=== PROJECTS ===', projects);
}

main().catch(console.error).finally(() => process.exit(0));
