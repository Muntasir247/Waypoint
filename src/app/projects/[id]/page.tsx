import { AppShell } from "@/components/layout/app-shell";
import { getProjectDetailAction } from "@/features/projects/actions";
import {
  ProjectDetailView,
  ProjectDetailData,
} from "@/features/projects/components/project-detail-view";

export const instant = false;

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const res = await getProjectDetailAction(id);
  const initialProject: ProjectDetailData | null = res.project ?? null;

  return (
    <AppShell>
      <ProjectDetailView initialProject={initialProject} projectId={id} />
    </AppShell>
  );
}
