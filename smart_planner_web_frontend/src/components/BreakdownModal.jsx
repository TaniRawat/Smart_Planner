// src/components/BreakdownModal.jsx
import { useEffect, useState, useRef } from "react";

/**
 * BreakdownModal
 *
 * Props:
 *  - subtasks: Array of { title, description?, priority? } returned from AI service
 *  - onClose(): close the modal without creating anything
 *  - onAccept(selectedSubtasks): user accepted, pass back array of subtasks to create
 *
 * Behavior:
 *  - User can edit each suggested subtask (title/description/priority)
 *  - User can toggle which subtasks to include (checkbox)
 *  - "Create selected" returns only enabled/selected subtasks to onAccept
 *  - Accessible (aria) basic modal behavior and Escape key to close
 */
export default function BreakdownModal({ subtasks = [], onClose, onAccept }) {
  const [items, setItems] = useState(
    (subtasks || []).map((s, idx) => ({
      id: s.id ?? `ai-${idx}`,
      title: (s.title ?? "").trim(),
      description: s.description ?? "",
      priority: Number(s.priority ?? 3) || 3,
      enabled: true,
    }))
  );

  const [selectAll, setSelectAll] = useState(true);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);

  // Trap focus to modal (lightweight)
  useEffect(() => {
    const prev = document.activeElement;
    dialogRef.current?.focus?.();
    return () => prev?.focus?.();
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Update selectAll when items change
  useEffect(() => {
    const all = items.length > 0 && items.every((it) => it.enabled);
    setSelectAll(all);
  }, [items]);

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const toggleItem = (id) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, enabled: !it.enabled } : it)));
  };

  const handleSelectAll = () => {
    const next = !selectAll;
    setSelectAll(next);
    setItems((prev) => prev.map((it) => ({ ...it, enabled: next })));
  };

  const handleAccept = async () => {
    setSaving(true);
    try {
      const selected = items
        .filter((it) => it.enabled)
        .map((it) => ({
          title: it.title.trim(),
          description: it.description?.trim() || "",
          priority: Number(it.priority) || 3,
        }))
        .filter((it) => it.title); // skip empty titles

      // return selected to parent
      await Promise.resolve(onAccept?.(selected));
    } catch (err) {
      // parent handles errors; keep modal open
      console.error("BreakdownModal accept error:", err);
    } finally {
      setSaving(false);
    }
  };

  // backdrop click closes
  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const anySelected = items.some((it) => it.enabled && it.title.trim());

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onBackdropClick}
      aria-hidden={false}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="AI suggested subtasks"
        tabIndex={-1}
        className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl bg-slate-900/90 p-4 shadow-2xl ring-1 ring-slate-800"
      >
        <header className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">AI Suggested Subtasks</h2>
            <p className="mt-1 text-xs text-slate-400">
              Review, edit, and select which subtasks to create. AI suggestions are a starting point — you can modify them.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800/40"
            >
              {selectAll ? "Unselect all" : "Select all"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800/40"
            >
              Close
            </button>
          </div>
        </header>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
              No suggestions available.
            </div>
          ) : (
            items.map((it, idx) => (
              <div
                key={it.id}
                className={`rounded-xl border border-slate-800 bg-slate-900/60 p-3 ${
                  !it.enabled ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      id={`chk-${it.id}`}
                      type="checkbox"
                      checked={it.enabled}
                      onChange={() => toggleItem(it.id)}
                      className="h-4 w-4 rounded-sm text-indigo-500 focus:ring-indigo-400"
                    />
                    <div className="min-w-0">
                      <input
                        value={it.title}
                        onChange={(e) => updateItem(it.id, { title: e.target.value })}
                        className="w-full bg-transparent text-sm font-semibold text-slate-50 outline-none placeholder:text-slate-500"
                        placeholder={`Subtask ${idx + 1} title`}
                      />
                      <textarea
                        value={it.description}
                        onChange={(e) => updateItem(it.id, { description: e.target.value })}
                        rows={2}
                        className="mt-1 w-full resize-none rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none"
                        placeholder="Optional description / notes"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <label className="text-[11px] text-slate-400">Priority</label>
                    <select
                      value={it.priority}
                      onChange={(e) => updateItem(it.id, { priority: Number(e.target.value) })}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                    >
                      {[1, 2, 3, 4, 5].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {items.length} suggestion{items.length !== 1 ? "s" : ""} • {items.filter((i) => i.enabled).length} selected
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800/40 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={!anySelected || saving}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                anySelected && !saving
                  ? "bg-emerald-500 text-white hover:bg-emerald-400"
                  : "bg-emerald-700/30 text-emerald-200 cursor-not-allowed opacity-60"
              }`}
            >
              {saving ? "Creating..." : `Create selected (${items.filter((i) => i.enabled).length})`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
