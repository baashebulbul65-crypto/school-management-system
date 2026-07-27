import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  school: {
    name: 'Xarun',
    code: 'XRN-2026',
    address: 'Hargeysa, Somaliland',
    phone: '+252 63 123 4567',
    email: 'info@xarun.com',
  },
  language: 'so', // 'so' | 'en' | 'ar'
  currency: 'USD',
  timezone: 'Africa/Mogadishu',
  academicYear: { start: '2026-01-10', end: '2026-12-15' },
  feesByGrade: [
    { id: 1, grade: 'Form 1', amount: 120 },
    { id: 2, grade: 'Form 2', amount: 120 },
    { id: 3, grade: 'Form 3', amount: 130 },
    { id: 4, grade: 'Form 4', amount: 150 },
  ],
  notificationPrefs: {
    feeReminders: true,
    attendanceAlerts: true,
    examResults: true,
    emailDigest: false,
  },
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const updateSchool = (fields) => {
    setSettings((prev) => ({ ...prev, school: { ...prev.school, ...fields } }));
  };

  const updateLanguage = (language) => setSettings((prev) => ({ ...prev, language }));
  const updateCurrency = (currency) => setSettings((prev) => ({ ...prev, currency }));
  const updateTimezone = (timezone) => setSettings((prev) => ({ ...prev, timezone }));

  const updateAcademicYear = (fields) => {
    setSettings((prev) => ({ ...prev, academicYear: { ...prev.academicYear, ...fields } }));
  };

  const updateFee = (id, amount) => {
    setSettings((prev) => ({
      ...prev,
      feesByGrade: prev.feesByGrade.map((f) => (f.id === id ? { ...f, amount } : f)),
    }));
  };

  const addFeeGrade = (grade, amount) => {
    setSettings((prev) => ({
      ...prev,
      feesByGrade: [...prev.feesByGrade, { id: Date.now(), grade, amount }],
    }));
  };

  const removeFeeGrade = (id) => {
    setSettings((prev) => ({ ...prev, feesByGrade: prev.feesByGrade.filter((f) => f.id !== id) }));
  };

  const updateNotificationPref = (key, value) => {
    setSettings((prev) => ({ ...prev, notificationPrefs: { ...prev.notificationPrefs, [key]: value } }));
  };

  const value = {
    settings,
    updateSchool,
    updateLanguage,
    updateCurrency,
    updateTimezone,
    updateAcademicYear,
    updateFee,
    addFeeGrade,
    removeFeeGrade,
    updateNotificationPref,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings waa in loo isticmaalaa gudaha <SettingsProvider>');
  }
  return context;
}