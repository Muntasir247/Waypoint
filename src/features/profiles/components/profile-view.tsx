"use client";

import * as React from "react";
import {
  ShieldCheck,
  Code,
  Eye,
  Camera,
  CheckCircle2,
  Clock,
  Trophy,
  Award,
  Plus,
  Trash2,
  Loader2,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import {
  updateProfileAction,
  addSkillAction,
  updateSkillLevelAction,
  removeSkillAction,
} from "../actions";
import { updateMemberAvailabilityAction } from "@/features/members/actions";

interface ProfileSkill {
  memberSkillId: string;
  skillId: string;
  name: string;
  level: number;
}

interface ProfileBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface ProfileStats {
  tasksCompleted: number;
  onTimeRate: number;
  avgCompletionDays: number;
  currentPoints: number;
}

export interface ProfileData {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: "ADMIN" | "DEVELOPER" | "VIEWER";
  availability: "ACTIVE" | "ON_LEAVE" | "OVERLOADED";
  joinedAt: Date | string;
  workspaceName: string;
  workspaceId: string;
  skills: ProfileSkill[];
  badges: ProfileBadge[];
  stats: ProfileStats;
}

interface ProfileViewProps {
  profile: ProfileData;
  isSelf: boolean;
}

export function ProfileView({ profile: initialProfile, isSelf }: ProfileViewProps) {
  const [profile, setProfile] = React.useState<ProfileData>(initialProfile);
  const [name, setName] = React.useState(profile.name);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [savingName, setSavingName] = React.useState(false);
  const [avatarUploading, setAvatarUploading] = React.useState(false);

  // Add skill state
  const [newSkillName, setNewSkillName] = React.useState("");
  const [newSkillLevel, setNewSkillLevel] = React.useState(3);
  const [addingSkill, setAddingSkill] = React.useState(false);
  const [skillModalOpen, setSkillModalOpen] = React.useState(false);

  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    const res = await updateProfileAction({ name });
    if (res.error) {
      showFeedback("error", res.error);
    } else {
      setProfile((p) => ({ ...p, name }));
      setIsEditingName(false);
      showFeedback("success", "Profile name updated");
    }
    setSavingName(false);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      showFeedback("error", "Image file must be under 2MB");
      return;
    }

    setAvatarUploading(true);
    try {
      // Convert to base64 Data URL for demo and universal persistence
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await updateProfileAction({ name: profile.name, image: base64 });
        if (res.error) {
          showFeedback("error", res.error);
        } else {
          setProfile((p) => ({ ...p, image: base64 }));
          showFeedback("success", "Avatar updated successfully");
        }
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      showFeedback("error", "Failed to upload avatar");
      setAvatarUploading(false);
    }
  };

  const handleAvailabilityChange = async (availability: "ACTIVE" | "ON_LEAVE" | "OVERLOADED") => {
    const res = await updateMemberAvailabilityAction({
      workspaceId: profile.workspaceId,
      membershipId: profile.membershipId,
      availability,
    });
    if (res.error) {
      showFeedback("error", res.error);
    } else {
      setProfile((p) => ({ ...p, availability }));
      showFeedback("success", "Availability updated");
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    setAddingSkill(true);
    const res = await addSkillAction({
      workspaceId: profile.workspaceId,
      membershipId: profile.membershipId,
      skillName: newSkillName.trim(),
      level: newSkillLevel,
    });

    if (res.error) {
      showFeedback("error", res.error);
    } else if (res.memberSkill) {
      setProfile((p) => ({
        ...p,
        skills: [
          ...p.skills.filter((s) => s.name.toLowerCase() !== newSkillName.trim().toLowerCase()),
          {
            memberSkillId: res.memberSkill.id,
            skillId: res.memberSkill.skillId,
            name: newSkillName.trim(),
            level: newSkillLevel,
          },
        ],
      }));
      setNewSkillName("");
      setNewSkillLevel(3);
      setSkillModalOpen(false);
      showFeedback("success", "Skill added to profile");
    }
    setAddingSkill(false);
  };

  const handleUpdateSkillLevel = async (memberSkillId: string, level: number) => {
    const res = await updateSkillLevelAction({ memberSkillId, level });
    if (res.error) {
      showFeedback("error", res.error);
    } else {
      setProfile((p) => ({
        ...p,
        skills: p.skills.map((s) => (s.memberSkillId === memberSkillId ? { ...s, level } : s)),
      }));
    }
  };

  const handleRemoveSkill = async (memberSkillId: string) => {
    const res = await removeSkillAction({ memberSkillId });
    if (res.error) {
      showFeedback("error", res.error);
    } else {
      setProfile((p) => ({
        ...p,
        skills: p.skills.filter((s) => s.memberSkillId !== memberSkillId),
      }));
      showFeedback("success", "Skill removed");
    }
  };

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TM";

  return (
    <div className="space-y-8">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`animate-in fade-in rounded-xl border p-3 text-xs ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="border-border bg-card rounded-2xl border p-6 shadow-xs md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-5">
            {/* Avatar with Upload button */}
            <div className="group relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 text-xl font-bold text-white shadow-md">
                {profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              {isSelf && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    aria-label="Upload avatar"
                    className="ring-card absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs ring-2 transition-colors hover:bg-indigo-700"
                  >
                    {avatarUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-border bg-muted/40 text-foreground h-8 rounded-lg border px-2.5 text-base font-bold focus:border-indigo-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      {savingName ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-foreground text-2xl font-bold tracking-tight md:text-3xl">
                      {profile.name}
                    </h1>
                    {isSelf && (
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="text-muted-foreground hover:text-foreground text-xs font-medium underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}

                {/* Role badge */}
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {profile.role === "ADMIN" && <ShieldCheck className="h-3 w-3" />}
                  {profile.role === "DEVELOPER" && <Code className="h-3 w-3" />}
                  {profile.role === "VIEWER" && <Eye className="h-3 w-3" />}
                  <span className="capitalize">{profile.role.toLowerCase()}</span>
                </span>
              </div>

              <p className="text-muted-foreground text-xs">{profile.email}</p>

              <div className="text-muted-foreground flex flex-wrap items-center gap-4 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{profile.workspaceName}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Joined{" "}
                    {new Date(profile.joinedAt).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Availability Selector */}
          {isSelf && (
            <div className="border-border bg-muted/20 self-start rounded-xl border p-3">
              <span className="text-muted-foreground mb-2 block text-[11px] font-semibold tracking-wider uppercase">
                Availability Status
              </span>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { key: "ACTIVE", label: "Active", dot: "bg-emerald-500" },
                    { key: "ON_LEAVE", label: "On Leave", dot: "bg-slate-400" },
                    { key: "OVERLOADED", label: "Overloaded", dot: "bg-rose-500" },
                  ] as const
                ).map((status) => {
                  const isSelected = profile.availability === status.key;
                  return (
                    <button
                      key={status.key}
                      type="button"
                      onClick={() => handleAvailabilityChange(status.key)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-card text-foreground border-border border font-semibold shadow-xs"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                      <span>{status.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="text-xs font-medium">Tasks Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-foreground mt-2 text-2xl font-bold">
            {profile.stats.tasksCompleted}
          </div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="text-xs font-medium">On-Time Rate</span>
            <Clock className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">
            {profile.stats.onTimeRate}%
          </div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="text-xs font-medium">Avg Completion Time</span>
            <Calendar className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {profile.stats.avgCompletionDays} days
          </div>
        </div>

        <div className="border-border bg-card rounded-2xl border p-4 shadow-xs">
          <div className="text-muted-foreground flex items-center justify-between">
            <span className="text-xs font-medium">Current Points</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {profile.stats.currentPoints} pts
          </div>
        </div>
      </div>

      {/* Skills Matrix Section */}
      <div className="border-border bg-card rounded-2xl border p-6 shadow-xs">
        <div className="border-border flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-foreground text-base font-semibold">
              Engineering Skills & Mastery
            </h2>
            <p className="text-muted-foreground text-xs">
              Proficiency levels (1 to 5) power Waypoint&apos;s Smart Assignment engine.
            </p>
          </div>

          {isSelf && (
            <button
              type="button"
              onClick={() => setSkillModalOpen(true)}
              className="border-border bg-muted/40 text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Skill</span>
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {profile.skills.length === 0 ? (
            <div className="text-muted-foreground col-span-full py-8 text-center text-xs">
              No skills added yet. Click &quot;Add Skill&quot; to list your technical proficiencies.
            </div>
          ) : (
            profile.skills.map((skill) => (
              <div
                key={skill.memberSkillId}
                className="border-border bg-muted/20 hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors"
              >
                <div className="space-y-1.5">
                  <span className="text-foreground text-xs font-semibold">{skill.name}</span>
                  {/* 5-bar rating visual */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const isFilled = level <= skill.level;
                      return (
                        <button
                          key={level}
                          type="button"
                          disabled={!isSelf}
                          onClick={() => handleUpdateSkillLevel(skill.memberSkillId, level)}
                          className={`h-2 w-5 rounded-full transition-all ${
                            isFilled
                              ? "bg-indigo-600 dark:bg-indigo-500"
                              : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                          } ${isSelf ? "cursor-pointer" : "cursor-default"}`}
                          title={`Level ${level}/5`}
                        />
                      );
                    })}
                    <span className="ml-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {skill.level}/5
                    </span>
                  </div>
                </div>

                {isSelf && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.memberSkillId)}
                    className="text-muted-foreground p-1 transition-colors hover:text-rose-600"
                    title="Remove skill"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Badges Section */}
      <div className="border-border bg-card rounded-2xl border p-6 shadow-xs">
        <div className="border-border border-b pb-4">
          <h2 className="text-foreground text-base font-semibold">Earned Recognition Badges</h2>
          <p className="text-muted-foreground text-xs">
            Milestone achievements recorded from completed sprint cycles.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="border-border bg-muted/20 flex items-center gap-3 rounded-xl border p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="text-foreground text-xs font-semibold">Streak: 5 On-Time Tasks</div>
              <div className="text-muted-foreground text-[11px]">
                Completed 5 consecutive tasks without delay
              </div>
            </div>
          </div>

          <div className="border-border bg-muted/20 flex items-center gap-3 rounded-xl border p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-foreground text-xs font-semibold">Bug Squasher</div>
              <div className="text-muted-foreground text-[11px]">
                Resolved 10+ critical & high severity issues
              </div>
            </div>
          </div>

          <div className="border-border bg-muted/20 flex items-center gap-3 rounded-xl border p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-foreground text-xs font-semibold">Reviewer&apos;s Choice</div>
              <div className="text-muted-foreground text-[11px]">
                Zero review bounce-backs in current sprint
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Skill Modal */}
      {skillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="border-border bg-card text-card-foreground animate-in fade-in-0 zoom-in-95 w-full max-w-sm rounded-2xl border p-6 shadow-xl">
            <h3 className="text-foreground text-base font-semibold">Add Engineering Skill</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Add a language, framework, or architecture competency.
            </p>

            <form onSubmit={handleAddSkill} className="mt-4 space-y-4">
              <div>
                <label className="text-foreground text-xs font-semibold">Skill Name</label>
                <input
                  type="text"
                  required
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. TypeScript, React, Go, Kafka"
                  className="border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:bg-background mt-1.5 h-10 w-full rounded-xl border px-3 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-foreground text-xs font-semibold">
                  Proficiency Level: {newSkillLevel}/5
                </label>
                <div className="mt-2 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewSkillLevel(lvl)}
                      className={`h-8 flex-1 rounded-lg text-xs font-bold transition-all ${
                        lvl <= newSkillLevel
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted border"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSkillModalOpen(false)}
                  className="border-border bg-muted/50 text-foreground hover:bg-muted rounded-xl border px-3.5 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSkill}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addingSkill ? "Adding..." : "Add Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
