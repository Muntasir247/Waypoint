import { AppShell } from "@/components/layout/app-shell";
import { getProjectsAction } from "@/features/projects/actions";
import {
  ProjectsDirectoryView,
  ProjectItem,
} from "@/features/projects/components/projects-directory-view";

export const instant = false;

export default async function ProjectsPage() {
  const res = await getProjectsAction();
  const initialProjects: ProjectItem[] = res.projects ?? [];

  return (
    <AppShell>
      <ProjectsDirectoryView initialProjects={initialProjects} />
    </AppShell>
  );
}
