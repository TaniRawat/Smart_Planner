// src/api.js - COMPLETE FIXED VERSION WITH BACKEND FALLBACK
import axios from "axios";

// Firebase configuration
const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const DEV_BACKEND_FALLBACK = "http://localhost:8000";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? DEV_BACKEND_FALLBACK : "");
const TOKEN_KEY = "firebase_id_token";
const LEGACY_TOKEN_KEY = "sp_token";
const USER_KEY = "firebase_user";

// Check if Firebase API key is valid (not a dummy key)
const IS_FIREBASE_ENABLED = FIREBASE_API_KEY && 
  !FIREBASE_API_KEY.includes("Dummy") && 
  !FIREBASE_API_KEY.includes("dummy") &&
  !FIREBASE_API_KEY.includes("placeholder") &&
  FIREBASE_API_KEY.startsWith("AIza");

if (!IS_FIREBASE_ENABLED) {
  console.warn("⚠ Firebase disabled: using placeholder or dummy API key. Backend authentication only.");
}

// Separate axios instances for Firebase and your backend
const firebaseAxios = axios.create({
  baseURL: `https://identitytoolkit.googleapis.com/v1`,
  params: { key: FIREBASE_API_KEY },
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

const backendAxios = axios.create({
  baseURL: `${BACKEND_URL || ""}/api/v1`,
  timeout: 15_000,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json"
  },
});

// Add request interceptor to attach token to all requests
backendAxios.interceptors.request.use(
  (config) => {
    // Get the most recent token from storage or in-memory
    const token = idToken || 
                  sessionStorage.getItem(TOKEN_KEY) || 
                  sessionStorage.getItem(LEGACY_TOKEN_KEY) ||
                  localStorage.getItem(TOKEN_KEY) || 
                  localStorage.getItem(LEGACY_TOKEN_KEY);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      idToken = token; // Update in-memory token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// In-memory storage
let currentUser = null;
let idToken = null;

// Initialize token from storage on module load
(function initializeTokenFromStorage() {
  const storedToken = 
    sessionStorage.getItem(TOKEN_KEY) || 
    sessionStorage.getItem(LEGACY_TOKEN_KEY) ||
    localStorage.getItem(TOKEN_KEY) || 
    localStorage.getItem(LEGACY_TOKEN_KEY);
  
  if (storedToken) {
    idToken = storedToken;
    backendAxios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
  }
})();

/* ----------------- Token Management ----------------- */

export function setAuthToken(token, { persist = true } = {}) {
  if (token) {
    idToken = token;
    backendAxios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (persist) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(LEGACY_TOKEN_KEY, token);
      try {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(LEGACY_TOKEN_KEY);
      } catch {
        // ignore session storage errors
      }
    } else {
      try {
        sessionStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(LEGACY_TOKEN_KEY, token);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
      } catch {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(LEGACY_TOKEN_KEY, token);
      }
    }
  } else {
    clearAuthData();
  }
}

export function setAuthData(userData, token, { persist = true } = {}) {
  currentUser = userData;
  idToken = token;
  
  try {
    if (userData && token) {
      if (persist) {
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(LEGACY_TOKEN_KEY, token);
        try {
          sessionStorage.removeItem(USER_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(LEGACY_TOKEN_KEY);
        } catch {
          // ignore session storage errors
        }
      } else {
        try {
          sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
          sessionStorage.setItem(TOKEN_KEY, token);
          sessionStorage.setItem(LEGACY_TOKEN_KEY, token);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(LEGACY_TOKEN_KEY);
        } catch {
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(LEGACY_TOKEN_KEY, token);
        }
      }
      backendAxios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      clearAuthData();
    }
  } catch (error) {
    console.warn("LocalStorage access failed:", error);
    if (token) {
      backendAxios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }
}

export function clearAuthData() {
  currentUser = null;
  idToken = null;
  
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch (error) {
    // Ignore localStorage errors
  }
  
  delete backendAxios.defaults.headers.common["Authorization"];
}

export function getCurrentUser() {
  if (currentUser) return currentUser;
  
  try {
    const stored = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
    if (stored) {
      currentUser = JSON.parse(stored);
      return currentUser;
    }
  } catch (error) {
    console.warn("Failed to read user from storage:", error);
  }
  return null;
}

export function getIdToken() {
  // Check in-memory first
  if (idToken) return idToken;
  
  try {
    // Then check storage and update in-memory
    const stored =
      sessionStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(LEGACY_TOKEN_KEY) ||
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem(LEGACY_TOKEN_KEY);
    if (stored) {
      idToken = stored;
      // Ensure axios header is set
      backendAxios.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
      return idToken;
    }
  } catch (error) {
    console.warn("Failed to read token from storage:", error);
  }
  return null;
}

/* ----------------- Firebase Authentication ----------------- */

export async function signInWithEmail(email, password) {
  // If Firebase is disabled, use backend authentication
  if (!IS_FIREBASE_ENABLED) {
    return signInWithBackend(email, password);
  }
  
  try {
    const response = await firebaseAxios.post("/accounts:signInWithPassword", {
      email: email.trim(),
      password: password,
      returnSecureToken: true,
    });
    
    const { idToken: token, localId, email: userEmail, displayName } = response.data;
    
    const userData = {
      uid: localId,
      email: userEmail,
      name: displayName || userEmail.split('@')[0],
      token: token,
    };
    
    setAuthData(userData, token);
    return { user: userData, token };
    
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

// Backend-only authentication (for development without Firebase)
export async function signInWithBackend(email, password) {
  try {
    const response = await backendAxios.post("/auth/login", {
      email: email.trim(),
      password: password,
    });
    
    const { access_token: token, user } = response.data;
    
    const userData = user || {
      id: email,
      email: email,
      name: email.split('@')[0],
    };
    
    setAuthData(userData, token);
    return { user: userData, token };
    
  } catch (error) {
    throw handleBackendError(error);
  }
}

export async function signUpWithEmail(email, password, displayName = null) {
  // If Firebase is disabled, use backend registration
  if (!IS_FIREBASE_ENABLED) {
    return signUpWithBackend(email, password, displayName);
  }
  
  try {
    const response = await firebaseAxios.post("/accounts:signUp", {
      email: email.trim(),
      password: password,
      displayName: displayName || email.split('@')[0],
      returnSecureToken: true,
    });
    
    const { idToken: token, localId, email: userEmail, displayName: name } = response.data;
    
    const userData = {
      uid: localId,
      email: userEmail,
      name: name || userEmail.split('@')[0],
      token: token,
    };
    
    setAuthData(userData, token);
    return { user: userData, token };
    
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

// Backend-only registration (for development without Firebase)
export async function signUpWithBackend(email, password, displayName = null) {
  try {
    const response = await backendAxios.post("/auth/register", {
      email: email.trim(),
      password: password,
      name: displayName || email.split('@')[0],
    });
    
    const { access_token: token, user } = response.data;
    
    const userData = user || {
      id: email,
      email: email,
      name: displayName || email.split('@')[0],
    };
    
    setAuthData(userData, token);
    return { user: userData, token };
    
  } catch (error) {
    throw handleBackendError(error);
  }
}

export async function sendPhoneOTP(phoneNumber) {
  try {
    const response = await backendAxios.post("/auth/send-otp", {
      phone_number: phoneNumber,
    });
    return response.data;
  } catch (error) {
    throw handleBackendError(error);
  }
}

export async function verifyPhoneOTP(verificationId, otp) {
  try {
    const response = await backendAxios.post("/auth/verify-otp", {
      verification_id: verificationId,
      otp: otp,
    });
    
    const { user, token } = response.data;
    setAuthData(user, token);
    return { user, token };
    
  } catch (error) {
    throw handleBackendError(error);
  }
}

export async function signOut() {
  clearAuthData();
  return { success: true };
}

export async function getCurrentFirebaseUser() {
  const token = getIdToken();
  if (!token) {
    throw new Error("No authentication token found");
  }
  
  try {
    const response = await firebaseAxios.post("/accounts:lookup", { idToken: token });
    return response.data.users[0];
  } catch (error) {
    clearAuthData();
    throw handleFirebaseError(error);
  }
}

/* ----------------- Backend API Functions ----------------- */

backendAxios.interceptors.request.use((config) => {
  const token = getIdToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

backendAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      clearAuthData();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sp:auth-expired", { detail: { status } }));
      }
    }
    return Promise.reject(error);
  }
);

export async function verifyTokenWithBackend() {
  try {
    const token = getIdToken();
    if (!token) {
      throw new Error("No token available");
    }
    
    const response = await backendAxios.post("/auth/verify", {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
    
  } catch (error) {
    throw handleBackendError(error);
  }
}

export async function getUserProfile() {
  try {
    const response = await backendAxios.get("/users/me");
    return response.data;
  } catch (error) {
    throw handleBackendError(error);
  }
}

/* ----------------- COMPATIBILITY FUNCTIONS (For your existing code) ----------------- */

// For App.jsx, Login.jsx, Register.jsx compatibility
export async function loginUser(email, password) {
  const result = await signInWithEmail(email, password);
  return {
    access_token: result.token,
    user: result.user
  };
}

export async function registerUser(email, password, username = null, full_name = null) {
  const result = await signUpWithEmail(email, password, full_name || username);
  return {
    access_token: result.token,
    user: result.user
  };
}

// This replaces fetchCurrentUser for App.jsx
export async function fetchCurrentUser() {
  try {
    return await getUserProfile();
  } catch (error) {
    // Fallback to Firebase user if backend fails
    const firebaseUser = getCurrentUser();
    if (firebaseUser) {
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.name,
        ...firebaseUser
      };
    }
    throw error;
  }
}

// For App.jsx logout
export function logout() {
  clearAuthData();
  return { success: true, message: "Logged out" };
}

/* ----------------- Tasks API (For Dashboard.jsx) ----------------- */

function mapPriorityToEnum(value) {
  if (typeof value === "string") return value.toLowerCase();
  const num = Number(value);
  if (Number.isNaN(num)) return "medium";
  if (num <= 2) return "low";
  if (num === 3) return "medium";
  if (num === 4) return "high";
  return "critical";
}

function mapPriorityToNumber(value) {
  if (typeof value === "number") return value;
  const normalized = typeof value === "string" ? value.toLowerCase() : "medium";
  if (normalized === "low") return 1;
  if (normalized === "high") return 4;
  if (normalized === "critical") return 5;
  return 3;
}

function normalizeStatus(value) {
  if (typeof value === "string") return value.toLowerCase();
  return value;
}

function normalizeTaskPayload(taskData = {}) {
  const payload = { ...taskData };

  if ("priority" in payload) {
    payload.priority = mapPriorityToEnum(payload.priority);
  }

  if ("status" in payload) {
    payload.status = normalizeStatus(payload.status);
  }

  if ("done" in payload) {
    payload.status = payload.done ? "done" : "todo";
    delete payload.done;
  }

  if ("completed" in payload) {
    payload.status = payload.completed ? "done" : "todo";
    delete payload.completed;
  }

  if ("deadline" in payload) {
    if (payload.deadline) {
      const parsed = new Date(payload.deadline);
      payload.due_date = Number.isNaN(parsed.getTime()) ? payload.deadline : parsed.toISOString();
    } else {
      payload.due_date = null;
    }
  }

  if ("due_date" in payload && payload.due_date) {
    const parsed = new Date(payload.due_date);
    if (!Number.isNaN(parsed.getTime())) {
      payload.due_date = parsed.toISOString();
    }
  }

  return payload;
}

function normalizeTaskResponse(task) {
  if (!task || typeof task !== "object") return task;
  const normalized = { ...task };

  if ("priority" in normalized) {
    normalized.priority = mapPriorityToNumber(normalized.priority);
  }

  if ("status" in normalized) {
    normalized.done = String(normalized.status).toLowerCase() === "done";
  }

  if (!("deadline" in normalized)) {
    normalized.deadline = normalized.due_date ?? normalized.deadline ?? null;
  }

  return normalized;
}

function normalizeTaskListResponse(data, filters = {}) {
  if (Array.isArray(data)) {
    const items = data.map(normalizeTaskResponse);
    return {
      items,
      total: items.length,
      skip: filters.skip ?? 0,
      limit: filters.limit ?? items.length,
      has_more: false,
    };
  }

  if (data && Array.isArray(data.items)) {
    return {
      ...data,
      items: data.items.map(normalizeTaskResponse),
    };
  }

  if (data && Array.isArray(data.tasks)) {
    const items = data.tasks.map(normalizeTaskResponse);
    return {
      items,
      total: data.total ?? items.length,
      skip: filters.skip ?? 0,
      limit: filters.limit ?? items.length,
      has_more: false,
    };
  }

  return {
    items: [],
    total: 0,
    skip: filters.skip ?? 0,
    limit: filters.limit ?? 0,
    has_more: false,
  };
}

// Note: These might have different function names in your backend
export async function getTasks(filters = {}) {
  try {
    const response = await backendAxios.get("/tasks", { params: filters });
    return normalizeTaskListResponse(response.data, filters);
  } catch (error) {
    throw handleBackendError(error);
  }
}

// Alias functions for Dashboard.jsx compatibility
export const listTasks = getTasks;
export const fetchTasks = getTasks;

export async function createTask(taskData) {
  try {
    const response = await backendAxios.post("/tasks", normalizeTaskPayload(taskData));
    const task = response.data?.task ?? response.data;
    return normalizeTaskResponse(task);
  } catch (error) {
    throw handleBackendError(error);
  }
}

export async function updateTask(taskId, updates) {
  try {
    const response = await backendAxios.put(`/tasks/${taskId}`, normalizeTaskPayload(updates));
    const task = response.data?.task ?? response.data;
    return normalizeTaskResponse(task);
  } catch (error) {
    throw handleBackendError(error);
  }
}

// Alias for Dashboard.jsx
export const patchTask = updateTask;

export async function deleteTask(taskId) {
  try {
    await backendAxios.delete(`/tasks/${taskId}`);
    return { success: true };
  } catch (error) {
    throw handleBackendError(error);
  }
}

/* ----------------- AI Services (For Notes.jsx) ----------------- */

export async function summarizeText(text) {
  try {
    const response = await backendAxios.post("/ai/summarize", { text });
    return response.data;
  } catch (error) {
    throw handleBackendError(error);
  }
}

// Alias for Notes.jsx
export const aiSummarize = summarizeText;

export async function breakDownTask(title, description = "", nSubtasks = 5) {
  try {
    const response = await backendAxios.post("/ai/breakdown", {
      title,
      description,
      n_subtasks: nSubtasks,
    });
    return response.data;
  } catch (error) {
    throw handleBackendError(error);
  }
}

export const aiBreakdown = breakDownTask;

/* ----------------- Study Features ----------------- */

export async function getStudySessions() {
  try {
    const response = await backendAxios.get("/study/sessions");
    return response.data;
  } catch (error) {
    throw handleBackendError(error);
  }
}

export async function createStudySession(sessionData) {
  try {
    const response = await backendAxios.post("/study/sessions", sessionData);
    return response.data;
  } catch (error) {
    throw handleBackendError(error);
  }
}

/* ----------------- Error Handlers ----------------- */

function handleFirebaseError(error) {
  if (error.response) {
    const { data, status } = error.response;
    
    let message = "Authentication failed";
    if (data.error) {
      switch (data.error.message) {
        case "EMAIL_NOT_FOUND":
        case "INVALID_EMAIL":
          message = "Email not found or invalid";
          break;
        case "INVALID_PASSWORD":
          message = "Invalid password";
          break;
        case "USER_DISABLED":
          message = "This account has been disabled";
          break;
        case "EMAIL_EXISTS":
          message = "This email is already registered";
          break;
        case "OPERATION_NOT_ALLOWED":
          message = "This sign-in method is not allowed";
          break;
        case "TOO_MANY_ATTEMPTS_TRY_LATER":
          message = "Too many attempts. Please try again later";
          break;
        default:
          message = data.error.message || "Authentication error";
      }
    }
    
    const err = new Error(message);
    err.status = status;
    err.code = data.error?.message;
    return err;
  }
  
  if (error.request) {
    const err = new Error("Network error. Please check your connection.");
    err.status = 0;
    return err;
  }
  
  return error;
}

function handleBackendError(error) {
  if (error.response) {
    const { data, status } = error.response;
    const message = data.detail || data.message || data.error || "Request failed";
    const err = new Error(message);
    err.status = status;
    err.data = data;
    return err;
  }
  
  if (error.request) {
    const err = new Error("Cannot connect to server. Please check your connection.");
    err.status = 0;
    return err;
  }
  
  return error;
}

/* ----------------- Initialize ----------------- */

(function initAuth() {
  const token = getIdToken();
  const user = getCurrentUser();
  
  if (token && user) {
    backendAxios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("Auth initialized from storage");
  }
})();

if (!BACKEND_URL && import.meta.env.PROD) {
  console.warn("VITE_BACKEND_URL is not set. API requests will use /api/v1 on the same origin.");
}

if (!FIREBASE_API_KEY && import.meta.env.PROD) {
  console.warn("VITE_FIREBASE_API_KEY is not set. Firebase auth will fail in production.");
}

/* ----------------- Export ----------------- */

export default {
  // Auth (compatibility)
  loginUser,
  registerUser,
  fetchCurrentUser,
  setAuthToken,
  logout,
  signOut,
  
  // Firebase Auth
  signInWithEmail,
  signUpWithEmail,
  sendPhoneOTP,
  verifyPhoneOTP,
  getCurrentUser,
  verifyTokenWithBackend,
  getUserProfile,
  
  // Tasks
  getTasks,
  listTasks,
  fetchTasks,
  createTask,
  updateTask,
  patchTask,
  deleteTask,
  
  // AI
  summarizeText,
  aiSummarize,
  breakDownTask,
  
  // Study
  getStudySessions,
  createStudySession,
  
  // Utility
  clearAuthData,
  
  // Axios instances
  firebaseAxios,
  backendAxios,
};