import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getProfileDetailsAction } from "@/features/profiles/actions";
import { ProfileView } from "@/features/profiles/components/profile-view";

export const instant = false;

export default async function ProfilePage() {
  const res = await getProfileDetailsAction();

  if (!res.success || !res.profile) {
    redirect("/login");
  }

  return (
    <AppShell>
      <ProfileView profile={res.profile as any} isSelf={res.isSelf ?? true} />
    </AppShell>
  );
}
