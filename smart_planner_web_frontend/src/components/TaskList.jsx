// src/components/TaskList.jsx
import React from "react";

/**
 * TaskList
 *
 * Props:
 *  - tasks: array of task objects
 *  - onToggleDone(task): callback
 *  - onDelete(task): callback
 *  - savingIds: Set or Array of ids currently saving (optional)
 *  - deletingIds: Set or Array of ids currently deleting (optional)
 */
export default function TaskList({
  tasks = [],
  onToggleDone,
  onDelete,
  savingIds,
  deletingIds,
  viewMode = "list",
}) {
  const hasId = (container, id) => {
    if (!container) return false;
    if (container instanceof Set) return container.has(id);
    if (Array.isArray(container)) return container.includes(id);
    try {
      return Boolean(container[id]);
    } catch {
      return false;
    }
  };

  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      // friendly local date
      return d.toLocaleDateString();
    } catch {
      return iso;
    }
  };

  const daysLeft = (iso) => {
    if (!iso) return null;
    try {
      const today = new Date();
      const target = new Date(iso);
      // floor difference to days (target - today)
      const diffMs = target.setHours(0, 0, 0, 0) - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      return Math.round(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const isGrid = viewMode === "grid";

  const getPriorityMeta = (value) => {
    const priority = Number(value ?? 3);
    if (priority >= 4) return { label: "High", tone: "bg-rose-500/15 text-rose-300 border-rose-500/30" };
    if (priority === 3) return { label: "Medium", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
    return { label: "Low", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
        No tasks yet. Add something to get started.
      </div>
    );
  }

  return (
    <ul
      className={isGrid ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}
      role="list"
    >
      {tasks.map((task, index) => {
        const key = task.id ?? task._optimistic ?? `${task.title || "task"}-${index}`;
        const saving = hasId(savingIds, task.id);
        const deleting = hasId(deletingIds, task.id);
        const optimistic = Boolean(task._optimistic);

        const formattedDeadline = task.deadline ? formatDate(task.deadline) : null;
        const left = task.deadline ? daysLeft(task.deadline) : null;
        const priorityMeta = getPriorityMeta(task.priority);

        return (
          <li
            key={key}
            className={`flex h-full ${isGrid ? "flex-col" : "flex-col sm:flex-row sm:items-center"} gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-700 ${optimistic ? "opacity-80 animate-pulse" : ""}`}
            aria-live={optimistic ? "polite" : undefined}
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-semibold ${task.done ? "line-through text-slate-500" : "text-slate-50"}`}
                >
                  {task.title}
                </span>

                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityMeta.tone}`}>
                  {priorityMeta.label} priority
                </span>

                {formattedDeadline && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    Due {formattedDeadline}
                    {left !== null && (
                      <span className="ml-2 text-[10px] text-amber-200">
                        ({left >= 0 ? `${left}d` : `${Math.abs(left)}d late`})
                      </span>
                    )}
                  </span>
                )}

                {optimistic && (
                  <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                    Pending
                  </span>
                )}
              </div>

              {task.description && <p className="mt-1 text-xs text-slate-300">{task.description}</p>}
            </div>

            <div className={`flex flex-wrap items-center gap-2 text-xs ${isGrid ? "pt-1" : "sm:justify-end"}`}>
              <button
                onClick={() => onToggleDone && onToggleDone(task)}
                disabled={saving || deleting || optimistic}
                aria-disabled={saving || deleting || optimistic}
                className={`rounded-lg border px-3 py-1 font-medium transition ${
                  task.done
                    ? "border-emerald-700 text-emerald-200 hover:bg-emerald-700/10"
                    : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                } ${saving ? "opacity-60 cursor-wait" : ""}`}
                title={task.done ? "Mark as pending" : "Mark as done"}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Saving...
                  </span>
                ) : task.done ? (
                  "Mark pending"
                ) : (
                  "Mark done"
                )}
              </button>

              <button
                onClick={() => onDelete && onDelete(task)}
                disabled={deleting || saving || optimistic}
                aria-disabled={deleting || saving || optimistic}
                className={`rounded-lg border px-3 py-1 font-medium transition ${
                  deleting ? "border-rose-700 text-rose-200 cursor-wait opacity-60" : "border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                }`}
                title="Delete task"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
