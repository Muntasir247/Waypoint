"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskStatus } from "@prisma/client";
import { Plus, AlertCircle, ShieldAlert } from "lucide-react";
import { TaskItem, STATUS_CONFIG } from "./types";
import { TaskCard } from "./task-card";
import { moveTaskAction } from "@/features/tasks/actions";

interface KanbanViewProps {
  tasks: TaskItem[];
  onSelectTask: (taskId: string) => void;
  onAddTask?: (defaultStatus?: TaskStatus) => void;
  onRefresh?: () => void;
  currentUserMembershipId?: string;
  currentUserRole?: "ADMIN" | "DEVELOPER" | "VIEWER";
}

const KANBAN_COLUMNS: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
  TaskStatus.BLOCKED,
];

// Sortable item wrapper
function SortableTaskCard({
  task,
  onSelectTask,
}: {
  task: TaskItem;
  onSelectTask: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task, status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-30" : ""}>
      <TaskCard
        task={task}
        onSelectTask={onSelectTask}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// Droppable column container
function KanbanColumn({
  status,
  tasks,
  onSelectTask,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: TaskItem[];
  onSelectTask: (taskId: string) => void;
  onAddTask?: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  const cfg = STATUS_CONFIG[status];
  const totalPoints = tasks.reduce((sum, t) => sum + (t.estimatePoints || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`border-border bg-muted/40 flex w-72 shrink-0 flex-col rounded-2xl border p-3 shadow-2xs transition-colors ${
        isOver ? "border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20" : ""
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
          <h3 className="text-foreground text-xs font-bold tracking-tight">{cfg.label}</h3>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="text-muted-foreground text-[10px] font-medium"
            title="Total estimate points"
          >
            {totalPoints} pts
          </span>
          {onAddTask && (
            <button
              type="button"
              onClick={() => onAddTask(status)}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-1 transition-colors"
              title={`Add task to ${cfg.label}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cards List */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-[300px] flex-1 flex-col gap-2.5 overflow-y-auto">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onSelectTask={onSelectTask} />
          ))}

          {tasks.length === 0 && (
            <div className="border-border/60 text-muted-foreground flex flex-1 items-center justify-center rounded-xl border border-dashed p-6 text-center text-xs italic">
              No tasks
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanView({
  tasks,
  onSelectTask,
  onAddTask,
  onRefresh,
  currentUserMembershipId,
  currentUserRole,
}: KanbanViewProps) {
  const [activeTask, setActiveTask] = React.useState<TaskItem | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Blocked Reason Prompt Modal state
  const [pendingBlockedMove, setPendingBlockedMove] = React.useState<{
    taskId: string;
    newPosition: number;
  } | null>(null);
  const [blockedReasonInput, setBlockedReasonInput] = React.useState("");

  // Sensors: Require 6px movement before drag initiates so clicks open drawers effortlessly
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Group tasks by status
  const columnsData = React.useMemo(() => {
    const grouped: Record<TaskStatus, TaskItem[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
      BLOCKED: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        grouped.TODO.push(task);
      }
    });

    // Ensure sorted by position
    Object.keys(grouped).forEach((key) => {
      grouped[key as TaskStatus].sort((a, b) => (a.position || 0) - (b.position || 0));
    });

    return grouped;
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      setErrorMessage(null);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = String(active.id);
    const task = tasks.find((t) => t.id === activeTaskId);
    if (!task) return;

    // Determine target column and position
    let targetStatus: TaskStatus = task.status;
    let targetPosition: number = task.position;

    // If dropped over a column container directly
    if (KANBAN_COLUMNS.includes(over.id as TaskStatus)) {
      targetStatus = over.id as TaskStatus;
      const columnTasks = columnsData[targetStatus] || [];
      targetPosition =
        columnTasks.length > 0 ? columnTasks[columnTasks.length - 1].position + 1 : 0;
    } else {
      // Dropped over another task
      const overTaskId = String(over.id);
      const overTask = tasks.find((t) => t.id === overTaskId);
      if (overTask) {
        targetStatus = overTask.status;
        targetPosition = overTask.position;
      }
    }

    // RBAC client-side pre-check
    if (
      currentUserRole === "DEVELOPER" &&
      targetStatus !== task.status &&
      task.assignee?.id !== currentUserMembershipId
    ) {
      setErrorMessage(
        "Permission Denied: Developers can only update the status of their own assigned tasks.",
      );
      return;
    }

    // If moving to BLOCKED, require a reason via prompt dialog
    if (targetStatus === TaskStatus.BLOCKED && task.status !== TaskStatus.BLOCKED) {
      setPendingBlockedMove({ taskId: activeTaskId, newPosition: targetPosition });
      setBlockedReasonInput("");
      return;
    }

    // Execute move action
    const res = await moveTaskAction({
      taskId: activeTaskId,
      newStatus: targetStatus,
      newPosition: targetPosition,
    });

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      onRefresh?.();
    }
  }

  async function handleConfirmBlockedMove(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingBlockedMove || !blockedReasonInput.trim()) return;

    const res = await moveTaskAction({
      taskId: pendingBlockedMove.taskId,
      newStatus: TaskStatus.BLOCKED,
      newPosition: pendingBlockedMove.newPosition,
      blockedReason: blockedReasonInput.trim(),
    });

    setPendingBlockedMove(null);
    setBlockedReasonInput("");

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      onRefresh?.();
    }
  }

  return (
    <div className="space-y-3">
      {/* Error alert toast */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Board Scrollable View */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columnsData[status] || []}
              onSelectTask={onSelectTask}
              onAddTask={onAddTask}
            />
          ))}
        </div>

        {/* Drag Overlay for active card preview */}
        <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragging /> : null}</DragOverlay>
      </DndContext>

      {/* Blocked Reason Dialog Modal */}
      {pendingBlockedMove && (
        <div className="backdrop-blur-2xs fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="border-border bg-card w-full max-w-md rounded-2xl border p-5 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-foreground text-sm font-bold">Task Blocked Reason</h3>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              According to Waypoint specification, moving a task to BLOCKED requires a reason
              explaining what is blocking progress (e.g. prerequisite, upstream API, external design
              approval).
            </p>

            <form onSubmit={handleConfirmBlockedMove} className="mt-4 space-y-3">
              <div>
                <label className="text-muted-foreground text-xs font-semibold">
                  Why is this task blocked?
                </label>
                <textarea
                  required
                  autoFocus
                  rows={3}
                  placeholder="e.g. Waiting on database read replica schema migration from infra team..."
                  value={blockedReasonInput}
                  onChange={(e) => setBlockedReasonInput(e.target.value)}
                  className="border-border bg-background text-foreground mt-1 w-full rounded-xl border p-3 text-xs focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingBlockedMove(null)}
                  className="border-border bg-background text-foreground hover:bg-muted rounded-xl border px-3 py-1.5 text-xs font-medium"
                >
                  Cancel Move
                </button>
                <button
                  type="submit"
                  disabled={!blockedReasonInput.trim()}
                  className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
                >
                  Confirm & Mark Blocked
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
