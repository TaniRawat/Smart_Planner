// src/components/Toast.jsx - Toast notification system
import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let toastId = 0;

const toastStore = {
  toasts: [],
  listeners: [],
  
  subscribe: (listener) => {
    toastStore.listeners.push(listener);
    return () => {
      toastStore.listeners = toastStore.listeners.filter(l => l !== listener);
    };
  },
  
  notify: (message, type = 'info', duration = 3000) => {
    const id = toastId++;
    const toast = { id, message, type };
    toastStore.toasts = [...toastStore.toasts, toast];
    toastStore.listeners.forEach(l => l());
    
    if (duration > 0) {
      setTimeout(() => {
        toastStore.toasts = toastStore.toasts.filter(t => t.id !== id);
        toastStore.listeners.forEach(l => l());
      }, duration);
    }
    
    return id;
  }
};

export const useToast = () => {
  const [toasts, setToasts] = React.useState(toastStore.toasts);
  
  React.useEffect(() => {
    const unsubscribe = toastStore.subscribe(() => {
      setToasts([...toastStore.toasts]);
    });
    return unsubscribe;
  }, []);
  
  return {
    success: (msg, duration) => toastStore.notify(msg, 'success', duration),
    error: (msg, duration) => toastStore.notify(msg, 'error', duration),
    info: (msg, duration) => toastStore.notify(msg, 'info', duration),
    warning: (msg, duration) => toastStore.notify(msg, 'warning', duration),
    toasts
  };
};

const Toast = ({ id, message, type, onClose }) => {
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        padding: '16px 24px',
        marginBottom: '12px',
        backgroundColor: colors[type],
        color: type === 'warning' ? '#333' : 'white',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: '300px'
      }}
    >
      <span>{message}</span>
      <button
        onClick={() => onClose(id)}
        style={{
          background: 'none',
          border: 'none',
          color: type === 'warning' ? '#333' : 'white',
          cursor: 'pointer',
          fontSize: '20px',
          marginLeft: '16px'
        }}
      >
        ×
      </button>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      maxWidth: '400px'
    }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => {
              toastStore.toasts = toastStore.toasts.filter(t => t.id !== toast.id);
              toastStore.listeners.forEach(l => l());
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default useToast;
