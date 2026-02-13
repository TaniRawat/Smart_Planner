// src/pages/Dashboard.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  getTasks as listTasks,
  createTask,
  updateTask as patchTask,
  deleteTask,
  summarizeText,
  breakDownTask 
} from "../api";
import TaskForm from "../components/TaskForm";
import TaskList from "../components/TaskList";
import StudyAssistant from "../components/StudyAssistant";
import { v4 as uuidv4 } from "uuid";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';

// Premium Icons Library
const RefreshIcon = ({ spin }) => (
  <svg className={`w-5 h-5 ${spin ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const StatsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const UserCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804C6.171 16.752 7.651 16 9.35 16h5.3c1.7 0 3.179.752 4.229 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Dashboard page (Premium Enhanced UI/UX)
 */
export default function Dashboard({ user }) {
  // --- STATE MANAGEMENT ---
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskError, setTaskError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [savingIds, setSavingIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [creating, setCreating] = useState(false);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [priorityFilter, setPriorityFilter] = useState("all"); // all, high, medium, low

  const [notice, setNotice] = useState("");
  const noticeTimerRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [infoModal, setInfoModal] = useState(null);

  const [planInput, setPlanInput] = useState("");
  const [quickPlan, setQuickPlan] = useState([
    { id: "plan-1", text: "Review yesterday's notes", done: false },
    { id: "plan-2", text: "Solve 2 practice problems", done: false },
    { id: "plan-3", text: "Summarize one topic", done: false },
  ]);

  const [reactionState, setReactionState] = useState("idle"); // idle | waiting | ready | result
  const [reactionMessage, setReactionMessage] = useState("Tap start to test your focus.");
  const [reactionStartAt, setReactionStartAt] = useState(null);
  const [reactionTime, setReactionTime] = useState(null);
  const [reactionBest, setReactionBest] = useState(() => {
    try {
      const raw = localStorage.getItem("sp_reaction_best");
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  });

  const [reactionStats, setReactionStats] = useState(() => {
    try {
      const raw = localStorage.getItem("sp_reaction_stats");
      return raw ? JSON.parse(raw) : { totalAttempts: 0, totalCompleted: 0, avg: 0 };
    } catch {
      return { totalAttempts: 0, totalCompleted: 0, avg: 0 };
    }
  });



  const [streak, setStreak] = useState(() => {
    try {
      const raw = localStorage.getItem("sp_streak");
      return raw ? JSON.parse(raw) : { current: 0, longest: 0, lastCheckIn: null };
    } catch {
      return { current: 0, longest: 0, lastCheckIn: null };
    }
  });

  const notificationRef = useRef(null);
  const filterRef = useRef(null);

  const WORK_DURATION = 25 * 60;
  const BREAK_DURATION = 5 * 60;
  const [timerMode, setTimerMode] = useState("work");
  const [timerSeconds, setTimerSeconds] = useState(WORK_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);

  const debounceRef = useRef(null);

  // --- LOGIC HELPERS ---

  const normalizeError = (err) => {
    if (!err) return null;
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    return "An unexpected error occurred.";
  };

  const addId = (setFn, id) => setFn((prev) => new Set([...Array.from(prev), id]));
  const delId = (setFn, id) =>
    setFn((prev) => {
      const s = new Set(Array.from(prev));
      s.delete(id);
      return s;
    });

  const normalizeList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.items && Array.isArray(data.items)) return data.items;
    return [];
  };

  const flashNotice = useCallback((message, timeout = 2500) => {
    setNotice(message);
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    if (timeout > 0) {
      noticeTimerRef.current = setTimeout(() => setNotice(""), timeout);
    }
  }, []);

  const formatTime = (seconds) => {
    const safe = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(safe / 60).toString().padStart(2, "0");
    const secs = Math.floor(safe % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const toCsvValue = (value) => {
    const safe = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(safe)) {
      return `"${safe.replace(/"/g, '""')}"`;
    }
    return safe;
  };

  const downloadFile = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportTasks = useCallback(() => {
    if (!tasks || tasks.length === 0) {
      flashNotice("No tasks available to export.");
      return;
    }

    const header = ["Title", "Description", "Priority", "Deadline", "Done"].join(",");
    const rows = tasks.map((t) => [
      toCsvValue(t.title),
      toCsvValue(t.description || ""),
      toCsvValue(t.priority ?? 3),
      toCsvValue(t.deadline || ""),
      toCsvValue(t.done ? "true" : "false"),
    ].join(","));

    const csv = [header, ...rows].join("\n");
    downloadFile(csv, `tasks-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
    flashNotice("Tasks exported as CSV.");
  }, [tasks, flashNotice]);

  const handleTimerStart = useCallback(() => {
    if (timerSeconds <= 0) {
      setTimerSeconds(timerMode === "work" ? WORK_DURATION : BREAK_DURATION);
    }
    setTimerRunning(true);
  }, [timerSeconds, timerMode, WORK_DURATION, BREAK_DURATION]);

  const handleTimerPause = useCallback(() => {
    setTimerRunning(false);
  }, []);

  const handleTimerReset = useCallback(() => {
    setTimerRunning(false);
    setTimerMode("work");
    setTimerSeconds(WORK_DURATION);
    flashNotice("Timer reset to 25:00.");
  }, [flashNotice, WORK_DURATION]);

  const handlePomodoroFocus = useCallback(() => {
    setTimerMode("work");
    setTimerSeconds(WORK_DURATION);
    setTimerRunning(true);
    document.getElementById("focus-timer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    flashNotice("Pomodoro started.");
  }, [flashNotice, WORK_DURATION]);

  const handleAddPlanItem = useCallback(() => {
    const trimmed = planInput.trim();
    if (!trimmed) return;
    setQuickPlan((prev) => [
      { id: `plan-${Date.now()}`, text: trimmed, done: false },
      ...prev,
    ]);
    setPlanInput("");
  }, [planInput]);

  const handleTogglePlanItem = useCallback((id) => {
    setQuickPlan((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }, []);

  const handleRemovePlanItem = useCallback((id) => {
    setQuickPlan((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const reactionTimerRef = useRef(null);

  const handleReactionStart = useCallback(() => {
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
    }
    setReactionState("waiting");
    setReactionTime(null);
    setReactionMessage("Wait for green...");
    const delay = 800 + Math.random() * 2200;
    reactionTimerRef.current = setTimeout(() => {
      setReactionState("ready");
      setReactionStartAt(Date.now());
      setReactionMessage("Go! Tap now!");
    }, delay);
  }, []);

  const handleReactionTap = useCallback(() => {
    if (reactionState === "waiting") {
      if (reactionTimerRef.current) {
        clearTimeout(reactionTimerRef.current);
      }
      setReactionState("result");
      setReactionMessage("Too soon! Try again.");
      return;
    }
    if (reactionState === "ready" && reactionStartAt) {
      const ms = Date.now() - reactionStartAt;
      setReactionTime(ms);
      setReactionState("result");
      setReactionMessage("Nice! That was fast.");
      setReactionStats((prev) => {
        const next = {
          totalAttempts: prev.totalAttempts + 1,
          totalCompleted: prev.totalCompleted + 1,
          avg: prev.totalCompleted === 0 ? ms : Math.round((prev.avg * prev.totalCompleted + ms) / (prev.totalCompleted + 1)),
        };
        try {
          localStorage.setItem("sp_reaction_stats", JSON.stringify(next));
        } catch {}
        return next;
      });
      setReactionBest((prev) => {
        const next = prev === null ? ms : Math.min(prev, ms);
        try {
          localStorage.setItem("sp_reaction_best", String(next));
        } catch {}
        return next;
      });
      return;
    }
  }, [reactionState, reactionStartAt]);



  const handleCheckIn = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setStreak((prev) => {
      if (prev.lastCheckIn === today) return prev;
      const nextCurrent = prev.current + 1;
      const nextLongest = Math.max(prev.longest, nextCurrent);
      return { current: nextCurrent, longest: nextLongest, lastCheckIn: today };
    });
    flashNotice("Streak updated. Nice work!");
  }, [flashNotice]);

  // --- API CALLS ---

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setTaskError(null);
    try {
      let data;
      if (typeof listTasks === "function") {
        const res = await listTasks({ per_page: 200 });
        data = res?.items ?? res;
      } else if (typeof api.fetchTasks === "function") {
        data = await api.fetchTasks();
      } else {
        throw new Error("No task loader available.");
      }
      const items = normalizeList(data);
      
      const canonical = items.map((t) => ({
        ...t,
        priority: t.priority ?? 3,
        deadline: t.deadline || null,
        done: t.done ?? t.completed ?? false,
        created_at: t.created_at || new Date().toISOString(),
      }));

      // Sort logic
      canonical.sort((a, b) => {
        if ((a.done || false) !== (b.done || false)) return a.done ? 1 : -1;
        if ((a.priority ?? 3) !== (b.priority ?? 3)) return (a.priority ?? 3) - (b.priority ?? 3);
        const da = a.deadline ? new Date(a.deadline) : null;
        const db = b.deadline ? new Date(b.deadline) : null;
        if (da && db) return da - db;
        if (da && !db) return -1;
        if (!da && db) return 1;
        return 0;
      });

      setTasks(canonical);
    } catch (err) {
      console.error("loadTasks error:", err);
      setTaskError(normalizeError(err) || "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, user, refreshKey]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    if (!timerRunning) return undefined;

    const timerId = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          const nextMode = timerMode === "work" ? "break" : "work";
          setTimerMode(nextMode);
          setTimerRunning(false);
          flashNotice(
            nextMode === "break"
              ? "Focus block complete. Take a 5-minute break."
              : "Break finished. Back to focus."
          );
          return nextMode === "work" ? WORK_DURATION : BREAK_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timerRunning, timerMode, flashNotice, WORK_DURATION, BREAK_DURATION]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (showNotifications && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (filterOpen && filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifications, filterOpen]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (reactionTimerRef.current) {
        clearTimeout(reactionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sp_streak", JSON.stringify(streak));
    } catch {}
  }, [streak]);

  // --- HANDLERS (Optimistic) ---

  const handleCreateTask = useCallback(async (taskInput) => {
    setTaskError(null);
    setCreating(true);
    const tempId = `tmp-${uuidv4()}`;
    const optimisticTask = {
      id: tempId,
      title: taskInput.title,
      description: taskInput.description || "",
      priority: taskInput.priority ?? 3,
      deadline: taskInput.deadline ?? null,
      done: false,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };

    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const created = await createTask(taskInput);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      setTaskError(normalizeError(err) || "Could not create task.");
    } finally {
      setCreating(false);
    }
  }, [normalizeError]);

  const handleQuickAdd = useCallback(() => {
    const title = window.prompt("Quick task title:");
    if (!title || !title.trim()) {
      flashNotice("Quick task canceled.");
      return;
    }
    handleCreateTask({ title: title.trim(), description: "", priority: 3, deadline: null });
    flashNotice("Quick task added.");
  }, [flashNotice, handleCreateTask]);

  const handleToggleDone = async (task) => {
    setTaskError(null);
    const id = task.id;
    addId(setSavingIds, id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

    try {
      const updater = typeof patchTask === "function" ? patchTask : api.updateTask;
      const updated = await updater(id, { done: !task.done });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: task.done } : t))); // Rollback
      setTaskError(normalizeError(err) || "Could not update task.");
    } finally {
      delId(setSavingIds, id);
    }
  };

  const handleDeleteTask = async (task) => {
    setTaskError(null);
    const id = task.id;
    addId(setDeletingIds, id);
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTask(id);
    } catch (err) {
      setTasks(snapshot);
      setTaskError(normalizeError(err) || "Could not delete task.");
    } finally {
      delId(setDeletingIds, id);
    }
  };

  // --- FILTERING & METRICS ---

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isUpcoming = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    const diff = (d - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  };

  const getPriorityLabel = (priority) => {
    if (priority >= 4) return { label: "High", color: "bg-rose-500", text: "text-rose-400" };
    if (priority >= 3) return { label: "Medium", color: "bg-amber-500", text: "text-amber-400" };
    return { label: "Low", color: "bg-emerald-500", text: "text-emerald-400" };
  };

  const filteredTasks = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    let list = tasks;

    if (q) {
      list = list.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q)
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      list = list.filter((t) => {
        const priority = t.priority ?? 3;
        if (priorityFilter === "high") return priority >= 4;
        if (priorityFilter === "medium") return priority === 3;
        if (priorityFilter === "low") return priority <= 2;
        return true;
      });
    }

    switch (activeTab) {
      case "today": return list.filter((t) => !t.done && isToday(t.deadline));
      case "upcoming": return list.filter((t) => !t.done && !isToday(t.deadline) && isUpcoming(t.deadline));
      case "nodead": return list.filter((t) => !t.deadline && !t.done);
      case "completed": return list.filter((t) => t.done);
      case "inbox":
      default: return list.filter((t) => !t.done);
    }
  }, [tasks, query, activeTab, priorityFilter]);

  const tabCounts = useMemo(() => {
    return {
      inbox: tasks.filter((t) => !t.done).length,
      today: tasks.filter((t) => !t.done && isToday(t.deadline)).length,
      upcoming: tasks.filter((t) => !t.done && isUpcoming(t.deadline)).length,
      nodead: tasks.filter((t) => !t.done && !t.deadline).length,
      completed: tasks.filter((t) => t.done).length,
    };
  }, [tasks]);

  const calculateStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.done).length;
    const overdueTasks = tasks.filter(t => {
      if (!t.deadline || t.done) return false;
      return new Date(t.deadline) < new Date() && !isToday(t.deadline);
    }).length;
    const highPriorityTasks = tasks.filter(t => !t.done && t.priority >= 4).length;
    const mediumPriorityTasks = tasks.filter(t => !t.done && t.priority === 3).length;
    const lowPriorityTasks = tasks.filter(t => !t.done && t.priority <= 2).length;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentTasks = tasks.filter(t => new Date(t.created_at) > weekAgo).length;
    
    return {
      total: totalTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      highPriority: highPriorityTasks,
      mediumPriority: mediumPriorityTasks,
      lowPriority: lowPriorityTasks,
      recent: recentTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      productivityScore: totalTasks > 0 ? Math.round((completedTasks / (totalTasks + overdueTasks)) * 100) : 0
    };
  }, [tasks]);

  const notifications = useMemo(() => {
    const items = [];
    if (calculateStats.overdue > 0) {
      items.push({
        title: "Overdue tasks",
        detail: `${calculateStats.overdue} task${calculateStats.overdue === 1 ? "" : "s"} overdue`,
        tone: "rose",
      });
    }
    if (tabCounts.today > 0) {
      items.push({
        title: "Due today",
        detail: `${tabCounts.today} task${tabCounts.today === 1 ? "" : "s"} scheduled today`,
        tone: "amber",
      });
    }
    if (calculateStats.completionRate >= 75 && calculateStats.total > 0) {
      items.push({
        title: "Great momentum",
        detail: `Completion rate is ${calculateStats.completionRate}% this week`,
        tone: "emerald",
      });
    }
    if (items.length === 0) {
      items.push({
        title: "All caught up",
        detail: "No alerts right now. Keep the streak going.",
        tone: "emerald",
        empty: true,
      });
    }
    return items;
  }, [calculateStats, tabCounts]);

  const notificationCount = notifications.filter((item) => !item.empty).length;

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.deadline && !t.done && new Date(t.deadline) > new Date())
      .slice(0, 3);
  }, [tasks]);

  const tabs = [
    { id: "inbox", label: "Inbox", icon: <DashboardIcon />, color: "from-indigo-500 to-purple-600" },
    { id: "today", label: "Today", icon: <CalendarIcon />, color: "from-emerald-500 to-cyan-600" },
    { id: "upcoming", label: "Upcoming", icon: <TrendingUpIcon />, color: "from-amber-500 to-orange-600" },
    { id: "nodead", label: "No Date", icon: <ClockIcon />, color: "from-slate-500 to-slate-700" },
    { id: "completed", label: "Completed", icon: <CheckCircleIcon />, color: "from-green-500 to-emerald-600" },
  ];

  const priorityOptions = [
    { id: "all", label: "All Priorities" },
    { id: "high", label: "High Priority", color: "text-rose-400" },
    { id: "medium", label: "Medium Priority", color: "text-amber-400" },
    { id: "low", label: "Low Priority", color: "text-emerald-400" },
  ];

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const infoContent = {
    help: {
      title: "Help Center",
      body: "Use the Dashboard to create tasks, filter by priority, and track progress. Notes helps you summarize study material. The Focus Timer is a Pomodoro to keep sessions structured.",
    },
    privacy: {
      title: "Privacy",
      body: "Your tasks and summaries are stored in your account. The app only uses data needed to provide study planning and AI summaries. You can delete tasks anytime.",
    },
    terms: {
      title: "Terms",
      body: "This app is provided as-is for study planning. AI features may return imperfect results. Always verify critical information.",
    },
  };

  const activeInfo = infoModal ? infoContent[infoModal] : null;

  // --- RENDER ---

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950/30 text-slate-200 font-sans overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-60 -left-60 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-pulse-slow animation-delay-3000"></div>
      </div>

      {/* Floating Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px),
                           linear-gradient(to bottom, #334155 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative mx-auto w-full max-w-screen-2xl px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12">
        
        {/* Header Section */}
        <header className="mb-6 sm:mb-8 md:mb-10 lg:mb-12">
          <div className="flex flex-col gap-6 md:gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-2.5 sm:p-3 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800/60 shadow-2xl">
                    <svg className="w-6 sm:w-7 h-6 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
                    {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{user?.name || user?.email?.split('@')[0] || "Student"}</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Welcome to your Smart Study Dashboard
                  </p>
                </div>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {/* Notification & Profile */}
              <div className="flex items-center gap-3">
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications((prev) => !prev)}
                    aria-haspopup="true"
                    aria-expanded={showNotifications}
                    className="relative p-2 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800/50 transition-all group"
                  >
                    <BellIcon />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] bg-rose-500 text-white rounded-full ring-2 ring-slate-900 flex items-center justify-center">
                        {notificationCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-slate-800/60 bg-slate-900/95 backdrop-blur-sm shadow-2xl p-4 z-50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-white">Notifications</p>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-slate-400 hover:text-slate-200"
                        >
                          Close
                        </button>
                      </div>
                      <div className="space-y-3">
                        {notifications.map((item, idx) => (
                          <div
                            key={`${item.title}-${idx}`}
                            className="rounded-xl border border-slate-800/50 bg-slate-900/60 px-3 py-2"
                          >
                            <p className="text-sm text-slate-200">{item.title}</p>
                            <p className={`text-xs ${item.tone === "rose" ? "text-rose-300" : item.tone === "amber" ? "text-amber-300" : "text-emerald-300"}`}>
                              {item.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800/50">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                    <UserCircleIcon />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user?.name || user?.email?.split('@')[0]}</p>
                    <p className="text-xs text-slate-400">Student</p>
                  </div>
                </div>
              </div>
              
              {/* Sync Button */}
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                disabled={loading}
                className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/30 hover:from-slate-800 hover:to-slate-900 active:scale-95 transition-all duration-300 text-sm font-medium text-slate-300 shadow-lg hover:shadow-indigo-500/10"
              >
                <RefreshIcon spin={loading} />
                <span>{loading ? "Syncing..." : "Sync Now"}</span>
              </button>
            </div>
          </div>
        </header>

        {notice && (
          <div className="mb-6 rounded-xl border border-slate-800/50 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
            {notice}
          </div>
        )}

        {/* Main Dashboard Grid */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 lg:gap-7 xl:gap-8 items-start">
          
          {/* Left Sidebar - Stats & Calendar (Mobile: full, Tablet: 1/2, Desktop: 3 cols) */}
          <div className="md:col-span-1 lg:col-span-3 space-y-4 sm:space-y-5 md:space-y-6 lg:sticky lg:top-28 self-start min-w-0">
            
            {/* User Stats Card */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/90 backdrop-blur-sm rounded-3xl border border-slate-800/60 p-4 sm:p-5 md:p-6 shadow-2xl hover:border-slate-700/60 transition-all duration-300">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <TargetIcon />
                  <span className="hidden sm:inline">Your Stats</span>
                  <span className="sm:hidden">Stats</span>
                </h3>
                <span className="text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  This Week
                </span>
              </div>
              
              {/* Productivity Score */}
              <div className="mb-5 sm:mb-6 space-y-2 sm:space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-slate-400">Productivity Score</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-400">{calculateStats.productivityScore}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-1000"
                    style={{ width: `${calculateStats.productivityScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="text-center p-2.5 sm:p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-colors duration-200">
                  <div className="text-lg sm:text-xl font-bold text-white">{tabCounts.today}</div>
                  <div className="text-xs text-slate-400 mt-0.5 sm:mt-1">Due Today</div>
                </div>
                <div className="text-center p-2.5 sm:p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-colors duration-200">
                  <div className="text-lg sm:text-xl font-bold text-emerald-400">{calculateStats.completed}</div>
                  <div className="text-xs text-slate-400 mt-0.5 sm:mt-1">Completed</div>
                </div>
                <div className="text-center p-2.5 sm:p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-colors duration-200">
                  <div className="text-lg sm:text-xl font-bold text-rose-400">{calculateStats.overdue}</div>
                  <div className="text-xs text-slate-400 mt-0.5 sm:mt-1">Overdue</div>
                </div>
                <div className="text-center p-2.5 sm:p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/50 transition-colors duration-200">
                  <div className="text-lg sm:text-xl font-bold text-amber-400">{calculateStats.highPriority}</div>
                  <div className="text-xs text-slate-400 mt-0.5 sm:mt-1">High</div>
                </div>
              </div>
            </div>

            {/* Calendar Widget */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/90 backdrop-blur-sm rounded-3xl border border-slate-800/60 p-4 sm:p-5 md:p-6 shadow-2xl hover:border-slate-700/60 transition-all duration-300">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-2 mb-4 sm:mb-5 md:mb-6">
                <CalendarIcon />
                <span className="hidden sm:inline">Calendar</span>
                <span className="sm:hidden">Dates</span>
              </h3>
              
              <div className="bg-slate-900/50 rounded-xl p-3 sm:p-4 border border-slate-800/50 mb-4 sm:mb-5 md:mb-6">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  className="!bg-transparent !border-0 !text-slate-300 !text-xs sm:!text-sm"
                  tileClassName={({ date, view }) => {
                    let classes = '';
                    if (view === 'month') {
                      // Highlight current date
                      if (date.toDateString() === new Date().toDateString()) {
                        classes += '!bg-indigo-500 !text-white rounded-full';
                      } else {
                        // Highlight dates with tasks
                        const dateString = date.toISOString().split('T')[0];
                        const hasTask = tasks.some((task) => {
                          const taskDate = task.deadline?.split('T')[0] || '';
                          return taskDate === dateString;
                        });
                        if (hasTask) {
                          classes += '!bg-indigo-500/30 !text-indigo-200 rounded-lg font-semibold';
                        }
                      }
                    }
                    return classes;
                  }}
                />
              </div>
              
              {/* Upcoming Deadlines */}
              <div className="space-y-2 sm:space-y-3">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-300">Upcoming Deadlines</h4>
                {upcomingTasks.length === 0 ? (
                  <div className="rounded-lg border border-slate-800/50 bg-slate-900/40 p-2.5 sm:p-3 text-xs text-slate-400">
                    No upcoming deadlines. You are all caught up.
                  </div>
                ) : (
                  upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 hover:border-slate-700/50 transition-colors duration-200">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityLabel(task.priority).color}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-slate-200 truncate">{task.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(task.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/90 backdrop-blur-sm rounded-3xl border border-slate-800/60 p-4 sm:p-5 md:p-6 shadow-2xl hover:border-slate-700/60 transition-all duration-300">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-3 sm:mb-4 md:mb-5 flex items-center gap-2">
                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden sm:inline">Quick Actions</span>
                <span className="sm:hidden">Actions</span>
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={handleQuickAdd}
                  className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200 group"
                >
                  <svg className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs sm:text-sm text-slate-200">Add Task</span>
                </button>
                <button
                  onClick={handleExportTasks}
                  className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 group"
                >
                  <svg className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-xs sm:text-sm text-slate-200">Export</span>
                </button>
                <button
                  onClick={handlePomodoroFocus}
                  className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all duration-200 group"
                >
                  <svg className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs sm:text-sm text-slate-200">Timer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-1 lg:col-span-6 min-w-0 space-y-4 sm:space-y-5 md:space-y-6">
            
            {/* Enhanced Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
              <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-950/20 backdrop-blur-sm rounded-2xl border border-indigo-800/30 p-4 sm:p-5 shadow-xl hover:border-indigo-700/50 transition-all duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-indigo-300">Total Tasks</p>
                    <p className="text-xl sm:text-2xl font-bold text-white mt-1">{calculateStats.total}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-indigo-500/20">
                    <StatsIcon />
                  </div>
                </div>
                <div className="mt-3 h-1 bg-indigo-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/20 backdrop-blur-sm rounded-2xl border border-emerald-800/30 p-4 sm:p-5 shadow-xl hover:border-emerald-700/50 transition-all duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-emerald-300">Completion Rate</p>
                    <p className="text-xl sm:text-2xl font-bold text-white mt-1">{calculateStats.completionRate}%</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/20">
                    <TrendingUpIcon />
                  </div>
                </div>
                <div className="mt-3 h-1 bg-emerald-500/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${calculateStats.completionRate}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-rose-900/40 to-rose-950/20 backdrop-blur-sm rounded-2xl border border-rose-800/30 p-4 sm:p-5 shadow-xl hover:border-rose-700/50 transition-all duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-rose-300">Focus Needed</p>
                    <p className="text-xl sm:text-2xl font-bold text-white mt-1">{calculateStats.overdue}</p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-rose-500/20">
                    <ClockIcon />
                  </div>
                </div>
                <div className="mt-3 h-1 bg-rose-500/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-400 rounded-full"
                    style={{ width: `${Math.min(calculateStats.overdue * 20, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Task Management Area */}
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/50 backdrop-blur-sm rounded-3xl border border-slate-800/50 shadow-2xl overflow-hidden hover:border-slate-700/50 transition-all duration-300">
              
              {/* Enhanced Header with Advanced Controls */}
              <div className="p-4 sm:p-5 md:p-6 border-b border-slate-800/50">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 w-full">
                    <div className="relative group">
                      <div className={`absolute inset-0 rounded-xl border-2 transition-all duration-500 ${
                        isSearchFocused 
                          ? "border-indigo-500/40 bg-indigo-500/5" 
                          : "border-slate-800/30 bg-slate-800/10 group-hover:border-slate-700/50"
                      }`}></div>
                      <div className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                        isSearchFocused ? "text-indigo-400 scale-110" : "text-slate-500"
                      }`}>
                        <SearchIcon />
                      </div>
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        placeholder="Search tasks..."
                        className="relative block w-full rounded-xl bg-transparent py-2.5 sm:py-3 pl-10 sm:pl-12 pr-10 sm:pr-12 text-xs sm:text-sm slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-0 transition-all"
                      />
                      {query && (
                        <button
                          onClick={() => setQuery("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Advanced Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/50 border border-slate-800/50">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-300"}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-300"}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Priority Filter */}
                    <div className="relative" ref={filterRef}>
                      <button
                        onClick={() => setFilterOpen((prev) => !prev)}
                        aria-haspopup="true"
                        aria-expanded={filterOpen}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800/50 text-sm text-slate-300 transition-all"
                      >
                        <FilterIcon />
                        <span>Filter</span>
                      </button>
                      <div className={`absolute right-0 mt-2 w-48 transition-all duration-200 z-50 ${filterOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
                        <div className="bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-800/50 p-2 shadow-2xl">
                          {priorityOptions.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => {
                                setPriorityFilter(option.id);
                                setFilterOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                                priorityFilter === option.id
                                  ? "bg-slate-800 text-white"
                                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
                              }`}
                            >
                              <span className={option.color || "text-slate-300"}>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tabs Navigation */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      const count = tabCounts[tab.id];
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`group relative flex items-center gap-3 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-medium transition-all duration-300 ${
                            isActive 
                              ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` 
                              : "bg-slate-900/30 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-slate-800/30"
                          }`}
                        >
                          <span className={`transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                            {tab.icon}
                          </span>
                          {tab.label}
                          {count > 0 && (
                            <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                              isActive 
                                ? "bg-white/20 text-white" 
                                : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Task List Area */}
              <div className="p-6">
                {taskError && (
                  <div className="mb-6 rounded-xl bg-gradient-to-r from-rose-950/40 to-rose-900/20 border border-rose-500/20 p-4 flex items-start gap-3 animate-fade-in">
                    <div className="p-1.5 bg-rose-500/20 rounded-lg flex-shrink-0">
                      <svg className="w-5 h-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-rose-200">{taskError}</p>
                    </div>
                    <button onClick={() => setTaskError(null)} className="text-rose-400 hover:text-rose-300 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="min-h-[520px]">
                  {loading && filteredTasks.length === 0 ? (
                    // Premium Skeleton Loader
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-28 rounded-2xl bg-gradient-to-r from-slate-900/20 via-slate-800/10 to-slate-900/20 border border-slate-800/30"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    // Enhanced Empty State
                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800/50 bg-gradient-to-b from-slate-900/10 to-slate-900/5 py-20 px-8 text-center">
                      <div className="relative mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-2xl rounded-full"></div>
                        <div className="relative p-6 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800/60 shadow-2xl">
                          <svg className="w-16 h-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-slate-200 mb-3">
                        {query ? "No matching tasks found" : "Your task list is perfectly clear!"}
                      </h3>
                      <p className="text-slate-400 max-w-md mb-6">
                        {query 
                          ? "Try adjusting your search terms or clear the search to see all your tasks." 
                          : "Start by creating your first task to organize your study journey. Every great achievement starts with a single step."}
                      </p>
                      {query ? (
                        <button
                          onClick={() => setQuery("")}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all"
                        >
                          Clear Search
                        </button>
                      ) : (
                        <button
                          onClick={() => document.getElementById('task-form-title')?.focus()}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all"
                        >
                          Create Your First Task
                        </button>
                      )}
                    </div>
                  ) : (
                    // Task List
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {activeTab === "inbox" ? "All Tasks" : 
                             activeTab === "today" ? "Today's Tasks" :
                             activeTab === "upcoming" ? "Upcoming Schedule" :
                             activeTab === "nodead" ? "Tasks Without Deadline" : "Completed Tasks"}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">
                            Showing {filteredTasks.length} of {tasks.length} tasks
                            {priorityFilter !== "all" && ` • Filtered by ${priorityFilter} priority`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">
                            {viewMode === "grid" ? "Grid View" : "List View"}
                          </span>
                          <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                              style={{ width: `${(filteredTasks.length / Math.max(tasks.length, 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <TaskList
                        tasks={filteredTasks}
                        onToggleDone={handleToggleDone}
                        onDelete={handleDeleteTask}
                        savingIds={savingIds}
                        deletingIds={deletingIds}
                        viewMode={viewMode}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Plan + Weekly Focus */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800/50 bg-slate-900/60 p-4 sm:p-5 md:p-6 shadow-2xl hover:border-slate-700/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Quick Plan</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={planInput}
                    onChange={(e) => setPlanInput(e.target.value)}
                    placeholder="Add goal..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-100 outline-none focus:border-indigo-500 transition-colors duration-200"
                  />
                  <button
                    onClick={handleAddPlanItem}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-indigo-500 transition-all duration-200 active:scale-95"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 sm:mt-4 space-y-2">
                  {quickPlan.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-3 text-xs sm:text-sm text-slate-400">
                      No goals yet. Add your first one.
                    </div>
                  ) : (
                    quickPlan.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 sm:gap-3 rounded-xl border border-slate-800/50 bg-slate-900/40 px-3 py-2 hover:bg-slate-900/60 transition-colors duration-200"
                      >
                        <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => handleTogglePlanItem(item.id)}
                            className="h-3.5 sm:h-4 w-3.5 sm:w-4 rounded border-slate-700 bg-slate-900 text-indigo-500 flex-shrink-0"
                          />
                          <span className={item.done ? "line-through text-slate-500 truncate" : "truncate"}>{item.text}</span>
                        </label>
                        <button
                          onClick={() => handleRemovePlanItem(item.id)}
                          className="text-xs text-slate-400 hover:text-rose-300 flex-shrink-0 transition-colors duration-200"
                          aria-label="Remove plan item"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800/50 bg-slate-900/60 p-4 sm:p-5 md:p-6 shadow-2xl hover:border-slate-700/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Weekly Focus</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">This Week</span>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-3 sm:p-4 hover:bg-slate-900/60 transition-colors duration-200">
                    <p className="text-xs sm:text-sm font-medium text-slate-200">Top Priority: Finish module</p>
                    <p className="text-xs text-slate-400 mt-1.5 sm:mt-2">3 focused sessions this week.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-3 sm:p-4 hover:bg-slate-900/60 transition-colors duration-200">
                    <p className="text-xs sm:text-sm font-medium text-slate-200">Momentum Boost</p>
                    <p className="text-xs text-slate-400 mt-1.5 sm:mt-2">Complete 1 task before noon daily.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-3 sm:p-4 hover:bg-slate-900/60 transition-colors duration-200">
                    <p className="text-xs sm:text-sm font-medium text-slate-200">Review Check-In</p>
                    <p className="text-xs text-slate-400 mt-1.5 sm:mt-2">20-min recap every 2 days.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reaction Sprint Game - Premium Enhanced */}
            <div className="relative rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-900/30 via-slate-900/60 to-purple-900/20 p-4 sm:p-5 md:p-6 shadow-2xl shadow-indigo-500/10 overflow-hidden hover:border-indigo-500/60 transition-all duration-300">
              {/* Background glow effect */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6 gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
                      <svg className="w-5 sm:w-6 h-5 sm:h-6 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="hidden sm:inline">Reaction Sprint</span>
                      <span className="sm:hidden">Sprint</span>
                    </h3>
                    <p className="text-xs text-indigo-300 mt-0.5 sm:mt-1">Test your focus</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex-shrink-0">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                    <span className="text-xs font-medium text-indigo-300">Live</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                  <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 px-2.5 sm:px-3 py-2.5 sm:py-3 hover:bg-slate-900/60 transition-colors duration-200">
                    <p className="text-xs text-slate-400">Best</p>
                    <p className="text-sm sm:text-lg font-bold text-indigo-300 mt-0.5 sm:mt-1">{reactionBest ? `${reactionBest}` : "--"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 px-2.5 sm:px-3 py-2.5 sm:py-3 hover:bg-slate-900/60 transition-colors duration-200">
                    <p className="text-xs text-slate-400">Tries</p>
                    <p className="text-sm sm:text-lg font-bold text-emerald-300 mt-0.5 sm:mt-1">{reactionStats.totalCompleted}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800/50 bg-slate-900/40 px-2.5 sm:px-3 py-2.5 sm:py-3 hover:bg-slate-900/60 transition-colors duration-200">
                    <p className="text-xs text-slate-400">Avg</p>
                    <p className="text-sm sm:text-lg font-bold text-amber-300 mt-0.5 sm:mt-1">{reactionStats.avg || "--"}</p>
                  </div>
                </div>

                {/* Game Display */}
                <div
                  className={`rounded-2xl border-2 px-4 sm:px-6 py-6 sm:py-8 transition-all duration-300 text-center ${
                    reactionState === "ready"
                      ? "border-emerald-500/60 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-lg shadow-emerald-500/20 scale-105"
                      : reactionState === "waiting"
                      ? "border-amber-500/60 bg-gradient-to-br from-amber-500/20 to-amber-600/10"
                      : "border-slate-700/50 bg-slate-900/40"
                  }`}
                >
                  <p className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-4">{reactionTime ? `${reactionTime}ms` : "--"}</p>
                  <p className={`text-xs sm:text-sm font-medium transition-colors ${
                    reactionState === "ready" ? "text-emerald-300 animate-pulse" : "text-slate-300"
                  }`}>
                    {reactionMessage}
                  </p>
                </div>

                {/* Premium Button Layout */}
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-4 sm:mt-5 md:mt-6">
                  <button
                    onClick={handleReactionStart}
                    className="flex-1 group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-200 active:scale-95"
                  >
                    <span className="relative z-10">Start</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>
                  <button
                    onClick={handleReactionTap}
                    disabled={reactionState === "idle"}
                    className="flex-1 rounded-xl border-2 border-indigo-500/60 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    Tap Now
                  </button>
                </div>
                <p className="mt-3 sm:mt-4 text-xs text-slate-400 text-center">Green → Tap for your time!</p>
              </div>
            </div>


          </div>

          {/* Right Sidebar - Creation & Tools */}
          <div className="md:col-span-1 lg:col-span-3 space-y-4 sm:space-y-5 md:space-y-6 lg:sticky lg:top-28 self-start min-w-0">
            
            {/* Create Task Card */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/90 backdrop-blur-sm rounded-3xl border border-slate-800/60 p-4 sm:p-5 md:p-6 shadow-2xl hover:border-slate-700/60 transition-all duration-300">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 blur-lg rounded-full opacity-50"></div>
                  <div className="relative p-2.5 sm:p-3 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800/60">
                    <svg className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">Create Task</h2>
                  <p className="text-xs sm:text-sm text-slate-400 truncate">Add to your study plan</p>
                </div>
              </div>
              <TaskForm onCreate={handleCreateTask} creating={creating} />
            </div>

            {/* Study Assistant Card */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 backdrop-blur-sm rounded-3xl border border-indigo-800/30 p-4 sm:p-5 md:p-6 shadow-2xl hover:border-indigo-700/50 transition-all duration-300">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 blur-lg rounded-full opacity-30"></div>
                  <div className="relative p-2.5 sm:p-3 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800/60">
                    <svg className="w-5 sm:w-6 h-5 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">AI Assistant</h2>
                  <p className="text-xs sm:text-sm text-indigo-300 truncate">Study coach</p>
                </div>
              </div>
              <StudyAssistant />
            </div>

            {/* Focus Timer */}
            <div id="focus-timer" className="bg-gradient-to-br from-emerald-900/20 to-cyan-900/10 backdrop-blur-sm rounded-3xl border border-emerald-800/30 p-4 sm:p-5 md:p-6 shadow-2xl hover:border-emerald-700/50 transition-all duration-300">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-3 sm:mb-4 md:mb-5 flex items-center gap-2">
                <svg className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Focus Timer</span>
                <span className="sm:hidden">Timer</span>
              </h3>
              <div className="text-center py-4 sm:py-6">
                <div className="text-xs uppercase tracking-[0.3em] text-emerald-300 mb-2">
                  {timerMode === "work" ? "Focus" : "Break"}
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-4">{formatTime(timerSeconds)}</div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <button
                    onClick={handleTimerStart}
                    disabled={timerRunning}
                    className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start
                  </button>
                  <button
                    onClick={handleTimerPause}
                    disabled={!timerRunning}
                    className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pause
                  </button>
                  <button
                    onClick={handleTimerReset}
                    className="px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800/50 transition-all"
                  >
                    Reset
                  </button>
                </div>
                <div className="mt-3 sm:mt-4 text-xs text-slate-400">
                  Pomodoro Technique • 25 min work, 5 min break
                </div>
              </div>
            </div>

            {/* Daily Insights */}
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-4 sm:p-5 shadow-xl hover:border-slate-700/50 transition-all duration-300">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden sm:inline">Daily Insight</span>
                <span className="sm:hidden">Insight</span>
              </h3>
              <div className="space-y-2.5 sm:space-y-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-200">
                  <p className="text-xs sm:text-sm text-slate-300">"Small daily improvements are the key to staggering long-term results."</p>
                  <p className="text-xs text-slate-500 mt-1.5 sm:mt-2">— Study Principle</p>
                </div>
                <div className="text-xs text-slate-400 space-y-1.5 sm:space-y-2">
                  <p>• Peak productivity: 10 AM - 12 PM</p>
                  <p>• High-priority first</p>
                  <p>• Take regular breaks</p>
                </div>
              </div>
            </div>

            {/* Streak Tracker */}
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 p-4 sm:p-5 shadow-xl hover:border-slate-700/50 transition-all duration-300">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden sm:inline">Streak Tracker</span>
                <span className="sm:hidden">Streak</span>
              </h3>
              <div className="flex items-center justify-between rounded-xl border border-slate-800/50 bg-slate-900/40 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-900/60 transition-colors duration-200">
                <div>
                  <div className="text-xs text-slate-400">Current</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">{streak.current}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">Days</div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-semibold text-indigo-300">
                    🔥
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Longest</div>
                  <div className="text-lg sm:text-xl font-semibold text-indigo-300">{streak.longest}</div>
                </div>
              </div>
              <button
                onClick={handleCheckIn}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs sm:text-sm font-medium text-white hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 active:scale-95"
              >
                Check in today
              </button>
              <div className="mt-2 text-xs text-slate-500 text-center">
                Last: {streak.lastCheckIn || "Never"}
              </div>
            </div>
          </div>
        </main>

        {/* Enhanced Footer */}
        <footer className="mt-10 sm:mt-12 md:mt-14 lg:mt-16 pt-6 sm:pt-8 border-t border-slate-800/30">
          <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs sm:text-sm text-slate-400">Status: <span className="text-emerald-400">Operational</span></span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                <span className="text-xs sm:text-sm text-slate-500">{tasks.length} tasks</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
                <button
                  onClick={() => setInfoModal("help")}
                  className="hover:text-slate-300 transition-colors duration-200"
                >
                  Help
                </button>
                <button
                  onClick={() => setInfoModal("privacy")}
                  className="hover:text-slate-300 transition-colors duration-200"
                >
                  Privacy
                </button>
                <button
                  onClick={() => setInfoModal("terms")}
                  className="hover:text-slate-300 transition-colors duration-200"
                >
                  Terms
                </button>
              </div>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800/50 text-slate-300 hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                </svg>
                Back to top
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center text-xs text-slate-600">
            Smart Study Planner v2.0 • Designed for academic excellence • © {new Date().getFullYear()}
          </div>
        </footer>
      </div>

      {activeInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{activeInfo.title}</h3>
              <button
                onClick={() => setInfoModal(null)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{activeInfo.body}</p>
            <div className="mt-6 text-right">
              <button
                onClick={() => setInfoModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => document.getElementById('task-form-title')?.focus()}
        className="fixed bottom-8 right-8 p-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 active:scale-95 transition-all z-50"
        aria-label="Create new task"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}