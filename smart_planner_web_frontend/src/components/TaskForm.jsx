// src/components/TaskForm.jsx - FIXED
import { useState, useCallback } from "react";
import { breakDownTask } from "../api";            // CHANGED: from aiBreakdown to breakDownTask
import BreakdownModal from "./BreakdownModal";

export default function TaskForm({ onCreate, creating = false }) {
  const MIN_TITLE = 3;
  const MAX_TITLE = 200;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(3);
  const [deadline, setDeadline] = useState("");

  const [localError, setLocalError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [aiSubtasks, setAiSubtasks] = useState([]);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [aiError, setAiError] = useState("");

  const reset = useCallback(() => {
    setTitle("");
    setDescription("");
    setPriority(3);
    setDeadline("");
    setLocalError("");
  }, []);

  const validate = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) return "Title is required.";
    if (trimmed.length < MIN_TITLE) return `Title must be at least ${MIN_TITLE} characters.`;
    if (trimmed.length > MAX_TITLE) return `Title cannot exceed ${MAX_TITLE} characters.`;
    if (deadline) {
      const d = new Date(deadline);
      if (Number.isNaN(d.getTime())) return "Invalid deadline.";
    }
    return "";
  }, [title, deadline]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");
    const err = validate();
    if (err) {
      setLocalError(err);
      return;
    }

    const payload = {
      title: title.trim().slice(0, MAX_TITLE),
      description: description.trim() || "",
      priority: Number(priority) || 3,
      deadline: deadline || null,
    };

    try {
      onCreate && onCreate(payload);
    } catch (err) {
      console.error("onCreate threw:", err);
    }

    reset();
  };

  /* -------------------------------------------------------------------------
     CALL AI BREAKDOWN
  ------------------------------------------------------------------------- */
  const handleBreakdown = async () => {
    setAiError("");
    const err = validate();
    if (err) {
      setLocalError(err);
      return;
    }

    if (!title.trim()) {
      setLocalError("Please enter a title first.");
      return;
    }

    try {
      setLoadingBreakdown(true);

      // CHANGED: Use breakDownTask instead of aiBreakdown
      const res = await breakDownTask(
        title.trim(),
        description.trim(),
        5  // nSubtasks
      );

      // Handle response format
      let subtasks = [];
      if (Array.isArray(res.subtasks)) {
        subtasks = res.subtasks;
      } else if (Array.isArray(res)) {
        subtasks = res;
      } else if (res.data && Array.isArray(res.data.subtasks)) {
        subtasks = res.data.subtasks;
      }

      if (subtasks.length === 0) {
        setAiError("AI did not generate subtasks.");
      } else {
        // Format subtasks for the modal
        const formattedSubtasks = subtasks.map((task, idx) => ({
          id: `ai-${idx}-${Date.now()}`,
          title: task.title || `Subtask ${idx + 1}`,
          description: task.description || "",
          priority: task.priority || 3
        }));
        
        setAiSubtasks(formattedSubtasks);
        setShowModal(true);
      }
    } catch (e) {
      console.error("AI breakdown error:", e);
      setAiError(e.message || "AI breakdown failed. Please try again.");
    } finally {
      setLoadingBreakdown(false);
    }
  };

  /* -------------------------------------------------------------------------
     When user CONFIRMS subtasks → call onCreate for each
  ------------------------------------------------------------------------- */
  const handleAcceptBreakdown = (subtasks) => {
    subtasks.forEach((t) => {
      onCreate &&
        onCreate({
          title: t.title,
          description: t.description || "",
          priority: t.priority || 3,
          deadline: null,
        });
    });
    setShowModal(false);
    reset();
  };

  return (
    <>
      {/* The Modal */}
      {showModal && (
        <BreakdownModal
          subtasks={aiSubtasks}
          onClose={() => setShowModal(false)}
          onAccept={handleAcceptBreakdown}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
        aria-label="Create new task"
      >
        {/* TITLE */}
        <div className="flex flex-col gap-1">
          <label htmlFor="task-form-title" className="text-xs font-medium text-slate-300">
            Task title *
          </label>
          <input
            id="task-form-title"
            name="title"
            type="text"
            minLength={MIN_TITLE}
            maxLength={MAX_TITLE}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Revise DSA arrays"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={creating}
            required
            autoComplete="off"
          />
          <div className="text-xs text-slate-500 mt-1">
            {title.length}/{MAX_TITLE}
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="flex flex-col gap-1">
          <label htmlFor="task-desc" className="text-xs font-medium text-slate-300">
            Description
          </label>
          <textarea
            id="task-desc"
            name="description"
            rows={2}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Practice LeetCode easy questions"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={creating}
          />
        </div>

        {/* PRIORITY + DEADLINE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300">Priority (1–5)</label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              disabled={creating}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {[1, 2, 3, 4, 5].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs font-medium text-slate-300">Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={creating}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* ERROR MESSAGES */}
        {localError && (
          <div className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/40 rounded-lg px-3 py-2">
            {localError}
          </div>
        )}

        {aiError && (
          <div className="text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/40 rounded-lg px-3 py-2">
            {aiError}
          </div>
        )}

        {/* BUTTON ROW */}
        <div className="flex gap-3">
          {/* AI Button */}
          <button
            type="button"
            onClick={handleBreakdown}
            disabled={loadingBreakdown || creating}
            className="flex-1 rounded-lg border border-indigo-500/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-50"
          >
            {loadingBreakdown ? "Thinking..." : "AI Breakdown"}
          </button>

          {/* Normal Create Task Button */}
          <button
            type="submit"
            disabled={creating}
            className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
          >
            {creating ? "Adding..." : "Add task"}
          </button>
        </div>
      </form>
    </>
  );
}