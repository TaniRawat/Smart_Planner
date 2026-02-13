// src/components/NotesSummary.jsx
import React from "react";

/**
 * NotesSummary
 *
 * Props:
 *  - result: { summary: string, bullets: string[], keywords: string[], length?: { words, chars } }
 *  - onCopy(): copy summary to clipboard
 *  - onDownload(): download summary as .txt
 *  - onSave(): optional, save summary (local or server)
 */
export default function NotesSummary({ result, onCopy, onDownload, onSave }) {
  if (!result) return null;

  const { summary = "", bullets = [], keywords = [], length } = result;

  return (
    <aside className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">AI Summary</h2>
          <p className="text-xs text-slate-400">Quick summary, bullets and keywords extracted by the AI.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            aria-label="Copy summary to clipboard"
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900/40"
          >
            Copy
          </button>

          <button
            type="button"
            onClick={onDownload}
            aria-label="Download summary as text file"
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900/40"
          >
            Download
          </button>

          {typeof onSave === "function" && (
            <button
              type="button"
              onClick={onSave}
              aria-label="Save summary"
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Save
            </button>
          )}
        </div>
      </div>

      <div className="text-sm text-slate-300 whitespace-pre-wrap">{summary}</div>

      {bullets && bullets.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-200">Key bullets</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {bullets.map((b, idx) => (
              <li key={idx} className="flex gap-2 items-start">
                <span className="inline-block w-2 text-amber-300">•</span>
                <span className="flex-1">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {keywords && keywords.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-200">Keywords</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {keywords.map((k, i) => (
              <span
                key={i}
                className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium text-slate-300"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {length && (length.words || length.chars) && (
        <div className="text-xs text-slate-500">
          {length.words ? `${length.words} words` : null}
          {length.words && length.chars ? " · " : null}
          {length.chars ? `${length.chars} chars` : null}
        </div>
      )}
    </aside>
  );
}
