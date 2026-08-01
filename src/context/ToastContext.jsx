// context/ToastContext.jsx
// Wargelin gaaban (toast) oo ku muuqda geeska bogga — waxaa loo isticmaalaa
// in la ogeysiiyo isticmaaluhu marka isku day Firestore ah (qoris/akhris) uu
// ku guuldareysto, halkii uu ku eegi lahaa kaliya console-ka (fiiri
// SchoolDataContext.jsx iyo bogagga kale ee isticmaala showToast).

import { createContext, useContext, useState, useCallback } from 'react';
import './ToastContext.css';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type, message) => {
    idCounter += 1;
    const id = idCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => dismissToast(id), 6000);
  }, [dismissToast]);

  const showError = useCallback((message) => showToast('error', message), [showToast]);
  const showSuccess = useCallback((message) => showToast('success', message), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.type}`} onClick={() => dismissToast(t.id)}>
            <span>{t.message}</span>
            <button className="toast-close" onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}>&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast waa in loo isticmaalaa gudaha <ToastProvider>');
  }
  return context;
}
