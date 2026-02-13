// src/components/StudyAssistant.jsx
import { useState, useEffect, useRef } from "react";
import { summarizeText, breakDownTask } from "../api";

/**
 * StudyAssistant — small chat-like helper for students (Option A: uses summarizeText / breakDownTask)
 *
 * Changes vs original:
 * - Replaces direct /ai/chat POST with summarizeText / breakDownTask client helpers.
 * - Heuristics decide whether to summarize or generate a study breakdown.
 * - Robust handling of different backend response shapes.
 * - Keeps the same lightweight UI and fallback canned replies.
 */

const FALLBACK_RESPONSES = {
  "what should i study today":
    "Try focusing on 2–3 high-impact topics today. Start with a short warmup problem, then a deeper exercise, then a quick review. For example: 1) Arrays (30m), 2) Linked Lists (45m), 3) Quick revision (15m).",
  "how do i prepare for exams":
    "Create a study schedule, break topics into small chunks, practice with active recall and spaced repetition, and attempt past papers under timed conditions.",
  default:
    "I couldn't reach the AI right now — here are quick tips: set small goals, practice with active problems, take short breaks, and review mistakes.",
};

function useAutoScroll(ref, deps = []) {
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function StudyAssistant({ collapsed = false }) {
  const [messages, setMessages] = useState([
    {
      id: "s-1",
      role: "assistant",
      text: "Hi — I'm Study Assistant. Ask me for a summary, study plan, or practice suggestions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  useAutoScroll(messagesRef, [messages, loading]);

  const addMessage = (role, text) => {
    setMessages((m) => [...m, { id: `${role}-${Date.now()}`, role, text }]);
  };

  /**
   * Normalize summarize response into plain string.
   * Accepts different possible shapes returned by backend.
   */
  function formatSummarizeResult(res) {
    if (!res) return null;
    if (typeof res === "string") return res;
    // common shapes
    if (res.summary) return res.summary;
    if (res.summary_text) return res.summary_text;
    if (res.result) return res.result;
    if (res.text) return res.text;
    // if bullets array present, join them
    if (Array.isArray(res.bullets)) return res.bullets.join("\n• ");
    // fallback to JSON
    try {
      return JSON.stringify(res);
    } catch {
      return null;
    }
  }

  /**
   * Normalize breakdown response into readable text.
   * Expects res.subtasks = [{ title, description? }, ...] or similar
   */
  function formatBreakdownResult(res) {
    if (!res) return null;
    if (typeof res === "string") return res;
    if (Array.isArray(res.subtasks)) {
      return res.subtasks
        .map((s, i) => {
          if (typeof s === "string") return `${i + 1}. ${s}`;
          return `${i + 1}. ${s.title}${s.description ? " — " + s.description : ""}`;
        })
        .join("\n");
    }
    // try common fields
    if (Array.isArray(res.items)) return res.items.map((s, i) => `${i + 1}. ${s}`).join("\n");
    if (res.plan) return typeof res.plan === "string" ? res.plan : JSON.stringify(res.plan);
    // fallback
    try {
      return JSON.stringify(res);
    } catch {
      return null;
    }
  }

  /**
   * Decide which AI endpoint to call using simple heuristics:
   * - If user explicitly asks to "summarize" (word present) OR message is long -> aiSummarize
   * - If user asks for "plan" / "study plan" / contains time like "hour" -> aiBreakdown
   * - Default -> aiSummarize
   */
  async function sendToAI(text) {
    const lower = (text || "").toLowerCase();
    const wantsSummarize = lower.includes("summarize") || lower.includes("summary") || text.length > 150;
    const wantsPlan =
      lower.includes("plan") || lower.includes("study plan") || /\b(hour|hrs|minutes|min|day|week)\b/.test(lower);

    // prefer explicit signals first
    if (wantsPlan && !wantsSummarize) {
      // call breakdown: try to extract small title/description from text
      const title = text.split("\n")[0].slice(0, 120);
      const description = text.length > title.length ? text.slice(title.length).trim() : "";
      try {
        const res = await breakDownTask(title, description, 5);
        return { type: "breakdown", raw: res, text: formatBreakdownResult(res) };
      } catch (err) {
        throw err;
      }
    }

    // default to summarization
    try {
      const res = await summarizeText(text);
      return { type: "summary", raw: res, text: formatSummarizeResult(res) };
    } catch (err) {
      throw err;
    }
  }

  const handleSend = async (evt) => {
    evt?.preventDefault();
    const trimmed = (input || "").trim();
    if (!trimmed) return;
    setError("");
    addMessage("user", trimmed);
    setInput("");
    setLoading(true);

    try {
      const result = await sendToAI(trimmed);
      if (result && result.text) {
        addMessage("assistant", result.text);
      } else {
        // fallback canned answer
        const key = trimmed.toLowerCase();
        const canned = FALLBACK_RESPONSES[key] || FALLBACK_RESPONSES.default;
        addMessage("assistant", canned);
      }
    } catch (err) {
      console.warn("AI call failed:", err);
      const key = trimmed.toLowerCase();
      const canned = FALLBACK_RESPONSES[key] || FALLBACK_RESPONSES.default;
      addMessage("assistant", canned);
      setError("AI service unavailable — returned a helpful tip instead.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (text) => {
    setInput(text);
    setTimeout(() => {
      handleSend({ preventDefault: () => {} });
    }, 120);
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Study Assistant</h3>
        <div className="text-xs text-slate-400">Powered by AI</div>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Ask for summaries, study plans, or quick practice suggestions. Try the suggestions below.
      </p>

      <div ref={messagesRef} className="mt-3 max-h-40 overflow-auto space-y-2 pr-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-md px-3 py-2 ${
                m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200"
              }`}
            >
              <div className="text-xs whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400">Thinking...</div>}
      </div>

      {error && <div className="mt-3 text-xs text-rose-300">{error}</div>}

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask: 'Summarize arrays' or 'Study plan for 2 hours'..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          disabled={loading}
          aria-label="Ask study assistant"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition disabled:opacity-60"
        >
          {loading ? "..." : "Send"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleQuickPrompt("What should I study today?")}
          className="text-xs rounded-md px-2 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700"
        >
          What should I study today?
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt("Give me a 1-hour study plan for DSA")}
          className="text-xs rounded-md px-2 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700"
        >
          1-hour study plan
        </button>
        <button
          type="button"
          onClick={() => handleQuickPrompt("Summarize arrays topic for quick revision")}
          className="text-xs rounded-md px-2 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700"
        >
          Summarize 'arrays'
        </button>
      </div>
    </div>
  );
}
