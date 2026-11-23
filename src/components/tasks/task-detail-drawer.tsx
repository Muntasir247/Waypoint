"use client";

import * as React from "react";
import {
  X,
  Clock,
  AlertTriangle,
  MessageSquare,
  History,
  Trash2,
  Send,
  AlertCircle,
  Paperclip,
  CheckSquare,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import {
  getTaskDetailAction,
  updateTaskStatusAction,
  deleteTaskAction,
  addChecklistItemAction,
  toggleChecklistItemAction,
  deleteChecklistItemAction,
  addCommentAction,
  addAttachmentAction,
  deleteAttachmentAction,
  logTimeAction,
  addDependencyAction,
  removeDependencyAction,
  getTasksAction,
} from "@/features/tasks/actions";
import { TaskStatus, Priority, AttachmentType } from "@/types/enums";

interface ChecklistItemData {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

interface DependencyItemData {
  dependsOnTask: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
  };
}

interface CommentData {
  id: string;
  body: string;
  createdAt: string;
  author?: {
    user?: { name?: string | null; email?: string | null; image?: string | null };
  };
}

interface AttachmentData {
  id: string;
  name: string;
  url: string;
  type: AttachmentType;
  createdAt: string;
}

interface TimeEntryData {
  id: string;
  minutes: number;
  note?: string | null;
  loggedAt: string;
  membership?: {
    user?: { name?: string | null; email?: string | null; image?: string | null };
  };
}

interface ActivityLogData {
  id: string;
  action: string;
  toValue?: string | null;
  fromValue?: string | null;
  createdAt: string;
  actor?: {
    user?: { name?: string | null; email?: string | null; image?: string | null };
  };
}

interface TaskDetailData {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  estimatePoints: number;
  dueDate?: string | null;
  blockedReason?: string | null;
  completedAt?: string | null;
  assigneeId?: string | null;
  totalMinutesLogged: number;
  totalHoursLogged: string;
  project?: { id: string; name: string };
  sprint?: { id: string; name: string; status: string } | null;
  milestone?: { id: string; name: string; dueDate?: string | null } | null;
  assignee?: {
    id: string;
    role: string;
    user?: { name?: string | null; email?: string | null; image?: string | null };
  } | null;
  checklist: ChecklistItemData[];
  dependencies: DependencyItemData[];
  attachments: AttachmentData[];
  timeEntries: TimeEntryData[];
  comments: CommentData[];
  activityLogs: ActivityLogData[];
}

interface TaskDetailDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentMemberRole?: "ADMIN" | "DEVELOPER" | "VIEWER";
  currentMembershipId?: string;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
}

