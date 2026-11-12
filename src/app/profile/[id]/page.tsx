import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getProfileDetailsAction } from "@/features/profiles/actions";
import { ProfileView } from "@/features/profiles/components/profile-view";

export const instant = false;

interface MemberProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
  const { id } = await params;
  const res = await getProfileDetailsAction(id);

  if (!res.success || !res.profile) {
    notFound();
  }

  return (
    <AppShell>
      <ProfileView profile={res.profile} isSelf={res.isSelf ?? false} />
    </AppShell>
  );
}
