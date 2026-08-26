import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { subscribeToSchool, upsertSchoolSettings, updateSchoolLogo } from '../firebase/schools';
import { validateLogoFile, fileToBase64 } from '../utils/logoImage';
import i18n, { applyDirection } from '../i18n';

const SettingsContext = createContext(null);

const LANGUAGE_STORAGE_KEY = 'xarun_language';

const DEFAULT_SETTINGS = {
  school: {
    name: 'Kayd',
    code: 'XRN-2026',
    address: 'Hargeysa, Somaliland',
    phone: '+252 63 123 4567',
    email: 'info@kayd.com',
    logo: null, // base64 data URI ee sawirka logo-ga dugsiga, lagu kaydiyay Firestore
  },
  language: 'so', // 'so' | 'en' | 'ar' — SHAKHSI AH (localStorage), ma aha Firestore, fiiri hoos
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

function readStoredLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_SETTINGS.language;
  } catch {
    return DEFAULT_SETTINGS.language;
  }
}

export function SettingsProvider({ children }) {
  const { profile } = useAuth();
  const { showError } = useToast();
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, language: readStoredLanguage() }));
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState(null);

  const reportError = (message, err) => {
    console.error(message, err);
    showError(message);
  };

  // ===== Xogta dugsiga (Firestore doc "schools/{schoolCode}") — magaca,
  // fees-by-grade, sanadka waxbarasho, notification prefs, iyo logo-ga.
  // 'language' GA MAAHAN halkan (fiiri hoos). =====
  useEffect(() => {
    if (!profile?.schoolCode) return undefined;
    const unsubscribe = subscribeToSchool(
      profile.schoolCode,
      (school) => {
        if (!school) return;
        setSettings((prev) => ({
          ...prev,
          school: {
            name: school.name ?? prev.school.name,
            code: school.code ?? prev.school.code,
            address: school.address ?? prev.school.address,
            phone: school.phone ?? prev.school.phone,
            email: school.email ?? prev.school.email,
            logo: school.logo ?? null,
          },
          currency: school.currency ?? prev.currency,
          timezone: school.timezone ?? prev.timezone,
          academicYear: school.academicYear ?? prev.academicYear,
          feesByGrade: school.feesByGrade ?? prev.feesByGrade,
          notificationPrefs: school.notificationPrefs ?? prev.notificationPrefs,
        }));
      },
      (err) => reportError('Khalad ayaa dhacay markii settings-ka dugsiga laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode]);

  const persistSchoolDoc = async (fields) => {
    if (!profile?.schoolCode) return;
    try {
      await upsertSchoolSettings(profile.schoolCode, fields);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii settings-ka dugsiga la kaydinayay:', err);
    }
  };

  const updateSchool = (fields) => {
    setSettings((prev) => ({ ...prev, school: { ...prev.school, ...fields } }));
    persistSchoolDoc(fields);
  };

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
      setSettings((prev) => ({ ...prev, school: { ...prev.school, logo: base64 } }));
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
      setSettings((prev) => ({ ...prev, school: { ...prev.school, logo: null } }));
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

  // Luuqadda waa doorasho SHAKHSI AH (browser-kan kaliya, localStorage) — kuma
  // kaydsana Firestore, si aan shaqaale kale (masalan owner-ka) uga bedelin
  // luuqadda kuwa kale marka uu Settings-ka wax ka beddelo.
  const updateLanguage = (language) => {
    setSettings((prev) => ({ ...prev, language }));
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // localStorage ma heli karin (privacy mode, iwm) — dhib kuma yeelan doonto UI-ga.
    }
  };

  const updateCurrency = (currency) => {
    setSettings((prev) => ({ ...prev, currency }));
    persistSchoolDoc({ currency });
  };

  const updateTimezone = (timezone) => {
    setSettings((prev) => ({ ...prev, timezone }));
    persistSchoolDoc({ timezone });
  };

  // Settings audit MEDIUM, 2026-08-26 — shantan function ee hoose waxay hore
  // u qaadan jireen qiimaha bilowga ah (academicYear/feesByGrade/
  // notificationPrefs) `settings` (closure-ka render-ka HADDA jira), ma ahayn
  // `prev` (functional-update-ka setSettings). Haddii laba wicitaan oo isku-
  // mid ah (tusaale: laba "tirtir fee-grade" oo degdeg ah) ay dhacaan ka hor
  // intii React-ku dib u render sameeyo (rare, laakiin macquul ah), mid-ka
  // labaad wuxuu isticmaali lahaa xog duugoobay — mid-ka hore wuu lumi lahaa
  // (Firestore-ka lagama badbaadin). Hadda qiimaha cusub waxaa lagu xisaabiyaa
  // GUDAHA updater-ka (`prev`, had iyo jeer qiimaha ugu dambeeya, xitaa
  // wicitaano isku-xiga oo isku-mar ah), balse `persistSchoolDoc` (Firestore
  // write-ga) waa la wadaa DIBADDA updater-ka — updater-yada setState waa
  // in ay "pure" ahaadaan (React StrictMode wuxuu laba jeer wici karaa si
  // uu u hubiyo), haddii network-call-ku gudaha updater-ka ku jiro, si
  // fudud ayuu Firestore-ka mar labaad ugu qori lahaa isla isbeddelka.
  const updateAcademicYear = (fields) => {
    let academicYear;
    setSettings((prev) => {
      academicYear = { ...prev.academicYear, ...fields };
      return { ...prev, academicYear };
    });
    persistSchoolDoc({ academicYear });
  };

  const updateFee = (id, amount) => {
    let feesByGrade;
    setSettings((prev) => {
      feesByGrade = prev.feesByGrade.map((f) => (f.id === id ? { ...f, amount } : f));
      return { ...prev, feesByGrade };
    });
    persistSchoolDoc({ feesByGrade });
  };

  const addFeeGrade = (grade, amount) => {
    let feesByGrade;
    setSettings((prev) => {
      feesByGrade = [...prev.feesByGrade, { id: Date.now(), grade, amount }];
      return { ...prev, feesByGrade };
    });
    persistSchoolDoc({ feesByGrade });
  };

  const removeFeeGrade = (id) => {
    let feesByGrade;
    setSettings((prev) => {
      feesByGrade = prev.feesByGrade.filter((f) => f.id !== id);
      return { ...prev, feesByGrade };
    });
    persistSchoolDoc({ feesByGrade });
  };

  const updateNotificationPref = (key, value) => {
    let notificationPrefs;
    setSettings((prev) => {
      notificationPrefs = { ...prev.notificationPrefs, [key]: value };
      return { ...prev, notificationPrefs };
    });
    persistSchoolDoc({ notificationPrefs });
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