export function TaskDetailDrawer({
  taskId,
  isOpen,
  onClose,
  currentMemberRole = "ADMIN",
  currentMembershipId,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailDrawerProps) {
  const [task, setTask] = React.useState<TaskDetailData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<
    "checklist" | "dependencies" | "comments" | "attachments" | "time" | "history"
  >("checklist");

  // Form states
  const [newChecklistText, setNewChecklistText] = React.useState("");
  const [newCommentText, setNewCommentText] = React.useState("");
  const [newAttachmentName, setNewAttachmentName] = React.useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = React.useState("");
  const [logMinutes, setLogMinutes] = React.useState(60);
  const [logNote, setLogNote] = React.useState("");
  const [blockedReasonInput, setBlockedReasonInput] = React.useState("");
  const [isPromptingBlockedReason, setIsPromptingBlockedReason] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // For adding dependency
  const [allTasks, setAllTasks] = React.useState<{ id: string; title: string }[]>([]);
  const [selectedPrereqId, setSelectedPrereqId] = React.useState("");

  const isAssignedToCurrentUser = task && task.assigneeId === currentMembershipId;
  const canUpdateStatus = currentMemberRole === "ADMIN" || isAssignedToCurrentUser;
  const canDeleteTask = currentMemberRole === "ADMIN";

  const loadTask = React.useCallback(async () => {
    if (!taskId) return;
    setIsLoading(true);
    setError(null);
    const res = await getTaskDetailAction(taskId);
    if (res.error) {
      setError(res.error);
    } else if (res.task) {
      setTask(res.task);
      if (res.task.blockedReason) {
        setBlockedReasonInput(res.task.blockedReason);
      }
    }
    setIsLoading(false);
  }, [taskId]);

  React.useEffect(() => {
    let isMounted = true;
    if (isOpen && taskId) {
      Promise.resolve().then(() => {
        if (!isMounted) return;
        setIsLoading(true);
        setError(null);
      });
      getTaskDetailAction(taskId).then((res) => {
        if (!isMounted) return;
        if (res.error) {
          setError(res.error);
        } else if (res.task) {
          setTask(res.task);
          if (res.task.blockedReason) {
            setBlockedReasonInput(res.task.blockedReason);
          }
        }
        setIsLoading(false);
      });

      getTasksAction().then((res) => {
        if (!isMounted) return;
        if (res.tasks) {
          setAllTasks(
            res.tasks.filter((t) => t.id !== taskId).map((t) => ({ id: t.id, title: t.title })),
          );
        }
      });
    } else {
      Promise.resolve().then(() => {
        if (!isMounted) return;
        setTask(null);
        setError(null);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, taskId]);

  if (!isOpen || !taskId) return null;

  async function handleStatusChange(nextStatus: TaskStatus) {
    setError(null);
    if (nextStatus === TaskStatus.BLOCKED) {
      setIsPromptingBlockedReason(true);
      return;
    }

    const res = await updateTaskStatusAction({
      id: taskId!,
      status: nextStatus as any,
    });

    if (res.error) {
      setError(res.error);
      return;
    }

    loadTask();
    onTaskUpdated?.();
  }

  async function handleConfirmBlocked() {
    if (!blockedReasonInput.trim()) {
      setError("Please provide a reason why this task is blocked.");
      return;
    }

    const res = await updateTaskStatusAction({
      id: taskId!,
      status: TaskStatus.BLOCKED,
      blockedReason: blockedReasonInput.trim(),
    });

    if (res.error) {
      setError(res.error);
      return;
    }

    setIsPromptingBlockedReason(false);
    loadTask();
    onTaskUpdated?.();
  }

  async function handleDeleteTask() {
    if (
      !confirm(
        "Are you sure you want to delete this task? This action is permanent and will be audit-logged.",
      )
    ) {
      return;
    }

    const res = await deleteTaskAction(taskId!);
    if (res.error) {
      setError(res.error);
      return;
    }

    onTaskDeleted?.();
    onClose();
  }

  async function handleAddChecklistItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newChecklistText.trim()) return;

    const res = await addChecklistItemAction({
      taskId: taskId!,
      text: newChecklistText.trim(),
    });

    if (res.error) {
      setError(res.error);
      return;
    }

    setNewChecklistText("");
    loadTask();
    onTaskUpdated?.();
  }

  async function handleToggleChecklistItem(itemId: string, done: boolean) {
    const res = await toggleChecklistItemAction({ id: itemId, done });
    if (res.error) {
      setError(res.error);
      return;
    }
    loadTask();
    onTaskUpdated?.();
  }

  async function handleDeleteChecklistItem(itemId: string) {
    const res = await deleteChecklistItemAction(itemId);
    if (res.error) {
      setError(res.error);
      return;
    }
    loadTask();
    onTaskUpdated?.();
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const res = await addCommentAction({
      taskId: taskId!,
      body: newCommentText.trim(),
    });

    if (res.error) {
      setError(res.error);
      return;
    }

    setNewCommentText("");
    loadTask();
    onTaskUpdated?.();
  }

  async function handleAddAttachment(e: React.FormEvent) {
    e.preventDefault();
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return;

    const res = await addAttachmentAction({
      taskId: taskId!,
      name: newAttachmentName.trim(),
      url: newAttachmentUrl.trim(),
      type: AttachmentType.LINK,
    });

    if (res.error) {
      setError(res.error);
      return;
    }

    setNewAttachmentName("");
    setNewAttachmentUrl("");
    loadTask();
    onTaskUpdated?.();
  }

  async function handleDeleteAttachment(attachmentId: string) {
    const res = await deleteAttachmentAction(attachmentId);
    if (res.error) {
      setError(res.error);
      return;
    }
    loadTask();
    onTaskUpdated?.();
  }

  async function handleLogTime(e: React.FormEvent) {
    e.preventDefault();
    const res = await logTimeAction({
      taskId: taskId!,
      minutes: Number(logMinutes),
      note: logNote || null,
    });

    if (res.error) {
      setError(res.error);
      return;
    }

    setLogNote("");
    loadTask();
    onTaskUpdated?.();
  }

  async function handleAddDependency() {
    if (!selectedPrereqId) return;

    const res = await addDependencyAction({
      taskId: taskId!,
      dependsOnTaskId: selectedPrereqId,
    });

    if (res.error) {
      setError(res.error);
      return;
    }

    setSelectedPrereqId("");
    loadTask();
    onTaskUpdated?.();
  }

  async function handleRemoveDependency(prereqId: string) {
    const res = await removeDependencyAction({
      taskId: taskId!,
      dependsOnTaskId: prereqId,
    });

    if (res.error) {
      setError(res.error);
      return;
    }

    loadTask();
    onTaskUpdated?.();
  }

  return (
    <div className="animate-in fade-in-0 fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
      <div className="border-border bg-card text-card-foreground animate-in slide-in-from-right flex h-full w-full max-w-2xl flex-col border-l shadow-2xl duration-200">
        {/* Drawer Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span>{task?.project?.name || "Project"}</span>
            <span>/</span>
            <span>{task?.sprint?.name || "Backlog"}</span>
          </div>

          <div className="flex items-center gap-2">
            {canDeleteTask && (
              <button
                type="button"
                onClick={handleDeleteTask}
                title="Delete Task (Admin only)"
                className="text-muted-foreground rounded-lg p-1.5 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1.5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        {isLoading ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center p-8 text-sm">
            Loading task details...
          </div>
        ) : !task ? (
          <div className="text-muted-foreground p-8 text-center text-sm">Task not found</div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-800 dark:bg-rose-950/60 dark:text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">{error}</div>
                <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Blocked Reason Prompt Banner */}
            {isPromptingBlockedReason && (
              <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs dark:border-rose-900 dark:bg-rose-950/40">
                <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-300">
                  <ShieldAlert className="h-4 w-4" />
                  <span>State Reason for Blocker</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Spec requirement: marking a task as BLOCKED requires a short explanatory reason so
                  teammates can help unblock it.
                </p>
                <input
                  type="text"
                  value={blockedReasonInput}
                  onChange={(e) => setBlockedReasonInput(e.target.value)}
                  placeholder="e.g. Blocked waiting on OAuth2 rate limiter PR to merge"
                  className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPromptingBlockedReason(false)}
                    className="border-border bg-card rounded-lg px-3 py-1 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBlocked}
                    className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    Set as Blocked
                  </button>
                </div>
              </div>
            )}

            {/* Title & Active Blocker Note */}
            <div>
              <h1 className="text-foreground text-xl font-bold tracking-tight">{task.title}</h1>

              {task.status === "BLOCKED" && task.blockedReason && (
                <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <div>
                    <span className="font-semibold">Blocker: </span>
                    <span>{task.blockedReason}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Attributes Matrix */}
            <div className="border-border bg-muted/20 grid grid-cols-2 gap-3 rounded-xl border p-3.5 text-xs sm:grid-cols-4">
              <div>
                <span className="text-muted-foreground block text-[11px]">Status</span>
                <select
                  disabled={!canUpdateStatus}
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className={`mt-1 rounded-lg border px-2 py-1 text-xs font-semibold outline-none ${
                    task.status === "DONE"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : task.status === "BLOCKED"
                        ? "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : task.status === "IN_PROGRESS"
                          ? "border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                          : "border-border bg-card text-foreground"
                  } ${!canUpdateStatus ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                >
                  <option value={TaskStatus.TODO}>TODO</option>
                  <option value={TaskStatus.IN_PROGRESS}>IN PROGRESS</option>
                  <option value={TaskStatus.IN_REVIEW}>IN REVIEW</option>
                  <option value={TaskStatus.DONE}>DONE</option>
                  <option value={TaskStatus.BLOCKED}>BLOCKED</option>
                </select>
                {!canUpdateStatus && (
                  <span className="text-muted-foreground mt-0.5 block text-[10px]">
                    Assigned dev only
                  </span>
                )}
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Priority</span>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    task.priority === "CRITICAL"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      : task.priority === "HIGH"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {task.priority}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Estimate</span>
                <span className="mt-1 block font-mono font-semibold">
                  {task.estimatePoints} pts
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Assignee</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {task.assignee?.user?.name?.[0] || "?"}
                  </div>
                  <span className="truncate font-medium">
                    {task.assignee?.user?.name || "Unassigned"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {task.description && (
              <div className="border-border bg-card rounded-xl border p-4 text-xs">
                <span className="text-muted-foreground mb-1.5 block text-[11px] font-semibold tracking-wider uppercase">
                  Description
                </span>
                <div className="prose prose-xs dark:prose-invert text-foreground max-w-none whitespace-pre-wrap">
                  {task.description}
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-border flex items-center gap-1 overflow-x-auto border-b text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("checklist")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
                  activeTab === "checklist"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Checklist ({task.checklist?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("dependencies")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
                  activeTab === "dependencies"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Dependencies ({task.dependencies?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("comments")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
                  activeTab === "comments"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Discussion ({task.comments?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("attachments")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
                  activeTab === "attachments"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>Links & Files ({task.attachments?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("time")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
                  activeTab === "time"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Time ({task.totalHoursLogged}h)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
                  activeTab === "history"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Audit Trail</span>
              </button>
            </div>

            {/* Tab: Checklist / Subtasks */}
            {activeTab === "checklist" && (
              <div className="space-y-3">
                {task.checklist && task.checklist.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                      <span>
                        Progress: {task.checklist.filter((c) => c.done).length} of{" "}
                        {task.checklist.length} completed
                      </span>
                      <span>
                        {Math.round(
                          (task.checklist.filter((c) => c.done).length / task.checklist.length) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${(task.checklist.filter((c) => c.done).length / task.checklist.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {task.checklist?.map((item) => (
                    <div
                      key={item.id}
                      className="border-border bg-card hover:bg-muted/40 flex items-center justify-between rounded-xl border p-2.5 transition-colors"
                    >
                      <label className="flex cursor-pointer items-center gap-2.5 text-xs">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
                          className="border-border h-4 w-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                        />
                        <span
                          className={
                            item.done ? "text-muted-foreground line-through" : "text-foreground"
                          }
                        >
                          {item.text}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        className="text-muted-foreground p-1 hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="Add a subtask / checklist item..."
                    className="border-border bg-background text-foreground flex-1 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newChecklistText.trim()}
                    className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Dependencies */}
            {activeTab === "dependencies" && (
              <div className="space-y-4 text-xs">
                {/* Blocked by (Prerequisites) */}
                <div>
                  <span className="text-muted-foreground mb-2 block text-[11px] font-semibold uppercase">
                    Prerequisites (Must be DONE to start)
                  </span>
                  {task.dependencies && task.dependencies.length > 0 ? (
                    <div className="space-y-2">
                      {task.dependencies.map((dep) => (
                        <div
                          key={dep.dependsOnTask.id}
                          className="border-border bg-card flex items-center justify-between rounded-xl border p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                dep.dependsOnTask.status === "DONE"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {dep.dependsOnTask.status}
                            </span>
                            <span className="text-foreground font-medium">
                              {dep.dependsOnTask.title}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveDependency(dep.dependsOnTask.id)}
                            className="text-muted-foreground p-1 hover:text-rose-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs italic">
                      No prerequisite dependencies.
                    </p>
                  )}
                </div>

                {/* Add Dependency input */}
                <div className="border-border border-t pt-2">
                  <span className="text-muted-foreground mb-1.5 block text-[11px] font-semibold">
                    Add Prerequisite Dependency
                  </span>
                  <div className="flex gap-2">
                    <select
                      value={selectedPrereqId}
                      onChange={(e) => setSelectedPrereqId(e.target.value)}
                      className="border-border bg-background text-foreground flex-1 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select task prerequisite...</option>
                      {allTasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddDependency}
                      disabled={!selectedPrereqId}
                      className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Comments */}
            {activeTab === "comments" && (
              <div className="space-y-4 text-xs">
                <div className="space-y-3">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((cmt) => (
                      <div
                        key={cmt.id}
                        className="border-border bg-card space-y-1.5 rounded-xl border p-3"
                      >
                        <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                          <span className="text-foreground font-semibold">
                            {cmt.author?.user?.name || "Member"}
                          </span>
                          <span>{new Date(cmt.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-foreground whitespace-pre-wrap">{cmt.body}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground py-3 text-center italic">
                      No comments yet.
                    </p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex flex-col gap-2 pt-2">
                  <textarea
                    rows={2}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Write a comment... (Supports @mentions)"
                    className="border-border bg-background text-foreground rounded-xl border p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" />
                      <span>Post Comment</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Attachments */}
            {activeTab === "attachments" && (
              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  {task.attachments && task.attachments.length > 0 ? (
                    task.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="border-border bg-card hover:bg-muted/30 flex items-center justify-between rounded-xl border p-2.5"
                      >
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 truncate font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{att.name}</span>
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="text-muted-foreground p-1 hover:text-rose-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground py-2 text-center italic">
                      No attachments or links.
                    </p>
                  )}
                </div>

                <form
                  onSubmit={handleAddAttachment}
                  className="border-border space-y-2 border-t pt-3"
                >
                  <span className="text-muted-foreground block text-[11px] font-semibold">
                    Add Link (PR, Figma, Docs)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newAttachmentName}
                      onChange={(e) => setNewAttachmentName(e.target.value)}
                      placeholder="Title (e.g. GitHub PR #142)"
                      className="border-border bg-background text-foreground rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="url"
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      placeholder="https://..."
                      className="border-border bg-background text-foreground rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newAttachmentName.trim() || !newAttachmentUrl.trim()}
                      className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Add Link
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Time Logging */}
            {activeTab === "time" && (
              <div className="space-y-4 text-xs">
                <div className="border-border bg-muted/20 flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Total Time Logged
                    </span>
                    <span className="text-foreground text-base font-bold">
                      {task.totalHoursLogged} hrs
                    </span>
                  </div>
                  <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>

                <div className="space-y-2">
                  <span className="text-muted-foreground block text-[11px] font-semibold">
                    Recent Time Entries
                  </span>
                  {task.timeEntries && task.timeEntries.length > 0 ? (
                    task.timeEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="border-border bg-card flex items-center justify-between rounded-xl border p-2.5"
                      >
                        <div>
                          <span className="text-foreground font-semibold">
                            {entry.membership?.user?.name || "Member"}:{" "}
                            {(entry.minutes / 60).toFixed(1)}h
                          </span>
                          {entry.note && (
                            <p className="text-muted-foreground mt-0.5 text-[11px]">{entry.note}</p>
                          )}
                        </div>
                        <span className="text-muted-foreground text-[10px]">
                          {new Date(entry.loggedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground py-2 text-center italic">
                      No time logged yet.
                    </p>
                  )}
                </div>

                <form onSubmit={handleLogTime} className="border-border space-y-2 border-t pt-3">
                  <span className="text-muted-foreground block text-[11px] font-semibold">
                    Log Work
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={logMinutes}
                      onChange={(e) => setLogMinutes(Number(e.target.value))}
                      placeholder="Minutes"
                      className="border-border bg-background text-foreground w-24 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                      placeholder="Note (e.g. Profiling queries)"
                      className="border-border bg-background text-foreground flex-1 rounded-xl border px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Log
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab: Activity History */}
            {activeTab === "history" && (
              <div className="space-y-3 text-xs">
                {task.activityLogs && task.activityLogs.length > 0 ? (
                  task.activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border-border/50 flex items-start gap-2.5 border-b pb-2.5"
                    >
                      <div className="bg-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                        {log.actor?.user?.name?.[0] || "A"}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-foreground">
                          <span className="font-semibold">{log.actor?.user?.name || "System"}</span>{" "}
                          <span className="text-muted-foreground">
                            {log.action.toLowerCase().replace(/_/g, " ")}
                          </span>
                          {log.toValue && (
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">
                              {" "}
                              &ldquo;{log.toValue}&rdquo;
                            </span>
                          )}
                        </p>
                        <span className="text-muted-foreground block text-[10px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-3 text-center italic">
                    No activity logs recorded.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
