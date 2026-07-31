import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { SettingsProvider } from './context/SettingsContext';
import { SchoolDataProvider } from './context/SchoolDataContext';
import i18n, { applyDirection } from './i18n';

applyDirection(i18n.language);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SettingsProvider>
          <SchoolDataProvider>
            <NotificationsProvider>
              <App />
            </NotificationsProvider>
          </SchoolDataProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);