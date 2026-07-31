import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { findSchoolByCode, updateSchoolLogo } from '../firebase/auth';
import { validateLogoFile, fileToBase64 } from '../utils/logoImage';
import i18n, { applyDirection } from '../i18n';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  school: {
    name: 'Kayd',
    code: 'XRN-2026',
    address: 'Hargeysa, Somaliland',
    phone: '+252 63 123 4567',
    email: 'info@kayd.com',
    logo: null, // base64 data URI ee sawirka logo-ga dugsiga, lagu kaydiyay Firestore
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
  const { profile } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState(null);

  const updateSchool = (fields) => {
    setSettings((prev) => ({ ...prev, school: { ...prev.school, ...fields } }));
  };

  // Marka user-ku login-geeyo, soo qaad logo-ga dugsigiisa ee horey loo kaydiyay Firestore
  useEffect(() => {
    if (!profile?.schoolCode) return;
    let cancelled = false;

    findSchoolByCode(profile.schoolCode).then((school) => {
      if (!cancelled && school?.logo) {
        updateSchool({ logo: school.logo });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [profile?.schoolCode]);

  const uploadLogo = async (file) => {
    if (!profile?.schoolCode) {
      throw new Error('Lama helin school code-ka akoonkaaga.');
    }
    setLogoUploading(true);
    setLogoError(null);
    try {
      validateLogoFile(file);
      const base64 = await fileToBase64(file);
      await updateSchoolLogo(profile.schoolCode, base64);
      updateSchool({ logo: base64 });
      return base64;
    } catch (err) {
      setLogoError(err.message || 'Khalad ayaa dhacay markii sawirka la soo gelinayay.');
      throw err;
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!profile?.schoolCode) return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      await updateSchoolLogo(profile.schoolCode, null);
      updateSchool({ logo: null });
    } catch (err) {
      setLogoError(err.message || 'Khalad ayaa dhacay markii sawirka la tirtirayay.');
      throw err;
    } finally {
      setLogoUploading(false);
    }
  };

  // Marka luuqadda la beddelo (Settings), turjumaadda (i18next) iyo direction-ka
  // dukumeenka (LTR/RTL) ayaa si toos ah isu cusbooneysiinaya.
  useEffect(() => {
    i18n.changeLanguage(settings.language);
    applyDirection(settings.language);
  }, [settings.language]);

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
    uploadLogo,
    removeLogo,
    logoUploading,
    logoError,
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