import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { SettingsProvider } from './context/SettingsContext';
import { SchoolDataProvider } from './context/SchoolDataContext';
import i18n, { applyDirection } from './i18n';

applyDirection(i18n.language);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ToastProvider>
            <SettingsProvider>
              <SchoolDataProvider>
                <NotificationsProvider>
                  <App />
                </NotificationsProvider>
              </SchoolDataProvider>
            </SettingsProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);