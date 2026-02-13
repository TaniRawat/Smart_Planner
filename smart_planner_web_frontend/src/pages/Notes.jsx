// src/pages/Notes.jsx
import { useCallback, useMemo, useState } from "react";
import { summarizeText as aiSummarize } from "../api";

/**
 * Notes page
 *
 * Simple UI to paste/upload text and request an AI summary from the backend.
 *
 * Backend contract (expected):
 *   POST /ai/summarize { text }
 *   -> response: {
 *        summary: "Short summary...",
 *        bullets: ["point1", "point2", ...],
 *        keywords: ["kw1","kw2",...],
 *        length: { words: 123, chars: 654 }   // optional
 *      }
 *
 * If your backend returns a different shape, adapt the UI mapping below.
 */

function NotesSummary({ result, onCopy, onDownload, onSave }) {
  if (!result) {
    return null;
  }

  const { summary, bullets = [], keywords = [], length } = result;

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">Summary</h2>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900/40"
          >
            Copy
          </button>
          <button
            onClick={onDownload}
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900/40"
          >
            Download
          </button>
          {onSave && (
            <button
              onClick={onSave}
              className="rounded-md bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500"
            >
              Save (local)
            </button>
          )}
        </div>
      </div>

      <div className="text-sm text-slate-300 whitespace-pre-wrap">{summary}</div>

      {bullets.length > 0 && (
        <div className="pt-2">
          <h3 className="text-sm font-medium text-slate-200">Key bullets</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="inline-block w-2 text-amber-300">•</span>
                <span className="flex-1">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="pt-2">
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

      {length && (
        <div className="text-xs text-slate-500 pt-2">
          {length.words ? `${length.words} words` : ""}{" "}
          {length.chars ? `· ${length.chars} chars` : ""}
        </div>
      )}
    </div>
  );
}

export default function Notes() {
  const [text, setText] = useState("");
  const [uploadHint, setUploadHint] = useState(""); // for file input feedback
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [savedNotes, setSavedNotes] = useState(() => {
    try {
      const raw = localStorage.getItem("notes_summaries_v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const charCount = useMemo(() => text.length, [text]);
  const wordCount = useMemo(() => (text.trim() ? text.trim().split(/\s+/).length : 0), [text]);

  const onPasteText = (e) => {
    setText(e.target.value);
  };

  const onFileChange = async (e) => {
    setUploadHint("");
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    if (f.type === "text/plain" || f.name.endsWith(".txt")) {
      // read text
      const txt = await f.text();
      setText((prev) => (prev ? prev + "\n\n" + txt : txt));
      setUploadHint(`Loaded ${f.name} (${(f.size / 1024).toFixed(1)} KB)`);
    } else if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
      // We accept PDF uploads but extracting text client-side requires pdf.js or a backend step.
      setUploadHint(
        "PDF uploaded. Text extraction from PDFs is not available in this client — please paste text or implement server-side PDF parsing."
      );
      // Optional: you could send the raw PDF bytes to an API that extracts text server-side.
      // For now we keep it simple.
    } else {
      setUploadHint("Unsupported file type. Only .txt (and PDF as a future option) are accepted.");
    }

    // reset input so same file can be re-chosen
    e.target.value = "";
  };

  const handleSummarize = useCallback(
    async (opts = { minWords: 10 }) => {
      setError("");
      setResult(null);

      if (!text || wordCount < opts.minWords) {
        setError(`Please provide at least ${opts.minWords} words of text to summarize.`);
        return;
      }

      setLoading(true);
      try {
        // call API
        const res = await aiSummarize(text);
        // map backend response to expected shape
        // backend may return { summary, bullets, keywords, length }
        const normalized = {
          summary: res.summary || res.text_summary || res.summary_text || String(res),
          bullets: Array.isArray(res.bullets) ? res.bullets : res.items || [],
          keywords: Array.isArray(res.keywords) ? res.keywords : res.tags || [],
          length: res.length || { words: wordCount, chars: charCount },
          raw: res,
        };
        setResult(normalized);
      } catch (err) {
        console.error("aiSummarize error:", err);
        setError(err?.message || "Failed to summarize. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [text, wordCount, charCount]
  );

  const handleCopy = useCallback(() => {
    if (!result) return;
    const toCopy = `Summary:\n\n${result.summary}\n\nBullets:\n${(result.bullets || []).join("\n")}\n\nKeywords:\n${(result.keywords || []).join(", ")}`;
    navigator.clipboard
      .writeText(toCopy)
      .then(() => {
        // small UI feedback
        setUploadHint("Summary copied to clipboard.");
        setTimeout(() => setUploadHint(""), 1800);
      })
      .catch(() => {
        setUploadHint("Could not copy (browser denied).");
        setTimeout(() => setUploadHint(""), 1800);
      });
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob(
      [
        `Summary\n=======\n\n${result.summary}\n\n\nBullets\n=======\n\n${(result.bullets || []).map((b, i) => `${i + 1}. ${b}`).join("\n")}\n\n\nKeywords\n========\n\n${(result.keywords || []).join(", ")}\n`,
      ],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [result]);

  const handleSaveLocal = useCallback(() => {
    if (!result) return;
    const entry = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      text_preview: text.slice(0, 500),
      summary: result.summary,
      bullets: result.bullets,
      keywords: result.keywords,
    };
    const next = [entry, ...savedNotes].slice(0, 50);
    try {
      localStorage.setItem("notes_summaries_v1", JSON.stringify(next));
      setSavedNotes(next);
      setUploadHint("Saved locally.");
      setTimeout(() => setUploadHint(""), 1500);
    } catch {
      setUploadHint("Failed to save locally (storage error).");
      setTimeout(() => setUploadHint(""), 1500);
    }
  }, [result, savedNotes, text]);

  const handleClear = useCallback(() => {
    setText("");
    setResult(null);
    setError("");
    setUploadHint("");
  }, []);

  const removeSaved = useCallback((id) => {
    const next = savedNotes.filter((s) => s.id !== id);
    try {
      localStorage.setItem("notes_summaries_v1", JSON.stringify(next));
    } catch {}
    setSavedNotes(next);
  }, [savedNotes]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-50">Notes & AI Summaries</h1>
        <p className="mt-1 text-sm text-slate-400">
          Paste long notes or upload a <span className="font-medium">.txt</span> file. Press <span className="font-medium">Summarize</span> to ask the AI.
          PDF uploads are accepted but text extraction is not implemented in this client.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {/* Left: Editor & controls */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <label htmlFor="notes-text" className="text-xs font-medium text-slate-300">
              Paste / write your notes
            </label>
            <textarea
              id="notes-text"
              value={text}
              onChange={onPasteText}
              className="mt-2 w-full h-56 resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="Paste your lecture notes, article, or assignment brief..."
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  id="file-input"
                  type="file"
                  accept=".txt, text/plain, application/pdf"
                  onChange={onFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-input"
                  className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900/40 cursor-pointer"
                >
                  Upload .txt / .pdf
                </label>

                <button
                  onClick={() => handleSummarize({ minWords: 5 })}
                  disabled={loading || !text.trim()}
                  className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {loading ? "Summarizing..." : "Summarize"}
                </button>

                <button
                  onClick={handleClear}
                  className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-900/40"
                >
                  Clear
                </button>
              </div>

              <div className="text-xs text-slate-400">
                {wordCount} words · {charCount} chars
              </div>
            </div>

            {uploadHint && <div className="mt-2 text-xs text-slate-300">{uploadHint}</div>}
            {error && <div className="mt-2 rounded-md bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-200">{error}</div>}
          </div>

          {/* Saved summaries (local) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Saved summaries (local)</h3>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem("notes_summaries_v1");
                    setSavedNotes([]);
                  } catch {}
                }}
                className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900/40"
              >
                Clear all
              </button>
            </div>

            {savedNotes.length === 0 ? (
              <div className="mt-3 text-sm text-slate-400">No local summaries yet.</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {savedNotes.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-800 bg-slate-900/50 p-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-100">{s.summary.slice(0, 120)}{s.summary.length > 120 ? "…" : ""}</div>
                      <div className="mt-1 text-xs text-slate-400">{new Date(s.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(s.summary || "").then(() => setUploadHint("Copied summary")).catch(()=>{});
                          setTimeout(()=>setUploadHint(""),1500);
                        }}
                        className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900/40"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([s.summary], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `notes-${s.id}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        }}
                        className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-900/40"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => removeSaved(s.id)}
                        className="rounded-md bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: results */}
        <div className="space-y-4">
          <NotesSummary
            result={result}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onSave={handleSaveLocal}
          />

          {!result && (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
              No summary yet. Paste text and press <strong>Summarize</strong>.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
