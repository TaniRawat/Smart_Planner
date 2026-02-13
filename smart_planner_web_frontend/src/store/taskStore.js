// src/store/taskStore.js - Task management state
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as api from '../api';

const useTaskStore = create(
  devtools((set, get) => ({
    // State
    tasks: [],
    filteredTasks: [],
    currentFilter: { status: null, priority: null, search: null },
    isLoading: false,
    error: null,
    pagination: { skip: 0, limit: 50, total: 0 },
    
    // Actions
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    
    // Fetch tasks
    fetchTasks: async (filter = {}, skip = 0, limit = 50) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.getTasks({
          ...filter,
          skip,
          limit
        });
        
        set((state) => ({
          tasks: response.items || [],
          filteredTasks: response.items || [],
          pagination: {
            skip: skip,
            limit: limit,
            total: response.total || 0
          },
          currentFilter: filter,
          isLoading: false
        }));
        
        return response;
      } catch (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    
    // Create task
    createTask: async (taskData) => {
      set({ isLoading: true, error: null });
      try {
        const newTask = await api.createTask(taskData);
        set((state) => ({
          tasks: [newTask, ...state.tasks],
          filteredTasks: [newTask, ...state.filteredTasks],
          isLoading: false
        }));
        return newTask;
      } catch (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    
    // Update task
    updateTask: async (taskId, updates) => {
      set({ isLoading: true, error: null });
      try {
        const updated = await api.updateTask(taskId, updates);
        set((state) => ({
          tasks: state.tasks.map(t => t.id === taskId ? updated : t),
          filteredTasks: state.filteredTasks.map(t => t.id === taskId ? updated : t),
          isLoading: false
        }));
        return updated;
      } catch (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    
    // Delete task
    deleteTask: async (taskId) => {
      set({ isLoading: true, error: null });
      try {
        await api.deleteTask(taskId);
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== taskId),
          filteredTasks: state.filteredTasks.filter(t => t.id !== taskId),
          isLoading: false
        }));
      } catch (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    
    // Complete task
    completeTask: async (taskId, actualTime) => {
      set({ isLoading: true, error: null });
      try {
        const completed = await api.updateTask(taskId, { status: 'DONE' });
        set((state) => ({
          tasks: state.tasks.map(t => t.id === taskId ? completed : t),
          filteredTasks: state.filteredTasks.map(t => t.id === taskId ? completed : t),
          isLoading: false
        }));
        return completed;
      } catch (error) {
        set({ error: error.message, isLoading: false });
        throw error;
      }
    },
    
    // Search tasks
    searchTasks: (searchTerm) => {
      const allTasks = get().tasks;
      const filtered = allTasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      set({ filteredTasks: filtered });
    },
    
    // Filter by priority
    filterByPriority: (priority) => {
      const allTasks = get().tasks;
      const filtered = priority
        ? allTasks.filter(t => t.priority === priority)
        : allTasks;
      set({
        filteredTasks: filtered,
        currentFilter: { ...get().currentFilter, priority }
      });
    },
    
    // Clear error
    clearError: () => set({ error: null })
  }))
);

export default useTaskStore;
